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
- **Hoshin Policy Deployment** (`/hoshin`) - a simplified X-Matrix: Long-Term
  Objectives, Annual Objectives, Improvement Priorities, and Metrics as four
  editable lists, plus a clickable correlation grid linking Annual Objectives
  to the Improvement Priorities that move them (primary/secondary/none).
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

## What's deliberately not here yet

- Role-based permission gating only exists for Team management (invite/
  remove/change role, Admin-only). Manager vs. Member isn't differentiated
  anywhere else yet (dashboards, Hoshin plans, and projects are editable by
  any signed-in teammate).
- No email delivery - inviting a teammate sets their password directly
  rather than sending a reset/set-password link.
- No classic X-Matrix diagram (the four-quadrant visual) - the correlation
  grid captures the same linkage in a simpler, more buildable form.
- No drag/resize dashboard layout - widgets render in a responsive grid in
  the order they were added.
