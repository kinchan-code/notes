# Pa Notes

A lightweight collaborative document editor built for the Ajaia full-stack assignment. Users can create and edit rich-text documents, import `.txt` / `.md` files, and share documents with viewer or editor access.

**Stack:** Next.js 16 (App Router) · React 19 · Supabase (Auth + Postgres + Storage) · TipTap · Tailwind CSS · shadcn/ui

---

## Live demo

https://notes-psi-eight.vercel.app

---

## Features

| Area | What's included |
|---|---|
| Documents | Create, rename, delete, explicit save, wiki-style read view with Edit mode |
| Rich text | Bold, italic, underline, headings (H1–H3), bullet and numbered lists |
| Import | `.txt` and `.md` only (stated in the UI) |
| Sharing | Owner shares by email; viewer vs editor roles; owned vs shared dashboard sections |
| Auth | Email/password sign-up and sign-in via Supabase |
| Profile | Display name and avatar (optional; requires storage bucket migration) |

### Intentionally out of scope

- Real-time co-editing, comments, version history
- `.docx` import, attachments on documents
- Autosave (save is explicit)
- Enterprise ACL (roles are owner / editor / viewer only)

---

## Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project

---

## Local setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd pa-notes
npm install
```

### 2. Environment variables

Copy the example file and fill in your Supabase values:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → Publishable key |

### 3. Database schema

In the Supabase **SQL Editor**, run the full contents of:

```
supabase/schema.sql
```

This creates `profiles`, `documents`, `document_shares`, RLS policies, and the `avatars` storage bucket.

### 4. Auth settings

In Supabase → **Authentication → Providers**, ensure **Email** is enabled.

For local review you can either:

- **Sign up** two accounts in the app (recommended), or
- Create users manually under **Authentication → Users** and ensure profiles exist (see `supabase/seed.sql`).

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/login`.

### 6. Run tests

```bash
npm test
```

### 7. Production build

```bash
npm run build
npm start
```

---

## Testing the sharing flow

You need **two accounts** that both exist in `profiles` (created automatically on sign-up).

1. Sign in as **User A** → create a document → open it → **Share** → enter **User B's email** → choose Viewer or Editor.
2. Sign in as **User B** → check **Shared With Me** on the dashboard.
3. Open the document:
   - **Viewer** → read-only, no Edit button
   - **Editor** → Edit button, can save content but cannot share or rename

---

## Deploy to Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Add the same environment variables as `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Deploy. No paid dependencies are required (Supabase free tier + Vercel hobby tier).
4. In Supabase → **Authentication → URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs** (e.g. `https://your-app.vercel.app/**`).

---

## Project structure

```
src/
  app/              # Routes (dashboard, document, login, profile)
  components/ui/    # shadcn UI primitives
  components/shared/# Shared app components (AlertModal)
  features/         # Domain modules (auth, documents, editor, sharing, profile)
  schemas/          # Zod validation
  lib/supabase/     # Supabase clients (server + browser)
  tests/            # Vitest unit tests
supabase/
  schema.sql        # Database migration
  seed.sql          # Optional seed notes
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [AI_WORKFLOW.md](./AI_WORKFLOW.md) for design and AI usage notes.

---

## Supported file types (import)

- `.txt` — plain text, one paragraph per line
- `.md` — imported as plain text (Markdown syntax is not parsed)

Other formats are rejected with an inline error message.
