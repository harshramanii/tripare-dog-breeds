import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { AppState, type AppStateStatus } from "react-native";
import { useAppStore } from "@/store/useAppStore";
import { isStale } from "@/utils/freshness";

/**
 * Fire a background sync when we (a) come back online after being offline,
 * or (b) return to the foreground with stale cached data. Keeps the pull-to-
 * refresh flow separate — this is the automatic path.
 */
export function useNetworkSync(): void {
  useEffect(() => {
    let wasOffline = false;
    const trySync = () => {
      const { lastSyncedAt, syncAll } = useAppStore.getState();
      if (isStale(lastSyncedAt)) void syncAll({ silent: true });
    };

    const netSub = NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );
      if (online && wasOffline) trySync();
      wasOffline = !online;
    });

    const appSub = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        if (status === "active") trySync();
      },
    );

    return () => {
      netSub();
      appSub.remove();
    };
  }, []);
}

export function useIsOnline(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    const sub = NetInfo.addEventListener((s) =>
      setOnline(Boolean(s.isConnected && s.isInternetReachable !== false)),
    );
    NetInfo.fetch().then((s) =>
      setOnline(Boolean(s.isConnected && s.isInternetReachable !== false)),
    );
    return () => sub();
  }, []);
  return online;
}
