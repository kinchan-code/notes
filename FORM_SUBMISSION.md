# Pa Notes — Assignment Submission

## Links

| | URL |
|---|---|
| **Google Drive folder** | https://drive.google.com/drive/folders/1uUzkUeQ2hdsqPRQ6Mn0kM1L-phveXrG8?usp=drive_link |
| **Live app** | https://notes-psi-eight.vercel.app |
| **GitHub repo** | https://github.com/kinchan-code/Notes |
| **Walkthrough video (Part 1)** | https://www.loom.com/share/8eaeeadf0ebd4bf4b1f7a16704d5f159 |
| **Walkthrough video (Part 2)** | https://www.loom.com/share/2b7699accffe4f968790f99791005d02 |

Additional docs (`README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`) are in the Google Drive folder above.

## Test accounts (sharing demo)

| Role | Email | Password |
|---|---|---|
| Owner (Alice) | alice@example.com | password123 |
| Shared user (Bob) | bob@example.com | password123 |

Demo: sign in as Alice → create doc → Share with bob@example.com → sign in as Bob → Shared With Me.

## Local setup

```bash
npm install
cp .env.example .env.local
# Run supabase/schema.sql in Supabase SQL Editor
npm run dev
npm test
```

Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

---

## What works

- Auth (sign up / sign in), dashboard with owned + shared documents
- Create, rename, delete documents; explicit save; persists after refresh
- Rich text: bold, italic, underline, H1–H3, bullet/numbered lists (TipTap)
- Wiki-style read view → Edit mode for owners/editors; viewers read-only
- Import `.txt` / `.md` as new documents (types stated in the UI)
- Share by email with viewer/editor roles; RLS on Supabase
- Zod validation, error messages, 7 unit tests on access rules
- Deployed on Vercel + Supabase (free tier)

## Partial / out of scope

- No realtime co-editing, autosave, `.docx`, comments, version history
- Avatar upload optional (needs avatars storage migration)
- `.md` import is plain text, not rendered Markdown

## Next 2–4 hours

Autosave, export to Markdown, E2E tests, shared access-control helper with tests

---

## Architecture (summary)

Next.js 16 App Router · Server Components + Server Actions · Supabase Auth/Postgres/RLS · TipTap · Zod

Prioritized: document lifecycle + sharing + real persistence. Deprioritized: Google Docs parity features.

Full note in Drive: `ARCHITECTURE.md`

## AI workflow (summary)

**Tools:** ChatGPT (implementation plan) → Claude (project setup) → Cursor (coding, debugging, UI).

**Rejected:** React Query + Axios, autosave, client-side-only validation, Base UI `render={<Button/>}` patterns that broke a11y.

**Verified:** `npm test`, `npm run build`, manual two-account sharing flow.

Full note in Drive: `AI_WORKFLOW.md`
