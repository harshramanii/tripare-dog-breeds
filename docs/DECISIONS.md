# Technical decisions

## State management: Zustand

Zustand won over Redux Toolkit and Context+Reducer for three reasons:

1. **No provider tree.** The store is a singleton hook; you subscribe
   with a selector and only re-render when *that* slice changes. In a
   list screen that reads `filters`, `breeds`, and `groupsById`
   independently, three narrow subscriptions is what we want.
2. **Zero boilerplate.** No slice files, no action creators, no
   dispatch layer. The store has ~12 fields and 10 actions; RTK's
   ergonomics don't earn their cost here.
3. **Normalized cache with `Map`.** Zustand doesn't care what you put
   in state, so `Map<string, Breed>` works. RTK's `createEntityAdapter`
   is nice, but for a fixed dataset we don't need entity CRUD ergonomics.

Trade-off: no built-in devtools timeline. The zustand `devtools`
middleware would add it in a few lines if that were needed.

## Persistence: AsyncStorage

Rejected: SQLite (via `expo-sqlite`), WatermelonDB.

- **Dataset size**: 283 records × ~2.5KB serialized ≈ 700KB. Well
  under AsyncStorage's practical per-key limit on both platforms.
- **Read pattern**: hydrate the whole snapshot into an in-memory Zustand
  store on launch, then never touch disk during a session (except to
  write after a sync). SQLite is dramatically better at partial reads
  and indexed queries — but we don't do partial reads, and our filter
  reducer runs against the in-memory list.
- **Write pattern**: one atomic snapshot write per sync (bulk
  overwrite), not incremental record updates. SQLite's transactional
  guarantees don't buy us anything here.
- **Debuggability**: `JSON.stringify(snapshot)` under a versioned key
  (`tripare/v1/breeds`) is trivial to inspect via a devtools bridge or
  even by `console.log`ing the read result. Bumping `CACHE_VERSION` to
  `v2` invalidates old caches without a migration.

If the dataset grew (say, tens of thousands of breeds or a full detail
graph per breed), we'd move to `expo-sqlite` with a small ORM shim and
switch filters to server-side. Not today.

## API layer: custom hook + retry, not React Query

React Query is excellent for **request-shaped caching**: keyed responses,
per-request stale/refetch policies, dedupe of overlapping calls. Our
data model is different — one snapshot, one background sync — so React
Query would duplicate Zustand's role and give us two sources of truth
(the query cache and the normalized store).

`getJson()` in `src/api/http.ts` is 40 lines: fetch + timeout +
exponential backoff (100ms · 2^n + jitter) with retries only on
transport errors, 5xx, 408, and 429. Everything else fails fast.

Trade-off: if we ever add per-record subscriptions or optimistic
updates, we'll want React Query.

## API pagination discrepancy

The task doc says `/breeds` returns 283 records paginated **48/page × 6
pages**. The live API currently returns **30/page × 10 pages** (verified
via `meta.pagination`). Rather than hardcode either value, `fetchAllBreeds`
fetches page 1 first to read `meta.pagination.last`, then fires pages
2..N in parallel. This keeps the loader adaptive to whatever the API
decides — if pagination changes again, we don't ship a new build.

## SizeBand: derived, not filtered from the API

Size buckets aren't in the API. We derive them from average adult
weight in `deriveSizeBand()`:

- `< 10kg` → small
- `10–25kg` → medium
- `25–45kg` → large
- `≥ 45kg` → giant

These cutoffs roughly match AKC / kennel-club informal grouping. When
weight data is missing or zeroed (a handful of API records have `{ 0, 0 }`
ranges) we fall back to `medium` rather than hiding the breed from
size-based filters entirely. The derivation runs once per breed during
mapping and the result is cached on the `Breed` object as `size_band`,
so filtering never recomputes it.

## List rendering: SectionList over FlatList

Requirement says "grouped by breed group". A `SectionList` gives us
sticky section headers, per-group counts, and lets us keep the flat
`SectionList` virtualization behavior.

The 283 rows are heavier than a typical list row: each carries nested
`traits` (12 fields), `coat`, `origin`, and up to 9 image URLs. Rendering
one row is not cheap — but importantly, **the payload per row is what
we're optimizing, not the row count**. 283 is trivial for FlatList; the
work is: (a) avoiding re-rendering rows on unrelated store updates, and
(b) keeping the visible window as small as possible.

Perf props on the list:

- `getItemLayout` — skips the measure pass since our row height is fixed.
- `initialNumToRender: 12`, `windowSize: 9`, `maxToRenderPerBatch: 12`,
  `updateCellsBatchingPeriod: 30ms` — kept the render window under 100
  rows in memory at any time (vs the default 21 × 10 = 210 rows).
- `removeClippedSubviews` — Android needs this explicit for
  `SectionList` to detach off-screen views from native tree.
- `React.memo(BreedRow)` — the row's props are `{ breed, onPress }`.
  `onPress` is `useCallback` in the parent so `React.memo` actually
  hits.
- `expo-image` with `cachePolicy="disk"` and `recyclingKey={breed.id}`
  — the second prop lets the native image view swap the underlying
  bitmap in place instead of tearing down.

## Image variants: thumb for list, large for gallery, no explicit size cap

Each breed carries `thumb / medium / large` for up to 9 images. The
list uses `thumb` (~5KB); the gallery uses `large` on demand. We do
**not** cache all three variants for all 283 breeds up-front — that
would be up to 283 × 9 × 3 = 7,641 requests. Instead:

- Sync only downloads JSON (URLs and metadata), no images.
- `expo-image` handles LRU disk eviction with its own policy (default:
  best-effort by platform). This means we don't have to write a size
  limiter; the cache self-heals when the disk gets tight.
- The details screen upgrades to `large` only for the images the user
  actually swipes to.

If we wanted a hard byte cap, we'd use `expo-file-system` to walk
`FileSystem.cacheDirectory/ExponentImageCache/` on cold start and evict
oldest files. Not needed for a demo; noted for a real deployment.

## Testing scope

Unit tests cover the pure logic layer (mappers, filters, size band,
freshness). Component tests would require the RN jest preset, which has
version-mismatch issues with SDK 57 + React 19 (the preset chain
demanded a matching `react-test-renderer` and `@react-native/jest-preset`
that peer-conflicted). Rather than pin a fragile matrix, we cover the
transformation layer thoroughly and rely on manual smoke testing for the
UI. If component tests become a hard requirement, we'd add Detox/Maestro
for E2E instead.

## Things we deliberately didn't do

- **Migration/upgrade path from an older cache**: `CACHE_VERSION`
  prefix means old caches are dropped, not migrated. Cheaper.
- **Retry queue for failed image loads**: `expo-image` handles this
  well enough. Adding our own queue is a maintenance liability.
- **Background sync via `expo-background-fetch`**: the app is a
  browse-tool, not a data-collection tool. Foreground sync + offline
  cache is sufficient. A production version might add this for
  push-triggered updates.
- **Redux devtools middleware**: nice for debugging state races but
  adds bundle weight. If needed, one-line change to the store setup.
