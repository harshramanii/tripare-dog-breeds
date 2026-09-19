import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/theme/theme";
import { OverviewTab } from "./tabs/OverviewTab";
import { TraitsTab } from "./tabs/TraitsTab";
import { GalleryTab } from "./tabs/GalleryTab";
import type { BreedDetailsProps } from "@/navigation/types";
import { useIsOnline } from "@/hooks/useNetworkSync";

type TabKey = "overview" | "traits" | "gallery";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "traits", label: "Traits" },
  { key: "gallery", label: "Gallery" },
];

export function BreedDetailsScreen({
  route,
}: BreedDetailsProps): React.JSX.Element {
  const theme = useTheme();
  const { breedId } = route.params;
  const breed = useAppStore((s) => s.breedsById.get(breedId));
  const groupName = useAppStore((s) =>
    breed?.group_id ? (s.groupsById.get(breed.group_id)?.name ?? null) : null,
  );
  const refreshBreed = useAppStore((s) => s.refreshBreed);
  const online = useIsOnline();

  const [tab, setTab] = useState<TabKey>("overview");

  // Best-effort per-breed refresh when we're online. Fire once on mount.
  useEffect(() => {
    if (online) void refreshBreed(breedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breedId]);

  const content = useMemo(() => {
    if (!breed) return null;
    if (tab === "overview")
      return <OverviewTab breed={breed} groupName={groupName} />;
    if (tab === "traits") return <TraitsTab breed={breed} />;
    return <GalleryTab breed={breed} />;
  }, [tab, breed, groupName]);

  if (!breed) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textMuted }}>
          Breed not found in cache.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View
        style={[
          styles.tabs,
          {
            backgroundColor: theme.bgElevated,
            borderBottomColor: theme.border,
          },
        ]}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={styles.tab}
            >
              <Text
                style={{
                  color: active ? theme.accent : theme.textMuted,
                  fontWeight: active ? "700" : "500",
                }}
              >
                {t.label}
              </Text>
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: active ? theme.accent : "transparent" },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: "center", paddingTop: 12, paddingBottom: 0 },
  tabIndicator: { height: 2, width: "60%", marginTop: 10 },
});
