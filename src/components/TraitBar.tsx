import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/theme";

interface Props {
  label: string;
  value: number;
  /** Traits API values are 1–5 except exercise_minutes (raw minutes). */
  max?: number;
  suffix?: string;
}

export function TraitBar({
  label,
  value,
  max = 5,
  suffix,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(max, value));
  const pct = max === 0 ? 0 : (clamped / max) * 100;
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.textMuted }]}>
          {value}
          {suffix ? ` ${suffix}` : ""}
        </Text>
      </View>
      <View
        style={[styles.track, { backgroundColor: theme.border }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max, now: clamped }}
      >
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: theme.accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: "600" },
  value: { fontSize: 12 },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
});
