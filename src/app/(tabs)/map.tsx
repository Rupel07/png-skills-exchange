import { router } from "expo-router";
import { type ComponentType, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { MappedSkill, useNearbySkills } from "../../hooks/useNearbySkills";
import { colors, radius, spacing } from "../../theme";
import { formatDistance } from "../../utils/distance";
import { MAP_BASE_URL, buildMapHtml } from "../../utils/mapHtml";

const WebViewComponent = WebView as unknown as ComponentType<any>;

// Used when the user's position is unknown (Port Moresby).
const DEFAULT_CENTER = { latitude: -9.4438, longitude: 147.1803 };

type MapStatus = "loading" | "ready" | "error";

export default function MapScreen() {
  const { state, reload } = useNearbySkills();
  const webViewRef = useRef<any>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");
  const [mapKey, setMapKey] = useState(0);

  const html = useMemo(() => {
    if (state.status !== "ready") return "";
    const { user, skills } = state;
    return buildMapHtml({
      user,
      pins: skills.map((s) => ({
        id: s.id,
        title: s.skill_name,
        category: s.category,
        latitude: s.latitude,
        longitude: s.longitude,
      })),
      center: user ?? DEFAULT_CENTER,
      zoom: user ? 13 : 10,
    });
  }, [state]);

  const openSkill = (id: string) =>
    router.push({ pathname: "/skills/[id]", params: { id } });

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "open" && typeof message.id === "string")
        openSkill(message.id);
      else if (message.type === "ready") setMapStatus("ready");
      else if (message.type === "error") setMapStatus("error");
    } catch {
      // Ignore messages that are not JSON; only our own page should be sending them.
    }
  };

  const retryMap = () => {
    setMapStatus("loading");
    setMapKey((key) => key + 1);
  };

  const focusSkill = (skill: MappedSkill) =>
    webViewRef.current?.injectJavaScript(
      `window.focusSkill && window.focusSkill(${JSON.stringify(skill.id)}); true;`,
    );

  if (state.status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Finding skills near you...</Text>
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{state.message}</Text>
        <Pressable style={styles.button} onPress={reload}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { permission, canAskAgain, skills } = state;
  const enableLocation = () =>
    canAskAgain ? reload() : Linking.openSettings();

  return (
    <View style={styles.container}>
      {permission !== "granted" && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {permission === "denied"
              ? "Location is off, so distances are hidden."
              : "Could not find your position. Check that location is switched on."}
          </Text>
          <Pressable onPress={enableLocation}>
            <Text style={styles.bannerAction}>
              {permission === "denied" && !canAskAgain
                ? "Open settings"
                : "Try again"}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.mapBox}>
        <WebView
          key={mapKey}
          ref={webViewRef}
          style={styles.map}
          originWhitelist={["*"]}
          source={{ html, baseUrl: MAP_BASE_URL }}
          javaScriptEnabled
          onMessage={onMessage}
          onLoadStart={() => setMapStatus("loading")}
          onError={() => setMapStatus("error")}
          // Keeps the map from navigating away if an attribution link is tapped.
          onShouldStartLoadWithRequest={(request) =>
            request.url === "about:blank" ||
            request.url.startsWith(MAP_BASE_URL)
          }
        />
        {mapStatus === "loading" && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" />
          </View>
        )}
        {mapStatus === "error" && (
          <View style={styles.overlay}>
            <Text style={styles.errorText}>
              The map could not load. Check your connection and try again.
            </Text>
            <Pressable style={styles.button} onPress={retryMap}>
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>

      <FlatList
        style={styles.list}
        data={skills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          skills.length === 0 ? styles.emptyList : undefined
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No skills on the map yet</Text>
            <Text style={styles.muted}>
              Add a position when you create a skill and it will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => focusSkill(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.skill_name}
              </Text>
              <Text style={styles.muted}>
                {item.category}
                {item.distanceKm != null
                  ? `  •  ${formatDistance(item.distanceKm)}`
                  : ""}
              </Text>
            </View>
            <Pressable onPress={() => openSkill(item.id)} hitSlop={8}>
              <Text style={styles.link}>View</Text>
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  mapBox: { flex: 3 },
  map: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  list: { flex: 2 },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.warningText,
    marginRight: spacing.md,
  },
  bannerAction: { fontSize: 13, fontWeight: "700", color: colors.primary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  link: { color: colors.primary, fontWeight: "700", marginLeft: spacing.md },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  empty: { alignItems: "center", padding: spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
});
