import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/theme/theme";
import { formatLastSynced } from "@/utils/freshness";
import { useIsOnline } from "@/hooks/useNetworkSync";

export function SyncBanner(): React.JSX.Element {
  const theme = useTheme();
  const online = useIsOnline();
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const status = useAppStore((s) => s.syncStatus);
  const progress = useAppStore((s) => s.syncProgress);
  const error = useAppStore((s) => s.syncError);
  const sync = useAppStore((s) => s.syncAll);

  type Tone = "muted" | "error" | "warning";
  let text: string;
  let tone: Tone = "muted";
  if (status === "syncing") {
    text = progress
      ? `Syncing… ${progress.loaded}/${progress.total}`
      : "Syncing…";
  } else if (status === "error" && error) {
    text = `Sync failed — showing cached data. ${error}`;
    tone = "error";
  } else if (online === false) {
    text = `Offline — cached data (${formatLastSynced(lastSyncedAt)})`;
    tone = "warning";
  } else {
    text = `Last synced ${formatLastSynced(lastSyncedAt)}`;
  }

  const bg =
    tone === "error"
      ? theme.danger + "22"
      : tone === "warning"
        ? theme.warning + "22"
        : theme.surface;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: bg, borderBottomColor: theme.border },
      ]}
    >
      <View style={styles.left}>
        {status === "syncing" ? (
          <ActivityIndicator size="small" color={theme.accent} />
        ) : null}
        <Text style={[styles.text, { color: theme.text }]} numberOfLines={2}>
          {text}
        </Text>
      </View>
      {status !== "syncing" && online !== false ? (
        <Pressable
          onPress={() => sync()}
          accessibilityRole="button"
          accessibilityLabel="Sync now"
          style={({ pressed }) => [
            styles.btn,
            { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: theme.accent }]}>Sync</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  text: { fontSize: 12, flexShrink: 1 },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnText: { fontSize: 12, fontWeight: "600" },
});
