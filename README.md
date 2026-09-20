# Vecta

Building blocks for **Dashboards**, **Planning** (Hoshin Policy Deployment), and **Projects**
(A3 problem-solving and CapEx requests) - a separate application from Smart
Factories, sharing only the same class of infrastructure (MongoDB + Vercel).

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

- **Dashboards** (`/dashboards`) - name a board, add widgets (KPI, Note,
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
  tile is also **resizable** - a handle in its bottom-right corner drags
  horizontally to step the tile across 1, 2, or 3 grid columns (snapping to
  the grid's own tracks rather than free pixels, so a resized tile always
  stays aligned with its neighbors instead of leaving gaps). A KPI tile's
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
  - **One-Click Tier Boards** (`/dashboards/one-click`) - pick a Hoshin
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
    accent colors) and are tagged with their tier + source plan so they're
    grouped on the dashboards list.
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
- **Projects** (`/projects`) - one model, two templates. `type: "A3"` gets
  the seven-box A3 canvas (background, current condition, goal, root cause,
  countermeasures, implementation plan, follow-up); `type: "CapEx"` gets a
  budget/ROI/approval form. Either type also gets a **Success Measure**
  section (KPI Builder + a current-value field, with an on/off-track
  indicator once a target is set) - regardless of A3 or CapEx, every
  project benefits from a clear definition of what success means. A
  project can optionally link to a specific Hoshin plan and strategy row.
- **Teams** (`/teams`) - organizational teams, distinct from the `/team`
  roster page below. Each team has a `purpose` (why it exists) and a list
  of `outcomes` - Annual or Quarterly objectives, each optionally linked to
  a specific Breakthrough Objective on a Hoshin plan (same denormalized
  `hoshinLink` snapshot pattern KPI tiles use). A team also links to its
  **Tier Boards** - a multi-select over existing Dashboards, so a team's
  T1/T2/T3 meeting boards are one click away from its page. Admin/Manager
  only to create/edit, same as Hoshin.
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
- No drag/resize dashboard layout - widgets render in a responsive grid in
  the order they were added.
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
