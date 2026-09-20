# Vecta

Building blocks for **Dashboards**, **Hoshin Policy Deployment**, and **Projects**
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

## Modules

- **Dashboards** (`/dashboards`) - name a board, add widgets (KPI, Note,
  Project List, Hoshin Summary), edit or remove them. Widget config is a
  `type` + a free-form `config` object, so new widget types can be added
  later without migrating existing dashboards.
- **Hoshin Policy Deployment** (`/hoshin`) - the plan editor at `/hoshin/:id`
  holds four editable lists (Long-Term Objectives, Annual Objectives,
  Improvement Priorities, Metrics) plus a correlation grid linking Annual
  Objectives to Improvement Priorities. `/hoshin/:id/xmatrix` renders the
  classic X-Matrix layout on top of the same plan: south = Long-Term
  Objectives, west = Annual Objectives, north = actual **Project** records
  linked to this plan (live, via `Project.hoshinPlanId` - not a separate
  free-text list), east = Metrics/KPIs, center = a correlation grid between
  Annual Objectives and those Projects, and a RACI panel (Responsible/
  Accountable/Consulted/Informed) in the bottom-right corner.
- **Projects** (`/projects`) - one model, two templates. `type: "A3"` gets
  the seven-box A3 canvas (background, current condition, goal, root cause,
  countermeasures, implementation plan, follow-up); `type: "CapEx"` gets a
  budget/ROI/approval form. A project can optionally link to a specific
  Hoshin plan and improvement priority.
- **Team** (`/team`) - Admins invite teammates directly (name/email/initial
  password - no email service is wired up yet, so the password is shared out
  of band), change roles, and remove access. Everyone else can see the
  roster but not act on it. This is the only place the `Admin` role is
  currently enforced server-side.

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
- **Member** - full access to Dashboards and Projects; Hoshin plans are
  view-only (create/edit/delete requires Admin or Manager - Hoshin is the
  strategic layer, deliberately narrower than who executes against it).

Enforced server-side in the relevant API routes, not just hidden in the UI.

## What's deliberately not here yet

- No email delivery - inviting a teammate sets their password directly
  rather than sending a reset/set-password link.
- The X-Matrix's RACI panel is plan-level (who's generally accountable for
  this plan), not a full matrix cross-referencing every individual project -
  that would be a second, larger grid on top of what's here.
- No drag/resize dashboard layout - widgets render in a responsive grid in
  the order they were added.
