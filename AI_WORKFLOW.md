# AI Workflow Note — Pa Notes

## Tools used

| Tool | Role |
|---|---|
| **ChatGPT** | Drafted the initial implementation plan (`implementations.md`) — feature breakdown, stack choices, and build order before coding started |
| **Claude** | Project setup — scaffolding decisions, Supabase/Next.js configuration guidance, and early architecture alignment |
| **Cursor** (Agent mode) | Primary coding assistant — implementation, refactors, debugging, and UI polish |

No AI output was merged without reading the diff and verifying it locally.

---

## Where each tool sped up work

### ChatGPT — planning (`implementations.md`)

- Turned the open-ended assignment into a scoped implementation checklist
- Helped decide what to build first (auth → documents → editor → sharing) and what to cut (realtime, docx, autosave)
- Gave a realistic feature order for a 4–6 hour timebox

### Claude — setup

- Next.js App Router + Supabase project structure
- Environment variables, schema approach, and auth/session patterns with `@supabase/ssr`
- Early guidance on folder layout (`features/`, `schemas/`, server actions)

### Cursor — coding

| Area | How Cursor helped |
|---|---|
| Scaffolding | Feature folders, shadcn/ui wiring, page routes |
| Supabase | RLS policies, security-definer helpers for recursion fix (`42P17`), storage bucket policies |
| TipTap editor | Toolbar, read/edit split, underline extension |
| UI polish | Mobile-first responsive pass, dashboard, profile, `AlertModal` |
| Debugging | `middleware.ts` → `proxy.ts` (Next.js 16), Base UI `nativeButton` warnings, avatar upload failures |
| Validation | Zod schemas and server action error shaping (Zod 4 `flattenError`) |

---

## What AI suggested that was changed or rejected

| Suggestion | Outcome |
|---|---|
| React Query + Axios for data fetching | **Rejected** — SSR + Server Actions + Supabase SSR client is simpler for this scope |
| `render={<Link />}` / `render={<Button />}` on Base UI triggers | **Rejected** — hydration and semantics errors; replaced with `router.push` or `buttonVariants()` on triggers |
| Client-side password confirm validation | **Replaced** — `signUpSchema` with Zod `.refine()` on the server |
| `src/shared/` for AlertModal | **Corrected** to `src/components/shared/` |
| Autosave in the editor | **Not implemented** — explicit save for clearer demo and scope control |

---

## How correctness was verified

### Functionality

- Manual walkthrough: sign-up → create doc → read view → edit → save → refresh → import → share between two accounts → viewer vs editor
- `npm run build` passes
- `npm test` — sharing access-control rules (7 tests)

### Security / data

- RLS tested as owner, editor, viewer, and unrelated user
- Zod validation on server actions before writes
- Auth enforced in `proxy.ts` for all routes except `/login`

### UX / UI

- Mobile viewport checks (header overflow, toolbar scroll, dialog stacking)
- Custom `AlertModal` instead of `window.confirm()`
- Server errors surfaced in the UI

### Review process

- Read every AI-generated diff before keeping it
- ESLint on touched files
- Fixed runtime issues (RLS recursion, storage policies, deprecated `FormEvent` types)

---

## Judgment calls (human, not AI)

- Scope cuts: no realtime, no docx, no autosave
- Wiki read-then-edit UX instead of always-on editor
- Supabase over self-hosted Postgres for faster auth + RLS demo
- One focused test file on access rules instead of shallow E2E everywhere

ChatGPT and Claude shaped the plan and foundation; Cursor executed most of the code. Prioritization and accept/reject decisions stayed with the developer.
