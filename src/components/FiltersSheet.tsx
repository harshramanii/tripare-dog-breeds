import React, { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/theme";
import { useAppStore } from "@/store/useAppStore";
import { ALL_SIZE_BANDS, SIZE_BAND_LABEL } from "@/utils/sizeBand";
import type { CoatLength } from "@/types/breed";
import { Chip } from "./Chip";
import { applyFilters, type HypoFilter, type TraitKey } from "@/store/filters";

const COATS: CoatLength[] = ["short", "medium", "long", "wire"];
const HYPO: Array<{ value: HypoFilter; label: string }> = [
  { value: "any", label: "Any" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
const TRAITS: Array<{ value: TraitKey; label: string }> = [
  { value: "good_with_children", label: "Good with children" },
  { value: "good_with_dogs", label: "Good with dogs" },
  { value: "good_with_strangers", label: "Good with strangers" },
  { value: "trainability", label: "Trainability" },
  { value: "energy", label: "Energy" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FiltersSheet({ visible, onClose }: Props): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const filters = useAppStore((s) => s.filters);
  const groups = useAppStore((s) => s.groups);
  const breeds = useAppStore((s) => s.breeds);
  const toggleGroup = useAppStore((s) => s.toggleGroup);
  const toggleSize = useAppStore((s) => s.toggleSize);
  const toggleCoat = useAppStore((s) => s.toggleCoat);
  const setHypo = useAppStore((s) => s.setHypo);
  const setTrait = useAppStore((s) => s.setTrait);
  const reset = useAppStore((s) => s.resetFilters);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups],
  );

  // Live match count for the CTA — cheap on 283 records, gives users a clear
  // "yes, this filter did something" signal without closing the sheet.
  const matchCount = useMemo(
    () => applyFilters(breeds, filters).length,
    [breeds, filters],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Column layout: dismiss area on top (flex:1), sheet at the bottom.
          Previous version used position:absolute with a sibling flex:1
          backdrop, which relied on RN's implicit z-ordering to keep chip
          taps from being intercepted. Explicit flex column is bullet-proof. */}
      <View style={styles.root}>
        <Pressable
          style={[styles.dismissArea, { backgroundColor: theme.overlay }]}
          onPress={onClose}
          accessibilityLabel="Close filters"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.bgElevated,
              paddingBottom: insets.bottom + 12,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Filters</Text>
            <Pressable onPress={reset}>
              <Text style={{ color: theme.accent, fontWeight: "600" }}>
                Reset
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            <Section title="Breed group" theme={theme}>
              <ChipRow>
                {sortedGroups.map((g) => (
                  <Chip
                    key={g.id}
                    label={g.name}
                    selected={filters.groupIds.has(g.id)}
                    onPress={() => toggleGroup(g.id)}
                  />
                ))}
                {sortedGroups.length === 0 ? (
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                    Groups load with the first sync.
                  </Text>
                ) : null}
              </ChipRow>
            </Section>

            <Section title="Size" theme={theme}>
              <ChipRow>
                {ALL_SIZE_BANDS.map((s) => (
                  <Chip
                    key={s}
                    label={SIZE_BAND_LABEL[s]}
                    selected={filters.sizes.has(s)}
                    onPress={() => toggleSize(s)}
                  />
                ))}
              </ChipRow>
            </Section>

            <Section title="Coat length" theme={theme}>
              <ChipRow>
                {COATS.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    selected={filters.coats.has(c)}
                    onPress={() => toggleCoat(c)}
                  />
                ))}
              </ChipRow>
            </Section>

            <Section title="Hypoallergenic" theme={theme}>
              <ChipRow>
                {HYPO.map((h) => (
                  <Chip
                    key={h.value}
                    label={h.label}
                    selected={filters.hypo === h.value}
                    onPress={() => setHypo(h.value)}
                  />
                ))}
              </ChipRow>
            </Section>

            <Section title="Trait threshold" theme={theme}>
              <ChipRow>
                <Chip
                  label="None"
                  selected={filters.trait === null}
                  onPress={() => setTrait(null, 0)}
                />
                {TRAITS.map((t) => (
                  <Chip
                    key={t.value}
                    label={t.label}
                    selected={filters.trait === t.value}
                    onPress={() =>
                      setTrait(t.value, Math.max(3, filters.traitMin))
                    }
                  />
                ))}
              </ChipRow>
              {filters.trait ? (
                <View style={{ marginTop: 8 }}>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 12,
                      marginBottom: 6,
                    }}
                  >
                    Minimum score: {filters.traitMin}
                  </Text>
                  <ChipRow>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Chip
                        key={n}
                        label={`≥ ${n}`}
                        selected={filters.traitMin === n}
                        onPress={() => setTrait(filters.trait, n)}
                      />
                    ))}
                  </ChipRow>
                </View>
              ) : null}
            </Section>
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={[styles.cta, { backgroundColor: theme.accent }]}
          >
            <Text style={{ color: theme.accentText, fontWeight: "700" }}>
              Show {matchCount} {matchCount === 1 ? "breed" : "breeds"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dismissArea: { flex: 1 },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  title: { fontSize: 18, fontWeight: "700" },
  body: { paddingVertical: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.9,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cta: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
