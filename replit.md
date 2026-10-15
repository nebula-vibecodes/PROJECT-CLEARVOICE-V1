# Clearvoice

Clearvoice is a calm, touch-friendly AAC communication usability demo for composing messages from a responsive vocabulary grid.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/clearvoice run dev` — run the Clearvoice web app (workflow supplies the preview port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/clearvoice/src/App.tsx` — application shell and local interaction state
- `artifacts/clearvoice/src/data/vocabulary.ts` — typed vocabulary model and demo vocabulary
- `artifacts/clearvoice/src/index.css` — centralized theme variables and responsive styles

## Architecture decisions

- The first phase is frontend-only; there is no authentication, database, prediction, analytics, or caregiver monitoring.
- Vocabulary data is kept in a typed module so the UI components remain independent of the vocabulary source.
- The message composer is sticky and persistent while browsing categories, with local-only settings and feedback.

## Product

- Users can select words or phrases, compose a message, clear it, and receive local feedback for Speak and Send actions.
- Users can browse Core, Quick Phrases, More, and Spell categories, search vocabulary, and adjust demo text size or motion settings.
- The interface includes a non-clinical usability-demo notice.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
