// Dependency status is computed, not stored - a task or list's "done"
// state can change independently of whatever depends on it, so baking a
// blocked flag into the database would just go stale. Purely
// informational (a "Blocked by" note), never enforced - nothing here
// stops anyone from starting or completing a task anyway, same honest,
// no-workflow-engine approach as the rest of Vecta.

// A TaskList has no status field of its own - it's "done" once every task
// that belongs to it is done (and it has at least one task; an empty list
// isn't meaningfully "done").
export function isListDone(listId, allTasks) {
  const tasksInList = (allTasks || []).filter((t) => String(t.taskListId) === String(listId));
  return tasksInList.length > 0 && tasksInList.every((t) => t.status === "done");
}

// Resolves one task's `dependencies` (each a {type, id} pointer) into
// human-readable, live status - label plus whether that dependency is
// currently satisfied.
export function resolveDependencies(task, allTasks, allTaskLists) {
  return (task.dependencies || []).map((dep) => {
    if (dep.type === "task") {
      const target = (allTasks || []).find((t) => String(t._id) === String(dep.id));
      return { type: "task", id: dep.id, label: target?.title || "Deleted task", done: target ? target.status === "done" : true };
    }
    const target = (allTaskLists || []).find((l) => String(l._id) === String(dep.id));
    return { type: "list", id: dep.id, label: target?.name || "Deleted list", done: target ? isListDone(target._id, allTasks) : true };
  });
}

export function isBlocked(task, allTasks, allTaskLists) {
  return resolveDependencies(task, allTasks, allTaskLists).some((d) => !d.done);
}
