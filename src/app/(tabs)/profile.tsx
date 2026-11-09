import { colors } from "@/theme";
import { User } from "@supabase/supabase-js";
import { useFocusEffect } from "expo-router";
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
import { removePushToken } from "../../services/notifications";

type Stats = { skills: number; sent: number; received: number };

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    skills: 0,
    sent: 0,
    received: 0,
  });
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const { data } = await supabase.auth.getUser();
          const u = data.user;
          if (!u || !active) return;
          setUser(u);

          const [skills, sent, received] = await Promise.all([
            supabase
              .from("skills")
              .select("id", { count: "exact", head: true })
              .eq("user_id", u.id),
            supabase
              .from("service_requests")
              .select("id", { count: "exact", head: true })
              .eq("requester_id", u.id),
            supabase
              .from("service_requests")
              .select("id", { count: "exact", head: true })
              .eq("provider_id", u.id),
          ]);
          if (active) {
            setStats({
              skills: skills.count ?? 0,
              sent: sent.count ?? 0,
              received: received.count ?? 0,
            });
          }
        } catch (e: any) {
          console.log("Profile load error:", e?.message ?? e);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            setSigningOut(true);
            await removePushToken(); // stop notifications for this account on this phone
            await supabase.auth.signOut();
          } catch (e: any) {
            console.log("Logout error:", e?.message ?? e);
            Alert.alert("Error", "Could not log out. Try again.");
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const meta: Record<string, any> = user?.user_metadata ?? {};
  const email = user?.email ?? "";
  const name: string =
    meta.full_name ??
    meta.name ??
    meta.display_name ??
    (email ? email.split("@")[0] : "User");
  const phone: string | undefined = meta.phone ?? user?.phone ?? undefined;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "U"}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
      </View>

      <View style={styles.statsRow}>
        <Stat label="My skills" value={stats.skills} />
        <Stat label="Sent" value={stats.sent} />
        <Stat label="Received" value={stats.received} />
      </View>

      <View style={styles.card}>
        <Row label="Email" value={email || "-"} />
        {phone ? <Row label="Phone" value={phone} /> : null}
        <Row label="Member since" value={memberSince || "-"} last />
      </View>

      <Pressable
        style={[styles.logoutBtn, signingOut && styles.disabled]}
        onPress={confirmLogout}
        disabled={signingOut}
      >
        {signingOut ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.logoutText}>Log out</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", marginTop: 8 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontSize: 30, fontWeight: "700" },
  name: { marginTop: 12, fontSize: 22, fontWeight: "700", color: colors.text },
  email: { marginTop: 2, fontSize: 14, color: colors.textMuted },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "700", color: colors.primary },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  card: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
  rowValue: {
    flex: 1,
    marginLeft: 16,
    textAlign: "right",
    fontSize: 15,
    color: colors.text,
  },
  logoutBtn: {
    marginTop: 28,
    backgroundColor: colors.danger,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  logoutText: { color: colors.surface, fontWeight: "700", fontSize: 16 },
});
