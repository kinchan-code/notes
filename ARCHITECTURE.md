# Architecture Note — Pa Notes

## Goal

Ship the strongest **working slice** of a Google Docs–inspired editor within a 4–6 hour timebox: real auth, real persistence, real sharing, and a usable editing flow — without building realtime collaboration or full document suite features.

---

## What was prioritized

### 1. End-to-end document lifecycle (highest)

- Create → edit → save → reopen with formatting preserved as HTML in Postgres
- Wiki-style **read view by default**, **Edit mode** on demand (reduces noise for viewers; matches how many internal wikis work)
- TipTap for rich text with a small, reliable toolbar subset

**Why:** This is the core product promise. Depth here matters more than extra screens.

### 2. Sharing with real access control (high)

- Owner / editor / viewer roles enforced in **server actions** and **Supabase RLS**
- Dashboard split: **My Documents** vs **Shared With Me**
- Share by email (lookup against `profiles`)

**Why:** Demonstrates full-stack thinking — UI, API, and database policies must agree. RLS recursion bugs (documents ↔ shares) were fixed with security-definer helper functions.

### 3. Lightweight auth + persistence (high)

- Supabase Auth (email/password) with cookie sessions via `@supabase/ssr`
- Next.js Server Components for reads; Server Actions for mutations
- Zod validation on the server before any write

**Why:** Faster than custom auth; reviewers can sign up instantly. No separate REST API layer — Supabase client + actions keeps scope tight.

### 4. File import (medium)

- `.txt` / `.md` only, turned into a new document
- File type limits shown in the UI

**Why:** Satisfies the upload requirement without taking on `.docx` parsing libraries.

### 5. Engineering quality (medium)

- Feature-folder structure (`features/documents`, `features/sharing`, etc.)
- One Vitest suite for access-control rules
- Custom `AlertModal` instead of `window.confirm`
- Mobile-first layout

**Why:** Shows maintainability and product polish without over-building.

---

## What was deprioritized

| Cut | Reason |
|---|---|
| Realtime / OT collaboration | Large scope; explicit save is enough for the assignment |
| Autosave | Simpler mental model; avoids conflict handling |
| `.docx` import | Heavy dependency; txt/md covers the requirement |
| Comments, suggestions, version history | Google Docs parity is explicitly out of scope |
| React Query / client data cache | SSR + server actions + `revalidatePath` is sufficient at this scale |
| Attachment storage per document | Import-as-document covers file workflow |

**With another 2–4 hours:** autosave debounce, export to Markdown, share link preview, integration tests against a test Supabase project, and extracting access-control helpers shared by tests and server code.

---

## Data model

```
profiles          ← mirrors auth.users (trigger on sign-up)
documents         ← owner_id, title, content_html, content_text
document_shares   ← document_id, shared_with_user_id, role (viewer|editor)
storage.avatars   ← optional profile images
```

Access check flow when opening a document:

1. `proxy.ts` ensures authenticated session
2. `checkDocumentAccess(documentId)` returns `owner` | `editor` | `viewer` | `null`
3. UI gates Edit, Share, and Rename based on role
4. RLS blocks unauthorized reads/writes even if the client is tampered with

---

## Key technical decisions

| Decision | Rationale |
|---|---|
| TipTap + StarterKit + Underline | Familiar rich-text UX; HTML storage is simple and good enough |
| Explicit Save (not autosave) | Clear demo flow; easier to reason about permissions |
| Server Actions over API routes | Less boilerplate; fits Next.js App Router patterns |
| Supabase RLS | Sharing security is demonstrable without custom middleware per row |
| Read/edit split | Better UX for shared viewers; TipTap only mounts in edit mode (lighter read view) |

---

## Deployment

- **Frontend:** Vercel (Next.js)
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

No paid services required for review.
