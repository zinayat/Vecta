# Vecta

Building blocks for **Teams**, **Dashboards**, **Planning** (Hoshin Policy
Deployment), and **Projects** (A3 problem-solving and CapEx requests) - a
separate application from Smart Factories, sharing only the same class of
infrastructure (MongoDB + Vercel). Teams are the entry point: a team drives
the creation of its own main dashboard and tier boards, rather than those
being built independently and linked in after the fact.

## Stack

- Next.js 15 (App Router), single app - frontend and API routes together
- MongoDB via Mongoose
- Auth: hand-rolled JWT in an httpOnly cookie (bcrypt-hashed passwords), no
  third-party auth provider
- Tailwind CSS v4
- Multi-tenant: every document is scoped by `companyId`, resolved server-side
  from the signed-in user's session - never trusted from client input

## KPI Builder

A shared, rule-based "define a KPI" tool (`components/kpi/KpiBuilder.jsx`,
`lib/kpiBuilder.js`) embedded in all three places a KPI or success measure
gets defined - Dashboard KPI tiles, Hoshin strategy rows (Target/KPI
column), and a Project's Success Measure. Same three questions everywhere:

1. **What are we measuring?** - a label (e.g. "On-Time Delivery").
2. **How will success be measured?** - a measurement type (Percentage,
   Count, Currency, Duration, Ratio), a direction (higher or lower is
   better - so a KPI like "defect rate" or "# of incidents" is correctly
   judged as on/off-track, not backwards), a target, and a unit.
3. **What does success look like?** - a plain-language description, with a
   "Suggest" button that drafts one from the structured fields above.

The ✨ **Suggest** buttons are rule-based (keyword matching + templates),
not an LLM call - consistent with One-Click Tier Boards and Auto-Link KPIs;
Vecta has no AI/LLM integration configured. Given a label like "Defect
Rate," it suggests measurement type Percentage, direction "lower is
better," and drafts a success sentence once a target is set.

**Display mode is suggested too.** The first time a KPI's shape is
suggested, `suggestDisplay()` also picks a starting display - Percentage
measurements start as a percent, Duration or "lower is better" KPIs start
as a trend graph, everything else starts as a single number. This is a
one-time default, not a lock: it's only applied while the tile has no
display mode set yet, so choosing a different display afterward (or
re-clicking Suggest after editing the label) never overwrites a choice
you've already made.

### Settings tab (Dashboard KPI tiles)

Each KPI tile's edit form is split into two tabs - **Definition** (the KPI
Builder questions above) and **Settings**, which controls how the tile
looks and where its value comes from:

