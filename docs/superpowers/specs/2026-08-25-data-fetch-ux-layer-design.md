# Data-fetch UX layer: caching, skeleton loaders, optimistic rendering, tooltips

Date: 2026-08-25

## Problem

~31 files hand-roll data fetching with `useState`/`useEffect`/`fetch`,
each with its own `loading`/`error` state, no caching (every mount
re-fetches), no optimistic UI on mutations (wishlist add/remove,
loyalty actions, admin invites, chat send all wait on the round trip
before reflecting the change), and no shared tooltip primitive
(ad-hoc `title="..."` attrs, one map-only `react-tooltip` usage, plus
an unused `tooltip` npm dependency).

## Goals

- Central query cache so repeated navigation to the same data (item
  list, wishlist, loyalty dashboard, etc.) doesn't always show a full
  loading spinner.
- Consistent skeleton loading state instead of "Loading..." text.
- Optimistic UI on user-initiated mutations, with rollback on failure.
- One accessible tooltip primitive, replacing bare `title` attrs where
  they carry real information and adding labels to icon-only buttons
  that currently have none.

## Non-goals

- No backend changes. All work is client-side.
- No redesign of visual style — skeletons match existing layout
  dimensions, tooltips use existing color tokens.
- Not migrating `Maps/ResponsiveWorldMap.tsx`'s `react-tooltip` usage
  (different interaction model — hover-follows-cursor on an SVG map)
  or `AnalysticsDashboard.tsx`'s `recharts` `<Tooltip>` (chart-library
  internal). Both stay as-is.

## Approach

Adopt `@tanstack/react-query` (v5) rather than hand-rolling a cache.
It gives `useQuery` (cache + stale-time + refetch-on-mount dedup) and
`useMutation` (with `onMutate`/`onError`/`onSettled` for optimistic
updates + rollback) for free, and is the standard fit for a codebase
already on React 18 + Vite with no existing data layer to conflict
with.

For tooltips, adopt `@radix-ui/react-tooltip` — unstyled, accessible
(keyboard + screen reader), small. Wrap it once in a project
`<Tooltip>` component styled with existing Tailwind tokens so call
sites just do `<Tooltip label="...">`.

Skeletons are plain Tailwind (`animate-pulse` divs) — no library
needed for this one.

## Architecture

### New shared primitives (`src/ui/`)

- `src/ui/queryClient.ts` — one `QueryClient` instance, default
  `staleTime: 30_000`, `retry: 1`.
- `src/ui/Skeleton.tsx` — `<Skeleton className="h-4 w-32" />` base
  block, plus composed layouts: `<ListRowSkeleton />` (matches
  `ItemList`/`WishlistPage` row height), `<CardSkeleton />` (matches
  `CollectionPage`/`FunkoDetails` card), `<StatSkeleton />` (matches
  `DashboardSite`/`LoyaltyDashboard` stat tiles).
- `src/ui/Tooltip.tsx` — thin wrapper around
  `@radix-ui/react-tooltip`'s `Root`/`Trigger`/`Portal`/`Content`,
  exposing `<Tooltip label={string} side?>`.
- `src/api/http.ts` — one `authFetch(path, options)` helper reading
  the token from `localStorage` and throwing on non-OK responses, so
  every `useQuery`/`useMutation` call site stops repeating the
  `Authorization: Bearer` + `response.ok` boilerplate. This is a
  targeted cleanup of existing duplicated code, not a new abstraction
  layer beyond what the migration itself requires.

### Wiring

`main.jsx` gets a `QueryClientProvider` wrapping `<App />` (inside
`NetworkProvider`, outside `LanguageProvider`/`ThemeProvider` — order
among those three doesn't matter, query client has no dependency on
them).

### Migration pattern (per component)

Each fetch site converts from:

```
useState + useEffect + fetch + try/catch + loading/error state
```

to:

```
const { data, isLoading, error } = useQuery({
  queryKey: [...],
  queryFn: () => authFetch(...),
});
```

Mutations (wishlist add/remove/edit, loyalty claim actions, admin
invite send/revoke, chat send) convert to `useMutation` with
`onMutate` writing the optimistic value into the query cache via
`queryClient.setQueryData`, `onError` rolling back to the snapshot
taken in `onMutate`, `onSettled` invalidating the query key to
reconcile with the server.

Render logic changes from `if (loading) return <p>Loading...</p>` to
`if (isLoading) return <ListRowSkeleton count={N} />` (or the
matching skeleton variant for that view).

### Components in scope (fetch/mutation migration + skeleton)

`ItemList`, `CollectionPage`, `WishlistPage`, `FunkoDetails`,
`DashboardSite`, `LoyaltyDashboard`, `LoyaltyWidget`,
`LoyaltyLeaderboard`, `LoyaltyBadge`, `AdminInvites`, `Admin`,
`FriendProfileModal`, `ChatComponent`, `AnalysticsDashboard`,
`SearchSite`, `MostVisitedSite`.

Auth flows (`LoginSite`, `LoginRegisterSite`, `RegisterSite`) are
one-shot form submits, not cacheable reads — they get `useMutation`
for consistent error handling but no skeleton (nothing to skeleton
before a login form renders).

### Tooltip call sites

- `ItemList` row cells currently using bare `title="..."` for
  truncated text (title, series, imageName columns) → `<Tooltip>`.
- Icon-only buttons lacking any accessible label: `LoyaltyBadge`
  status icons, `Admin`/`AdminInvites` action icons (edit/delete/save/
  cancel), `WishlistPage` priority/action icons.

## Error handling

`authFetch` throws a plain `Error` with the HTTP status/message on
non-2xx — react-query surfaces this as `error` from `useQuery`, and
`onError` on `useMutation`. Existing per-component error UI (e.g. the
red error text in `ItemList`) stays, just now driven by react-query's
`error` field instead of local state. The auto-logout-on-inactivity
`useEffect` blocks in each page are untouched — orthogonal to this
work.

## Testing

- No new test infra. Existing Vitest + Testing Library setup covers
  component tests; migrated components keep their current test
  coverage (update mocks from raw `fetch` to whatever shape
  `authFetch`/react-query expect, since tests already mock `fetch`).
- Manual check per migrated page: initial load shows skeleton (not
  spinner text), second navigation to the same page within
  `staleTime` shows cached data instantly, a mutation (e.g. wishlist
  remove) updates the UI before the network response returns, and
  reverts if the request is forced to fail.

## Rollout order

1. Foundation: install deps, add `queryClient.ts`, `Skeleton.tsx`,
   `Tooltip.tsx`, `authFetch`, wire `QueryClientProvider` into
   `main.jsx`.
2. Highest-traffic reads: `ItemList`, `CollectionPage`, `FunkoDetails`,
   `WishlistPage` (also first optimistic mutation: wishlist add/
   remove/edit).
3. Loyalty surface: `LoyaltyDashboard`, `LoyaltyWidget`,
   `LoyaltyLeaderboard`, `LoyaltyBadge`.
4. Admin/social: `Admin`, `AdminInvites`, `FriendProfileModal`,
   `ChatComponent`.
5. Remaining reads: `DashboardSite`, `AnalysticsDashboard`,
   `SearchSite`, `MostVisitedSite`.
6. Tooltip sweep across the call sites listed above (can run in
   parallel with any phase after Foundation, since `Tooltip.tsx` has
   no dependency on the query migration).

Each phase is independently testable and shippable — not one giant
commit.
