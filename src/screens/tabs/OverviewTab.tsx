import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import type { Breed } from "@/types/breed";
import { useTheme } from "@/theme/theme";
import { SIZE_BAND_LABEL } from "@/utils/sizeBand";

interface Props {
  breed: Breed;
  groupName: string | null;
}

const rangeStr = (r: { min: number; max: number }, unit: string) => {
  if (r.min === 0 && r.max === 0) return "Not recorded";
  if (r.min === r.max) return `${r.min} ${unit}`;
  return `${r.min}–${r.max} ${unit}`;
};

export function OverviewTab({ breed, groupName }: Props): React.JSX.Element {
  const theme = useTheme();
  const originParts = [
    breed.origin.country,
    breed.origin.region,
    breed.origin.era,
  ].filter((p): p is string => Boolean(p));
  return (
    <ScrollView contentContainerStyle={styles.body}>
      {breed.description ? (
        <Text style={[styles.description, { color: theme.text }]}>
          {breed.description}
        </Text>
      ) : null}
      <StatGrid theme={theme}>
        <Stat label="Group" value={groupName ?? "—"} theme={theme} />
        <Stat
          label="Size"
          value={SIZE_BAND_LABEL[breed.size_band]}
          theme={theme}
        />
        <Stat
          label="Life span"
          value={rangeStr(breed.life, "yrs")}
          theme={theme}
        />
        <Stat
          label="Hypoallergenic"
          value={breed.hypoallergenic ? "Yes" : "No"}
          theme={theme}
        />
        <Stat
          label="Male weight"
          value={rangeStr(breed.male_weight, "kg")}
          theme={theme}
        />
        <Stat
          label="Female weight"
          value={rangeStr(breed.female_weight, "kg")}
          theme={theme}
        />
        <Stat
          label="Male height"
          value={rangeStr(breed.male_height, "cm")}
          theme={theme}
        />
        <Stat
          label="Female height"
          value={rangeStr(breed.female_height, "cm")}
          theme={theme}
        />
      </StatGrid>

      {originParts.length ? (
        <Section title="Origin" theme={theme}>
          <Text style={[styles.body2, { color: theme.text }]}>
            {originParts.join(" · ")}
          </Text>
        </Section>
      ) : null}

      {breed.other_names.length ? (
        <Section title="Other names" theme={theme}>
          <Text style={[styles.body2, { color: theme.text }]}>
            {breed.other_names.join(", ")}
          </Text>
        </Section>
      ) : null}

      {breed.recognized_by.length ? (
        <Section title="Recognized by" theme={theme}>
          <Text style={[styles.body2, { color: theme.text }]}>
            {breed.recognized_by.join(" · ")}
          </Text>
        </Section>
      ) : null}

      {breed.coat.colors.length ? (
        <Section title="Coat colors" theme={theme}>
          <Text style={[styles.body2, { color: theme.text }]}>
            {breed.coat.colors.join(", ")}
          </Text>
        </Section>
      ) : null}
    </ScrollView>
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
    <View style={{ marginTop: 16 }}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function StatGrid({
  theme,
  children,
}: {
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.grid,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {children}
    </View>
  );
}

function Stat({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.stat, { borderColor: theme.border }]}>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  stat: {
    width: "50%",
    padding: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  statValue: { fontSize: 14, fontWeight: "600" },
  sectionTitle: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    fontWeight: "700",
  },
  body2: { fontSize: 14, lineHeight: 20 },
});
