# Architecture

## Module layout

```
src/
├── api/          # http (retry), client (paged fetch), mappers (raw → Breed)
├── persistence/  # AsyncStorage keys + snapshot save/load
├── store/        # Zustand store + pure filter reducer
├── hooks/        # useNetworkSync, useIsOnline
├── navigation/   # RootNavigator + typed route params
├── screens/      # BreedListScreen, BreedDetailsScreen, tabs/*
├── components/   # BreedRow, Chip, FiltersSheet, TraitBar, SyncBanner, ErrorBoundary
├── theme/        # light/dark palette, useTheme()
├── utils/        # sizeBand, freshness, debounce, typeGuards
├── types/        # Breed, BreedGroup, RawResource shapes
└── __tests__/    # jest unit tests (pure logic)
```

Each layer only imports from lower layers. The store never imports
from `screens/`; the API layer never imports from the store.

## Data flow

```
API v2  ──► http.ts (retry)  ──► client.ts (page merge)  ──► mappers.ts  ──► Breed[]
                                                                             │
                                                                             ▼
                                                         Zustand store + AsyncStorage
                                                                             │
                                                                             ▼
                                                                     Screens (list, details)
```

- **API → store** is a *one-shot bulk sync*, not a per-record fetch.
  The store owns the whole 283-record snapshot.
- **Details screen** additionally calls `refreshBreed(id)` on mount when
  online — a lightweight, best-effort per-record refresh for cases where
  the single-record endpoint has richer data than the list endpoint (e.g.
  additional images or updated traits).

## State model

```ts
{
  breeds: Breed[]                     // for iteration / rendering
  breedsById: Map<string, Breed>      // O(1) lookup for details, filter refs
  groups: BreedGroup[]
  groupsById: Map<string, BreedGroup>
  lastSyncedAt: number | null
  syncStatus: 'idle' | 'hydrating' | 'syncing' | 'error'
  syncError: string | null
  syncProgress: { loaded: number; total: number } | null
  filters: {
    search: string
    groupIds: Set<string>
    sizes: Set<SizeBand>
    coats: Set<CoatLength>
    hypo: 'any' | 'yes' | 'no'
    trait: TraitKey | null
    traitMin: number
  }
}
```

Filters are held as `Set`s to keep toggle logic O(1). The derived
`applyFilters(breeds, filters)` selector is a pure function called from a
Zustand selector — the store itself never stores a filtered slice.

## Sync engine

`syncAll()` is guarded against overlap (`if (syncStatus === 'syncing')
return`). It fetches breeds + groups in parallel, then writes all three
disk keys in parallel (`saveBreeds`, `saveGroups`, `saveLastSyncedAt`)
before committing to the store.

Failure paths:

- **Fresh install, network down**: sync fails, store stays empty, list
  shows empty state with a "pull to refresh" hint.
- **Cached install, network flakey mid-sync**: cached snapshot stays
  live, banner shows red error, next `useNetworkSync` tick retries.
- **Cached install, partial network**: retries with backoff up to 3
  times per request; a single-page failure bubbles up as a full sync
  failure so we never partially overwrite the cache with half a dataset.

## Navigation

React Navigation native stack, two screens. `RootStackParamList` is
declared in `src/navigation/types.ts` and augmented into the global
`ReactNavigation.RootParamList` so `navigation.navigate('BreedDetails',
{ breedId, name })` is fully type-checked.

## Theming

`useTheme()` returns a palette derived from `useColorScheme()`. Colors
are semantic (`bg`, `surface`, `border`, `accent`, `danger`, `warning`)
rather than raw values, so light/dark parity is enforced structurally.
`RootNavigator` maps the same palette into `@react-navigation`'s theme so
headers and native modals follow suit.

## Error boundaries

A single `ErrorBoundary` wraps the entire navigator. Any render-time
throw from a screen or component is caught, the boundary shows a "try
again" screen, and pressing the button resets state. In a production
build this would also ship the error to Sentry/Bugsnag — the hook is at
`componentDidCatch`.
