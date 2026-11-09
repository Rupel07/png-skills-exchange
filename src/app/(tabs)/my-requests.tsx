import { colors } from "@/theme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { getMyRequests } from "../../services/requests";
import { RequestStatus, ServiceRequest } from "../../types/requests";

type Filter = "sent" | "received";

const STATUS_COLORS: Record<RequestStatus, { bg: string; fg: string }> = {
  pending: { bg: "#FFF4D6", fg: "#9A6B00" },
  accepted: { bg: "#DDF3E4", fg: "#1B7F3B" },
  declined: { bg: "#FBE0E0", fg: colors.danger },
  cancelled: { bg: "#E6E8EB", fg: colors.neutralText },
  completed: { bg: colors.primarySoft, fg: colors.primary },
};

export default function RequestsListScreen() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("sent");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [data, userRes] = await Promise.all([
        getMyRequests(),
        supabase.auth.getUser(),
      ]);
      setRequests(data);
      setUserId(userRes.data.user?.id ?? null);
    } catch (e: any) {
      console.log("Requests load error:", e?.message ?? e, e?.code, e?.details);
      setError("Could not load requests. Check your connection and try again.");
    }
  }, []);

  // Reload every time the tab comes into focus.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await load();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const visible = requests.filter((r) =>
    filter === "sent" ? r.requester_id === userId : r.provider_id === userId,
  );

  const renderItem = ({ item }: { item: ServiceRequest }) => {
    const colors = STATUS_COLORS[item.status];
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() =>
          router.push({
            pathname: "/requests/[id]",
            params: { id: item.id },
          } as any)
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={1}>
            {item.skills?.skill_name ?? "Skill"}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.fg }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.date}>
          Sent {new Date(item.created_at).toLocaleDateString()}
          {item.preferred_date ? `  •  Wanted for ${item.preferred_date}` : ""}
        </Text>
      </Pressable>
    );
  };

  if (loading && requests.length === 0 && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && requests.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={styles.retryBtn}
          onPress={async () => {
            setLoading(true);
            await load();
            setLoading(false);
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {(["sent", "received"] as Filter[]).map((f) => {
          const selected = f === filter;
          return (
            <Pressable
              key={f}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  selected && styles.filterTextSelected,
                ]}
              >
                {f === "sent" ? "Sent" : "Received"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={
          visible.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {filter === "sent" ? "No requests sent" : "No requests received"}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "sent"
                ? "Open a skill and tap Request Service to send one."
                : "When someone requests one of your skills, it will show here."}
            </Text>
          </View>
        }
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
    padding: 24,
  },
  filters: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { color: colors.textBody, fontWeight: "600", fontSize: 14 },
  filterTextSelected: { color: colors.primary },
  list: { padding: 16 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", padding: 24 },
  emptyBox: { alignItems: "center" },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: colors.text,
  },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
    marginRight: 8,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  message: { marginTop: 8, fontSize: 14, color: colors.text },
  date: { marginTop: 8, fontSize: 12, color: colors.textMuted },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: colors.onPrimary, fontWeight: "600" },
});
