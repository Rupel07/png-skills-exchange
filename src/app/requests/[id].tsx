import {
    router,
    Stack,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { getRequest, updateRequestStatus } from "../../services/requests";
import { RequestStatus, ServiceRequest } from "../../types/requests";

const STATUS_COLORS: Record<RequestStatus, { bg: string; fg: string }> = {
  pending: { bg: "#FFF4D6", fg: "#9A6B00" },
  accepted: { bg: "#DDF3E4", fg: "#1B7F3B" },
  declined: { bg: "#FBE0E0", fg: "#B00020" },
  cancelled: { bg: "#E6E8EB", fg: "#555" },
  completed: { bg: "#E3EEFF", fg: "#1F6FEB" },
};

type Action = {
  label: string;
  next: RequestStatus;
  confirm: string;
  style: "primary" | "danger" | "outline";
};

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [data, userRes] = await Promise.all([
        getRequest(id),
        supabase.auth.getUser(),
      ]);
      setRequest(data);
      setUserId(userRes.data.user?.id ?? null);
    } catch (e: any) {
      console.log("Request details error:", e?.message ?? e);
      setError("Could not load this request.");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await load();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  const isProvider = !!request && request.provider_id === userId;
  const isRequester = !!request && request.requester_id === userId;

  // Which buttons to show depends on who is viewing and the current status.
  const actions: Action[] = [];
  if (request) {
    if (isProvider && request.status === "pending") {
      actions.push(
        {
          label: "Accept",
          next: "accepted",
          confirm: "Accept this request?",
          style: "primary",
        },
        {
          label: "Decline",
          next: "declined",
          confirm: "Decline this request?",
          style: "danger",
        },
      );
    }
    if (isProvider && request.status === "accepted") {
      actions.push({
        label: "Mark completed",
        next: "completed",
        confirm: "Mark this request as completed?",
        style: "primary",
      });
    }
    if (isRequester && request.status === "pending") {
      actions.push({
        label: "Cancel request",
        next: "cancelled",
        confirm: "Cancel this request?",
        style: "outline",
      });
    }
  }

  const runAction = (action: Action) => {
    if (!request) return;
    Alert.alert(action.label, action.confirm, [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: action.style === "danger" ? "destructive" : "default",
        onPress: async () => {
          try {
            setUpdating(true);
            await updateRequestStatus(request.id, action.next);
            await load();
          } catch (e: any) {
            console.log("Status update error:", e?.message ?? e);
            Alert.alert("Error", "Could not update the request. Try again.");
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Request Details" }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Request Details" }} />
        <Text style={styles.errorText}>{error ?? "Request not found."}</Text>
        <Pressable style={styles.outlineBtn} onPress={() => router.back()}>
          <Text style={styles.outlineText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const colors = STATUS_COLORS[request.status];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Request Details" }} />

      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {request.skills?.skill_name ?? "Skill"}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.fg }]}>
            {request.status}
          </Text>
        </View>
      </View>

      {request.skills?.category ? (
        <Text style={styles.category}>{request.skills.category}</Text>
      ) : null}

      <Text style={styles.role}>
        {isProvider
          ? "Someone requested your skill"
          : isRequester
            ? "You requested this skill"
            : ""}
      </Text>

      <Text style={styles.label}>Message</Text>
      <Text style={styles.body}>{request.message}</Text>

      <Text style={styles.label}>Preferred date</Text>
      <Text style={styles.body}>
        {request.preferred_date ?? "No preference"}
      </Text>

      <Text style={styles.label}>Sent</Text>
      <Text style={styles.body}>
        {new Date(request.created_at).toLocaleDateString()}
      </Text>

      <Pressable
        style={styles.linkBtn}
        onPress={() =>
          router.push({
            pathname: "/skills/[id]",
            params: { id: request.skill_id },
          })
        }
      >
        <Text style={styles.linkText}>View skill</Text>
      </Pressable>

      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable
              key={a.label}
              style={[
                styles.btn,
                a.style === "primary" && styles.primaryBtn,
                a.style === "danger" && styles.dangerBtn,
                a.style === "outline" && styles.outlineActionBtn,
                updating && styles.disabled,
              ]}
              onPress={() => runAction(a)}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator
                  color={a.style === "outline" ? "#1F6FEB" : "#fff"}
                />
              ) : (
                <Text
                  style={[
                    styles.btnText,
                    a.style === "outline" && styles.outlineActionText,
                  ]}
                >
                  {a.label}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  content: { padding: 20, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
    marginRight: 10,
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
  },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  badgeText: { fontSize: 13, fontWeight: "700", textTransform: "capitalize" },
  category: { marginTop: 6, fontSize: 14, color: "#5B6470" },
  role: { marginTop: 14, fontSize: 14, fontWeight: "600", color: "#1F6FEB" },
  label: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
  },
  body: { marginTop: 4, fontSize: 16, color: "#333", lineHeight: 22 },
  linkBtn: { marginTop: 20, alignSelf: "flex-start" },
  linkText: { color: "#1F6FEB", fontWeight: "600", fontSize: 15 },
  actions: { marginTop: 28, gap: 12 },
  btn: { paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  primaryBtn: { backgroundColor: "#1F6FEB" },
  dangerBtn: { backgroundColor: "#D32F2F" },
  outlineActionBtn: {
    borderWidth: 1,
    borderColor: "#1F6FEB",
    backgroundColor: "#fff",
  },
  disabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  outlineActionText: { color: "#1F6FEB" },
  errorText: {
    fontSize: 15,
    color: "#B00020",
    textAlign: "center",
    marginBottom: 12,
  },
  outlineBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F6FEB",
  },
  outlineText: { color: "#1F6FEB", fontWeight: "600" },
});