- **Category** - an optional Safety/Quality/Throughput/People/Cost tag.
- **Display** - Single value, Percent, or Graph (trend); graph mode adds a
  chart type choice (Line or Bar). The graph is self-describing rather than
  a bare sparkline: it labels both axes with their variable name and
  values - the x-axis shows "Date" plus the first and last plotted date,
  the y-axis shows "Value" (or the KPI's unit, e.g. "Value (%)") plus the
  min and max values reached, in muted text so the colored line/bars stay
  the only thing carrying the data itself. Every plotted point is reachable
  too, not just the axis min/max/first/last: hovering the graph shows a
  crosshair (line/single-point) or highlights the bar under the pointer,
  with a tooltip giving that exact point's date and value.
- **Target/Unit** - compared live against the current value to show an
  on/off-track gap indicator, same logic as the Success Measure card.
- **Data source** - where the tile's current value comes from:
  - **Manual** - a "Values by date" list rather than a single current-value
    field: add, edit, or remove a date/value row for whichever dates you
    have data for (backfilling past dates works fine). The current value
    is always the most recently dated row, and the full list is the
    tile's `history` for graph mode.
  - **Consolidation** - sum/count/average/min/max of other KPI tiles on the
    same dashboard (unchanged from the one-click generator).
  - **Linked** - mirrors another KPI tile's or a Project's Success
    Measure's current value live, one level deep (a linked tile can't
    itself be the target of another link, to avoid cycles). Picked via a
    dashboard/project dropdown (`components/kpi/LinkedSourcePicker.jsx`).
  - **API connected** - fetches a value from an external HTTP(S) JSON
    endpoint, extracted with a dot/bracket JSON path (e.g.
    `data.metrics[0].value`). The browser never calls the external API
    directly - a server-side proxy (`/api/kpi-fetch`) does the fetch, so
    third-party credentials never reach the client and the browser's CORS
    restrictions don't apply. The proxy requires an authenticated Vecta
    session, times out after 8s, caps the response at 1MB, and only
    accepts JSON. **Security caveat**: it blocks obvious internal
    hostnames (`localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `169.254.*`,
    `*.internal`) but this is a basic blocklist, not full SSRF hardening
    (no DNS-rebinding protection, no redirect re-validation) - don't point
    it at anything sensitive on a network Vecta's server can reach.
  - Manual/Linked/API-connected tiles can't also be consolidated into
    other tiles' math in a way that creates a cycle, since consolidation
    only reads sibling tiles' stored values, not their live source chains.

## Modules

- **Teams** (`/teams`) - first in the nav, and where work starts: a team
  is the driver behind its own dashboards and tier boards, not something
  set up after the fact. Each team has a `purpose` (why it exists) and a
  list of `outcomes` - Annual or Quarterly objectives, each optionally
  linked to a specific Breakthrough Objective on a Hoshin plan (same
  denormalized `hoshinLink` snapshot pattern KPI tiles use). From a
  team's own page:
  - **Main Dashboard** - a single general-purpose dashboard for the team
    (`Team.mainDashboardId`). "Create Main Dashboard" makes a real, empty
    Dashboard tagged with this team's id and opens it - nothing to find
    in a separate picker afterward. Once the team has tier boards, its
    Main Dashboard's own page shows them too, right under the header -
    same list, same order, as the Teams list page below, but reachable
    without leaving the dashboard you're actually looking at.
  - **Tier Boards** - pick a Hoshin plan and hit Generate to run the same
    One-Click generator dashboards use, except every tile is tagged with
    this team's id up front and the three new dashboards are added to
    the team's tier-board list automatically. A dashboard/section widget
    picker (unchanged from before) still lets you link any pre-existing
    dashboard as a tier board too, for boards that existed before this or
    that don't fit the generator.
  A dashboard created either way carries `Dashboard.teamId`, and its own
  page shows a "back to the team" link - the relationship reads in both
  directions. Admin/Manager only to create/edit, same as Planning.
  Distinct from the `/team` roster page below, which is unrelated (people
  and access, not organizational teams).

  **There's no separate "Dashboards" nav item or list page** - the Teams
  list page (`/teams`) is the single hub: each team's card lists its
  Main Dashboard, then its tier boards in **T1 → T2 → T3 order**, one per
  line (not wrapped inline chips), so the sequence always reads top to
  bottom the same way regardless of when each board was created. Any
  dashboard without a
  `teamId` (from before this existed, or never linked to a team) shows up
  in an **Unassigned Dashboards** section underneath the team list, so
  nothing becomes unreachable - it's just not a card of its own. A
  dashboard itself still lives at `/dashboards/:id`, including its own
  Delete button (with the same "will be deleted permanently" confirmation
  the old list page used to have) - deleting also clears the reference
  from its team, if it had one.
- **Dashboards** - name a board, add widgets (KPI, Note,
  Project List, Planning Summary, Timer, Section), edit or remove them. A
  Section is a full-width heading used to group the tiles beneath it, with
  a configurable accent color (a preset swatch or a custom color picker)
  that tints its heading text and underline. Widget
  config is a `type` + a free-form `config` object, so new widget types can
  be added later without migrating existing dashboards. Each dashboard has
  a **View/Edit mode toggle** - View hides all edit chrome for clean use in
  a meeting; Edit shows add/remove/configure controls. In Edit mode, every
  widget (KPI, Section, Timer, whatever) is **drag-to-reorder** - grab a
  tile and drop it in a new position; the grid re-flows itself since order
  is just array position, and the new order is saved once you drop. A KPI
  tile is also **resizable** - a small 1/2/3 button group in its
  bottom-right corner sets how many grid columns it spans (snapping to the
  grid's own tracks rather than free pixels, so a resized tile always
  stays aligned with its neighbors instead of leaving gaps). Plain click
  buttons rather than a drag handle, since a drag gesture there would have
  to coexist with the tile's own native drag-to-reorder listeners on the
  same element. A KPI tile's
  top caption shows its **category** (Safety/Quality/Throughput/People/
  Cost) once one's set, instead of the generic "KPI" label, with the KPI's
  own name directly beneath it - a custom widget title still takes
  priority over the category if you've set one. Whether it's linked to a
  plan is called out at the *bottom* of the tile - "Not yet linked to
  Planning," or a badge naming what it's linked to - rather than folded
  into the name up top.
  - **KPI tiles** are defined via the KPI Builder's Definition tab (see
    below), with a Settings tab controlling display (number/percent/graph,
    with line or bar chart type), category tag (colors the accent border
    in executive theme), target/gap indicator, and data source (manual,
    linked to another KPI or a Project's Success Measure, API-connected,
    or a **consolidation** of other KPI tiles on the same dashboard - sum,
    count, average, min, or max, user-selected). See "KPI Builder" above
    for the full Settings tab breakdown.
  - **One-Click Tier Boards** - generated from a Team's page (see Teams
    above) rather than a standalone route; pick a Hoshin
    plan, generates three dashboards in one step: T1 Daily Meeting, T2
    Weekly Meeting, T3 Monthly Meeting. Each is pre-organized into five
    **colored section headers**, always in the same order - **Safety**
    (red) → **Quality** (blue) → **Cost** (amber) → **Delivery/Throughput**
    (green) → **People** (purple) - each immediately followed by that
    category's own full-width KPI tile, keyword-matched against the plan's
    strategy rows (and their Targets/KPIs) where possible (rule-based, not
    an LLM call - Vecta has no AI/LLM integration configured). A tile's
    section color and the tile's own category-dot color are the same hex
    (`CATEGORY_COLORS`), so the header and its tile read as one colored
    block; the user only adds their own extra sections after that, instead
    of building the whole SQDCP layout from scratch. T1 shows tiles as
    plain numbers, T2/T3 as trend graphs. All three get a meeting timer
    and a notes tile; T2 adds an escalation note, T3 adds a live Planning
    Summary and an Active Projects list. Generated dashboards use the
    `theme: "executive"` style (larger numbers, more whitespace, category
    accent colors) and are tagged with their tier + source plan, and (since
    they're generated from a Team's page) their team, so they group
    correctly wherever they show up - as chips on that team's card, tier
    badges included.
  - **Auto-Link KPIs** - a button in Edit mode on any dashboard with at
    least one KPI tile. Bulk-matches every *unlinked* KPI tile (its label
    and category) against a Hoshin plan's Breakthrough Objectives, Annual
    Objectives, and strategy rows - scoped to the dashboard's own plan if
    it has one, otherwise searched across every plan in the company - and
    links the best confident match, prefilling an empty/placeholder label
    and, when matched to a strategy with a target, the target too. Same
    rule-based matching the one-click generator uses (`lib/hoshinAutoLink.js`),
    just runnable on demand on any dashboard, not only freshly-generated
    ones. A linked tile shows a small badge naming what it's tied to.
- **Planning** (`/hoshin`) - Hoshin Policy Deployment. The plan editor at `/hoshin/:id`
  is a spreadsheet-style cascade table rather than four independent lists:
  **Breakthrough Objective** (3-5yr) → **Annual Objective** (1yr) →
  **Strategy/Project**, each strategy row carrying its own **Target/KPI**
  and **Owner** - the standard 5-column Hoshin catchball table, expressed as
  nested arrays (`HoshinPlan.breakthroughObjectives[].annualObjectives[].strategies[]`)
  so the UI can group rows by objective instead of repeating text in every
  row. Add/edit/remove at every level; a ✨ button on each strategy's
  Target/KPI cell opens the KPI Builder to define it properly rather than
  typing a bare string. `/hoshin/:id/xmatrix` renders the
  classic X-Matrix layout on top of the same tree (flattened): south =
  Breakthrough Objectives, west = Annual Objectives, north = actual
  **Project** records linked to this plan (live, via `Project.hoshinPlanId`
  - not a separate free-text list), east = strategies' Targets/KPIs, center
  = a correlation grid between Annual Objectives and those Projects, and a
  RACI panel (Responsible/Accountable/Consulted/Informed) bottom-right.
  - **Legacy data note**: plans created before this redesign keep their old
    flat-list fields (`longTermObjectives`, `annualObjectives`,
    `improvementPriorities`, `metrics`) untouched in the database, but the
    new editor and X-Matrix no longer read them - that data isn't
    auto-migrated into the new cascade and needs re-entering.
- **Projects** (`/projects`) - every project lands on the same rich page:
  a colored header banner keyed by **category** (CapEx / Improvement /
  Kaizen / Problem-Solving / Innovation - `Project.category`), a
  **Success Measure** (KPI Builder + current value, on/off-track once a
  target is set), an editable **Link to a Plan** (Hoshin plan + strategy
  row), a **Capital Request** section (budget/ROI/payback/approval) when
  the category is CapEx, and always the seven-box **A3 canvas**
  (background, current condition, goal, root cause, countermeasures,
  implementation plan, follow-up) - every category gets the full A3, it's
  the one shape all four share. `Project.type` (`"A3"` / `"CapEx"`) is
  kept underneath purely for existing filters/widgets that key off it;
  `category` is the real classification now and drives what the page
  shows. Projects created before `category` existed fall back to a
  neutral look keyed by `type`.
  - **Vecta Live** (`/projects/new`) - projects are built by talking
    through them with Vecta Live rather than filling out a form up
    front: it asks what to call the project, what category it is (four
    quick-reply cards), then a handful of pertinent, category-specific
    questions one at a time in a chat transcript (e.g. CapEx gets asked
    about budget and ROI; Problem-Solving gets asked about current
    condition and root cause), then owner, success metric, and an
    optional Hoshin plan link, ending in a summary and one "Create
    Project" button. **This is a rule-based decision tree
    (`lib/vectaLive.js`), not an LLM** - same honest approach as every
    other "AI-assisted" tool in Vecta, just presented as a conversation
    instead of a form. Once the metric name is given, it auto-infers how
    that metric is likely measured (`suggestKpiShape` - the same KPI
    Builder logic used everywhere else) and says so explicitly rather
    than silently guessing. The plain multi-field form this replaced is
    gone - Vecta Live is now the only way to create a project.
  - Any project linked to a Hoshin plan shows up automatically on that
    plan's own page (`/hoshin/:id`) under **Linked Projects** - a live
    query (`Project.hoshinPlanId`), not something you maintain by hand
    in two places.
  - The Projects list itself is a **summary**, not just names - each row
    shows the project manager (`ownerName`), its status, and an A3
    **progress bar**: an overall percent-complete plus one thin segment
    per A3 section (Background, Current Condition, Goal, Root Cause,
    Countermeasures, Implementation Plan, Follow-Up), colored gray/amber/
    green for not started / in progress / completed (hover a segment for
    its label). A **key above the list** spells out the color meanings
    and the section order once, in plain text, rather than leaving it
    to hover-only discovery on every row. `lib/projectProgress.js`
    computes this from a plain
    length heuristic on each field's text - under ~60 characters reads as
    "in progress," empty is "not started," anything longer is
    "completed." It's a rule, not content understanding, so a long but
    low-quality answer still reads as complete and a short-but-precise
    one still reads as in progress - treat the bar as a rough completeness
    signal, not a quality one.
- **Team** (`/team`) - Admins invite teammates directly (name/email/initial
  password - no email service is wired up yet, so the password is shared out
  of band), change roles, and remove access. Everyone else can see the
  roster but not act on it. This is the roster/access-management page -
  not to be confused with the Teams module above, which is organizational
  structure, not login access.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in MONGO_URI and JWT_SECRET
npm run dev
```

Use a **dedicated MongoDB database** for Vecta - don't point `MONGO_URI` at
another application's database, even if it's the same Atlas cluster.
Generate `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The first person to sign up at `/signup` creates both the company (tenant)
and becomes its first Admin. From there, use the Team page to add everyone
else - no public sign-up into an existing company is possible, which is
deliberate.

## Deploying to Vercel

1. Import this repo into a new Vercel project.
2. Set the same two environment variables (`MONGO_URI`, `JWT_SECRET`) in the
   Vercel project's Settings → Environment Variables. Use a real MongoDB
   Atlas connection string with network access allowing Vercel's IPs (or
   0.0.0.0/0 if using Atlas's serverless-friendly access, per your own
   security policy).
3. Deploy. No build configuration beyond the defaults is required - it's a
   standard Next.js App Router project.

## Roles

- **Admin** - everything, plus Team management (invite/remove/change role).
- **Manager** - everything except Team management.
- **Member** - full access to Dashboards and Projects; Hoshin plans and
  Teams are view-only (create/edit/delete requires Admin or Manager - both
  sit in the strategic layer, deliberately narrower than who executes
  against them).

Enforced server-side in the relevant API routes, not just hidden in the UI.

## What's deliberately not here yet

- No email delivery - inviting a teammate sets their password directly
  rather than sending a reset/set-password link.
- The X-Matrix's RACI panel is plan-level (who's generally accountable for
  this plan), not a full matrix cross-referencing every individual project -
  that would be a second, larger grid on top of what's here.
- Vecta Live doesn't support going back a step or editing a previous
  answer mid-conversation - if you make a mistake, finish the flow and
  edit the field on the project's own page afterward (every field it
  fills in is fully editable there). It also always asks its fixed
  question list for a category - it can't skip a question that isn't
  relevant to your specific project the way a real conversation would.
- One-Click Tier Boards' KPI tiles are number/percent/graph only - no
  calendar-heatmap widget, no Pareto/root-cause charts, and no per-tile
  Action Plan sub-table with due dates (Projects has no due-date field
  yet). Those are real, larger follow-ups if the SQDCP tiles need to go
  further than trend + target.
- The API-connected KPI data source has only a basic hostname blocklist
  against internal targets, not full SSRF hardening (see the Settings tab
  section above) - treat it as suitable for public, trusted endpoints only.
- Linked KPI tiles resolve one level only (a linked tile's own source isn't
  followed further), so linking to a tile that's itself linked or
  API-connected reads as unset rather than chaining through.
