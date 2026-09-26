import Task from "./models/Task";
import TaskList from "./models/TaskList";
import { catchUpNextOccurrence, todayStr } from "./recurrence";

// Finds every due recurring task/list root for a company and spawns
// exactly one fresh clone each, advancing each root's own clock past any
// missed periods. Called whenever someone opens the Tasks hub (see
// /api/recurrence/run) - there's no separate always-on scheduler, so a
// recurring item's actual creation time is "whenever Tasks was next
// opened on or after its due date," not the exact moment the clock
// ticked over. A clone never carries its own frequency forward - only
// the root's clock decides when the next one gets made, so a clone can
// never independently start spawning clones of its own.
export async function runDueRecreations(companyId, userId) {
  const today = todayStr();
  const createdTasks = [];
  const createdLists = [];

  const dueTaskRoots = await Task.find({
    companyId,
    "recurrence.frequency": { $ne: null },
    "recurrence.active": true,
    "recurrence.nextOccurrenceDate": { $lte: today },
    recurrenceRootId: null,
  });
  for (const root of dueTaskRoots) {
    const clone = await Task.create({
      companyId,
      createdByUserId: userId,
      title: root.title,
      description: root.description,
      taskListId: root.taskListId,
      startDate: today,
      dueDate: today,
      status: "notStarted",
      assigneeUserIds: root.assigneeUserIds,
      assigneeTeamId: root.assigneeTeamId,
      raci: root.raci,
      tagIds: root.tagIds,
      dependencies: root.dependencies,
      recurrenceRootId: root._id,
    });
    createdTasks.push(clone);
    root.recurrence.nextOccurrenceDate = catchUpNextOccurrence(root.recurrence.nextOccurrenceDate, root.recurrence.frequency, today);
    await root.save();
  }

  const dueListRoots = await TaskList.find({
    companyId,
    "recurrence.frequency": { $ne: null },
    "recurrence.active": true,
    "recurrence.nextOccurrenceDate": { $lte: today },
    recurrenceRootId: null,
  });
  for (const root of dueListRoots) {
    const newList = await TaskList.create({
      companyId,
      createdByUserId: userId,
      name: `${root.name} (${today})`,
      description: root.description,
      startDate: today,
      dueDate: today,
      status: "notStarted",
      assigneeUserIds: root.assigneeUserIds,
      assigneeTeamId: root.assigneeTeamId,
      raci: root.raci,
      tagIds: root.tagIds,
      dependencies: [],
      recurrenceRootId: root._id,
    });
    createdLists.push(newList);

    // Clone every task currently in the root list, then remap any
    // dependency that pointed at another task *inside this same list* to
    // that task's new clone - a checklist's internal step order should
    // survive being recreated. A dependency pointing outside the list
    // (some other unrelated task/list) is left as-is, still pointing at
    // that original.
    const rootTasks = await Task.find({ companyId, taskListId: root._id });
    const oldToNewId = new Map();
    const clones = [];
    for (const t of rootTasks) {
      const clone = await Task.create({
        companyId,
        createdByUserId: userId,
        title: t.title,
        description: t.description,
        taskListId: newList._id,
        startDate: today,
        dueDate: today,
        status: "notStarted",
        assigneeUserIds: t.assigneeUserIds,
        assigneeTeamId: t.assigneeTeamId,
        raci: t.raci,
        tagIds: t.tagIds,
        dependencies: [],
      });
      oldToNewId.set(String(t._id), clone._id);
      clones.push({ clone, originalDependencies: t.dependencies });
      createdTasks.push(clone);
    }
    for (const { clone, originalDependencies } of clones) {
      const remapped = (originalDependencies || []).map((dep) =>
        dep.type === "task" && oldToNewId.has(String(dep.id))
          ? { type: "task", id: oldToNewId.get(String(dep.id)) }
          : dep
      );
      if (remapped.length > 0) {
        clone.dependencies = remapped;
        await clone.save();
      }
    }

    root.recurrence.nextOccurrenceDate = catchUpNextOccurrence(root.recurrence.nextOccurrenceDate, root.recurrence.frequency, today);
    await root.save();
  }

  return { createdTasks, createdLists };
}
