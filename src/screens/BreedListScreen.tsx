import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SectionList,
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  RefreshControl,
  type SectionListData,
} from "react-native";
import { useTheme } from "@/theme/theme";
import { useAppStore } from "@/store/useAppStore";
import { activeFilterCount, applyFilters } from "@/store/filters";
import { useDebouncedValue } from "@/utils/debounce";
import { BreedRow } from "@/components/BreedRow";
import { SyncBanner } from "@/components/SyncBanner";
import { FiltersSheet } from "@/components/FiltersSheet";
import type { Breed } from "@/types/breed";
import type { BreedListProps } from "@/navigation/types";

const ROW_HEIGHT = 84; // measured: row (76) + vertical margins (8)
const HEADER_HEIGHT = 34;

interface Section {
  title: string;
  data: Breed[];
  key: string;
}

export function BreedListScreen({
  navigation,
}: BreedListProps): React.JSX.Element {
  const theme = useTheme();
  // Subscribe to raw slices and derive filtered breeds in a memo. Selecting a
  // freshly-computed array directly from Zustand v5 trips the getSnapshot
  // cache invariant (new reference every call → infinite render).
  const breeds = useAppStore((s) => s.breeds);
  const groupsById = useAppStore((s) => s.groupsById);
  const filters = useAppStore((s) => s.filters);
  const setSearch = useAppStore((s) => s.setSearch);
  const syncAll = useAppStore((s) => s.syncAll);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const totalBreeds = breeds.length;
  const filteredBreeds = useMemo(
    () => applyFilters(breeds, filters),
    [breeds, filters],
  );

  const [searchInput, setSearchInput] = useState(filters.search);
  const debounced = useDebouncedValue(searchInput, 250);

  useEffect(() => {
    setSearch(debounced);
  }, [debounced, setSearch]);

  const [filtersOpen, setFiltersOpen] = useState(false);

  // First-launch: kick off a sync when we don't have any data yet.
  useEffect(() => {
    if (totalBreeds === 0 && lastSyncedAt == null && syncStatus !== "syncing") {
      void syncAll();
    }
    // Intentionally not depending on syncStatus/syncAll — this is a one-shot
    // bootstrap that runs when the screen first mounts with an empty cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections: Section[] = useMemo(() => {
    const buckets = new Map<string, Breed[]>();
    for (const b of filteredBreeds) {
      const key = b.group_id ?? "__ungrouped__";
      const arr = buckets.get(key);
      if (arr) arr.push(b);
      else buckets.set(key, [b]);
    }
    const list: Section[] = [];
    for (const [key, data] of buckets) {
      const title =
        key === "__ungrouped__"
          ? "Ungrouped"
          : (groupsById.get(key)?.name ?? "Unknown group");
      data.sort((a, b) => a.name.localeCompare(b.name));
      list.push({ key, title, data });
    }
    list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [filteredBreeds, groupsById]);

  const handlePress = useCallback(
    (breedId: string, name: string) => {
      navigation.navigate("BreedDetails", { breedId, name });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Breed }) => (
      <BreedRow breed={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const renderHeader = useCallback(
    ({ section }: { section: SectionListData<Breed, Section> }) => (
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: theme.bg, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionText, { color: theme.textMuted }]}>
          {section.title} · {section.data.length}
        </Text>
      </View>
    ),
    [theme.bg, theme.border, theme.textMuted],
  );

  const activeCount = activeFilterCount(filters);

  return (
    // No SafeAreaView here — React Navigation's native-stack header already
    // handles the top inset. Adding another was doubling up the top padding.
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SyncBanner />
      <View style={styles.toolbar}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search breeds or nicknames"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.search,
            {
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          accessibilityLabel="Search breeds"
          returnKeyType="search"
          autoCorrect={false}
        />
        <Pressable
          onPress={() => setFiltersOpen(true)}
          style={[
            styles.filterBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Filters, ${activeCount} active`}
        >
          <Text style={{ color: theme.text, fontWeight: "600" }}>
            Filters{activeCount ? ` (${activeCount})` : ""}
          </Text>
        </Pressable>
      </View>
      <SectionList<Breed, Section>
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderHeader}
        stickySectionHeadersEnabled
        // These props are what buy us 60fps on the 283-row payload:
        // - fixed row height (getItemLayout) — skips measure pass
        // - modest window/batch — big lists don't need 21-row default window
        // - removeClippedSubviews on iOS+Android — Android needs it explicit
        getItemLayout={(_, index) => ({
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * index,
          index,
        })}
        initialNumToRender={12}
        windowSize={9}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.textMuted, textAlign: "center" }}>
              {totalBreeds === 0
                ? "No breeds cached yet. Pull to refresh once you have a connection."
                : "No breeds match your filters."}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={syncStatus === "syncing"}
            onRefresh={() => syncAll()}
            tintColor={theme.accent}
          />
        }
      />
      <FiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  search: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  filterBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: HEADER_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  empty: { padding: 32, alignItems: "center" },
});
