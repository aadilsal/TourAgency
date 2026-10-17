<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# Data-safety rules (read before touching admin or Convex code)

These rules exist because every one of them was broken once and caused real
client data loss. CI (`.github/workflows/ci.yml`) runs `npm run typecheck`,
`npm run lint` and `npm test` on every push.

## Deployment

- **Dev and prod are separate Convex deployments.** `.env.local` points at the
  dev deployment, so `npx convex dev` never touches the live site. Production
  is changed only with `npx convex deploy --env-file .env.convex-prod.local`
  (gitignored prod deploy key). Run `npm run typecheck` and `npm test` first.
- **Vercel does not deploy Convex.** Its build is plain `next build`, so changes
  under `convex/` reach the live site only through the prod deploy above.
- **Deploy Convex before the Vercel frontend**, and keep Convex functions
  backward compatible: never remove/rename a public function, never make an
  existing arg required or change its type. Add new args/fields as optional.

## Redirects and SEO

- **Never call `redirect()` / `permanentRedirect()` from a page that sits under a
  `loading.tsx`.** The page streams, so Next can only answer HTTP 200 +
  `<meta refresh>` (Google sees no real redirect, and the client-side redirect
  races the refresh — it crashed `/admin/ai-planner` with React #310). Put fixed
  redirects in `next.config.mjs` `redirects()`, request-dependent ones (login,
  renamed tour slugs) in `src/middleware.ts`.
- **Client components that import `@react-pdf/renderer` must be loaded with
  `ssr: false`** (see `src/components/admin/LazyDocumentEditors.tsx`). Next
  loads that ESM-only package as an async external on the server, so the
  component is `undefined` during SSR (React #419).

## Convex mutations

- **Patch only what the caller sent.** In update mutations `undefined` means
  "leave unchanged" and `null` (or `""` where documented) means "clear".
  Never write `field: args.field?.trim() || undefined` for a field that might
  not be sent — in Convex that deletes the field. Several screens often share
  one mutation.
- **Bulk imports only write non-empty cells** on existing rows. Defaults
  (`?? []`, `?? 0`, `?? true`) belong on the insert path only.
- **Seed/sync functions are insert-only.** They add missing rows and never
  overwrite existing ones. Maintenance functions that mass-update data are
  `internalMutation`.
- **Background jobs must not overwrite admin edits** (AI enrichment, tour →
  destination sync, review-rating recompute). Store computed values in their
  own fields, and skip records an admin has edited.
- **Slugs are unique.** Check the `by_slug` index on create/update; readers
  must not crash if a duplicate already exists.
- **Deletes don't orphan or cascade silently.** Refuse to delete records that
  others reference (bookings, sites, reviews) and suggest deactivating instead.
- **Admin auth failures throw** (`requireAdminFromSession`) — never return
  `null`, which the UI can't tell apart from "not found".
- Every data-safety fix gets a regression test in `convex/tests/*.test.ts`
  (convex-test, runs locally; helpers in `convex/tests/helpers.test-utils.ts`).

## Admin editors (React)

Use the shared building blocks instead of hand-rolling:

| Need | Use |
| --- | --- |
| Load a record for an editor | `useSafeQuery` (`src/hooks/useSafeQuery.ts`) — never throws, keeps last data |
| Paginated admin list | `useSafePaginatedQuery` (`src/hooks/useSafePaginatedQuery.ts`) |
| Autosave | `useAutosave` (`src/hooks/useAutosave.ts`) — merges partials, flushes on leave |
| Warn before leaving with unsaved edits | `useUnsavedChangesGuard(dirty)` + `confirmDiscard(dirty)` |
| Crash / session-expiry backup | `useLocalDraft(key, value, dirty)` + `DraftRestoreBanner` |
| Dirty tracking for forms | `useEditorForm` (`src/hooks/useEditorForm.ts`) |
| Popup editors | `<Modal confirmClose={dirty}>` |
| Status / error UI | `SaveStatusPill`, `QueryErrorBanner` (`src/components/admin/shared/EditorStatus.tsx`) |

- **Never use a Convex function reference (`api.x.y`) as a hook dependency.**
  `api.x.y` returns a new proxy object on every access, so `useMemo`/`useEffect`
  deps on it change every render. In `useSafeQuery` this caused an infinite
  render loop ("Too many re-renders") that crashed every admin editor. Key on
  `getFunctionName(ref)` instead.
- **Hydrate forms once.** Convex queries are reactive: an effect like
  `useEffect(() => setForm(doc), [doc])` wipes the admin's typing whenever
  anyone (or any background job) writes that record. Load once, and only
  re-sync while the form is not dirty.
- **Never show env/placeholder fallbacks as form values** — saving would write
  them into the database as real data.
- **Await saves before navigating** (`await flush()` on Finish/Next/Download).
- Surface every mutation error to the admin; no empty `catch`, no
  fire-and-forget saves, no `window.prompt` for data entry.
