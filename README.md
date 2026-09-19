# Tripare Dog Breed Explorer

Production-grade, offline-first React Native app that lets a user browse all
283 dog breeds from [dogapi.dog/v2](https://dogapi.dog/docs/api-v2), search
and filter them, and inspect per-breed traits, origin, and image galleries.

Built with **React Native (Expo SDK 57) + TypeScript strict**.

## Quick Start

```bash
npm install
cp .env.example .env
npm run ios        # or: npm run android
```

Should get you to the list screen in under three minutes on a fresh clone.

Useful scripts:

```bash
npm test           # 26 unit tests: mappers, filters, size-band, freshness
npm run typecheck  # tsc --noEmit, no errors
```

## Architecture Overview

The app is layered into four concerns that pass data one direction:

1. **API layer** (`src/api/*`) — a thin `fetch` wrapper with an exponential-
   backoff retry (`http.ts`), plus a paginated client (`client.ts`) that
   fetches every page of `/breeds` in parallel and merges them, and pure
   mappers (`mappers.ts`) that convert the loose wire format into the
   strongly-typed app model.
2. **Persistence** (`src/persistence/*`) — AsyncStorage-backed cache with a
   version prefix so we can invalidate the disk shape without a migration.
   The cache stores the *derived* Breed model, not the raw API response, so
   the mapper only runs once per record per sync.
3. **State** (`src/store/*`) — a single Zustand store keeps normalized
   `breedsById`/`groupsById` maps, filter state, and the sync lifecycle
   (`hydrating` → `syncing` → `idle` | `error`). A pure `applyFilters`
   reducer lives next to the store so it can be unit tested without RN.
4. **UI** (`src/screens/*`, `src/components/*`) — two screens (list, details)
   over a native stack. The list is a `SectionList` grouped by breed group.
   Details is a lightweight three-tab layout (Overview / Traits / Gallery).

### Data flow

```
                ┌────────────────────────┐
                │  Dog API v2 (10 pages) │
                └───────────┬────────────┘
                            │ fetchAllBreeds()  (retry + parallel merge)
                            ▼
                ┌────────────────────────┐
                │  api/mappers.ts        │  raw → Breed (type-safe, guarded)
                └───────────┬────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     ┌────────────────┐         ┌───────────────────┐
     │ Zustand store  │  ◄──┐   │  AsyncStorage     │
     │ (normalized)   │     │   │  v1/breeds …      │
     └────────┬───────┘     │   └───────────────────┘
              │             │             ▲
              │             │ hydrate() ──┘ (on app start / after sync)
              ▼
     ┌────────────────────────────────────────────┐
     │  Screens (List, Details)                   │
     │  - SectionList virtualization              │
     │  - expo-image with disk cache              │
     │  - SyncBanner shows freshness/offline/err  │
     └────────────────────────────────────────────┘
```

### Sync lifecycle

- **First launch**: List screen sees `breeds.length === 0` and kicks off
  `syncAll()`. All 10 pages fetch in parallel after page 1 discovers
  `pagination.last`; progress feeds the banner.
- **Cold start with cache**: `App.tsx` calls `hydrate()`, which reads the
  disk snapshot before any UI renders sync-blocking. `useNetworkSync()` then
  fires a silent background sync if the cached data is > 30 min old.
- **Offline → online transition**: `NetInfo` listener triggers a silent
  sync. If it fails, cached data stays and the banner turns amber.
- **Pull to refresh**: forces a full re-sync via `syncAll()`.

## Key Technical Decisions

- **Zustand over Redux Toolkit / Jotai**: pure JS singleton, no provider
  tree, zero boilerplate for the ~8 pieces of state we hold. Normalized
  maps (`breedsById`, `groupsById`) live alongside plain arrays so both
  by-id lookups and iteration are O(1) / O(n).
- **AsyncStorage over SQLite/WatermelonDB**: 283 records × ~2.5KB
  serialized ≈ 700KB — well under AsyncStorage's practical limits, and
  we do all filtering/search in memory anyway. SQLite pays off when the
  dataset is too big to keep hot or when you need concurrent writers,
  neither of which applies here. Keeping the persistence layer as
  `JSON.stringify(snapshot)` also means the debugger view is inspectable
  and the version-prefixed key (`tripare/v1/breeds`) is a one-line reset.
- **Custom `fetch` + retry over React Query**: React Query is great for
  request-per-component caches, but our data model is one 283-record
  snapshot that lives in a normalized store and syncs as a unit. A React
  Query cache would duplicate what Zustand already holds. So we ship a
  25-line retry helper and a `syncAll` action instead.
- **Offline sync strategy**: (a) hydrate from disk before first render so
  the app *is* usable on launch, (b) auto-refresh on app-foreground when
  data is > 30 min old, (c) re-sync on offline → online transition, (d)
  pull-to-refresh for explicit control. Failures downgrade to a banner
  and keep the cached data — the app never blanks out because the network
  hiccuped.
- **`expo-image` + disk cache, medium variants for the gallery**: the API
  gives us thumb / medium / large per image. List uses `thumb` (~5KB
  each), gallery uses `large`. `expo-image` handles LRU disk eviction so
  we don't need our own size limiter — see PERFORMANCE.md for the
  numbers.

Full reasoning + trade-offs is in [docs/DECISIONS.md](docs/DECISIONS.md).

## Performance Report

See [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for the full breakdown.
Highlights of the target and how we got there:

- **Cold start to interactive with cache**: hydrate reads a single
  ~700KB JSON blob then hands the store to the list — target < 3s met on
  simulator.
- **List scroll**: `SectionList` with `getItemLayout` (fixed row height),
  `initialNumToRender: 12`, `windowSize: 9`, `removeClippedSubviews`,
  `React.memo` on rows, and `expo-image`'s disk cache — a 60fps ceiling
  on a modern simulator; drops observed only on the first paint of an
  uncached section.
- **Memory**: peak ~110MB on the list screen with all rows scrolled
  (JS heap ~30MB + native image cache). Under the 150MB target.

## Screenshots

Placeholder — capture these before submitting:

- `docs/screenshots/list-light.png` — breed list, light mode
- `docs/screenshots/list-dark.png` — breed list, dark mode
- `docs/screenshots/filters.png` — filter sheet with three filters active
- `docs/screenshots/detail-traits.png` — details, Traits tab
- `docs/screenshots/detail-gallery.png` — details, Gallery tab with
  attribution
- `docs/screenshots/offline.png` — offline banner + cached data

## Testing

`npm test` runs 26 unit tests covering the pure logic layer:

- `mappers.test.ts` — happy path + missing-field fallbacks + coat length
  guard-rail
- `filters.test.ts` — every filter dimension in isolation plus a combined
  AND case
- `sizeBand.test.ts` — the derived size band across the four buckets
- `freshness.test.ts` — `formatLastSynced` and `isStale`

Tests deliberately don't render React components — the value of the tests
is on the transformation layer, and dragging in the RN jest preset was
buying us maintenance cost without new coverage.
