import { colors } from "@/theme";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

type IconName =
  | "search-outline"
  | "document-text-outline"
  | "paper-plane-outline"
  | "notifications-outline"
  | "add-circle-outline"
  | "mail-outline"
  | "checkmark-circle-outline"
  | "create-outline"
  | "search"
  | "add"
  | "information-circle-outline";

const ICONS: Record<IconName, string> = {
  "search-outline": "⌕",
  "document-text-outline": "▤",
  "paper-plane-outline": "➤",
  "notifications-outline": "♧",
  "add-circle-outline": "⊕",
  "mail-outline": "✉",
  "checkmark-circle-outline": "✓",
  "create-outline": "✎",
  search: "⌕",
  add: "+",
  "information-circle-outline": "ⓘ",
};

function Ionicons({
  name,
  size,
  color,
}: {
  name: IconName;
  size: number;
  color: string;
}) {
  return <Text style={{ fontSize: size, color }}>{ICONS[name]}</Text>;
}

const FIND_STEPS = [
  {
    icon: "search-outline",
    title: "Browse skills",
    text: "Open the Skills tab to see what people near you offer.",
  },
  {
    icon: "document-text-outline",
    title: "Open a skill",
    text: "Check the description, category and location.",
  },
  {
    icon: "paper-plane-outline",
    title: "Request service",
    text: "Tap Request Service, write what you need and send it.",
  },
  {
    icon: "notifications-outline",
    title: "Wait for a reply",
    text: "You get a notification when the provider accepts or declines.",
  },
] as const;

const OFFER_STEPS = [
  {
    icon: "add-circle-outline",
    title: "Add your skill",
    text: "Tap Add a skill and fill in the name, category and details.",
  },
  {
    icon: "mail-outline",
    title: "Check your requests",
    text: "Open the Requests tab and switch to Received.",
  },
  {
    icon: "checkmark-circle-outline",
    title: "Respond",
    text: "Accept or decline each request. Mark it completed when done.",
  },
  {
    icon: "create-outline",
    title: "Keep it updated",
    text: "Edit or delete your skills any time from their details page.",
  },
] as const;

export default function HomeScreen() {
  const { user } = useAuth();
  const meta: Record<string, any> = user?.user_metadata ?? {};
  const fullName: string =
    meta.full_name ??
    meta.name ??
    meta.display_name ??
    user?.email?.split("@")[0] ??
    "";
  const name = fullName.split(" ")[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroSmall}>
          Welcome{name ? `, ${name}` : ""} 👋
        </Text>
        <Text style={styles.heroTitle}>PNG Skills Exchange</Text>
        <Text style={styles.heroText}>
          Find people with the skills you need, or share your own skills with
          others.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.action, styles.actionPrimary]}
          onPress={() => router.push("/(tabs)/browse")}
        >
          <Ionicons name="search" size={22} color={colors.primary} />
          <Text style={styles.actionTextLight}>Browse skills</Text>
        </Pressable>
        <Pressable
          style={[styles.action, styles.actionOutline]}
          onPress={() => router.push("/skills/form")}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
          <Text style={styles.actionTextBlue}>Add a skill</Text>
        </Pressable>
      </View>

      <Section title="Need a skill?" steps={FIND_STEPS} />
      <Section title="Offering a skill?" steps={OFFER_STEPS} />

      <View style={styles.tip}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.tipText}>
          Allow notifications when asked, so you never miss a reply to your
          requests.
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  steps,
}: {
  title: string;
  steps: readonly { icon: string; title: string; text: string }[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {steps.map((s, i) => (
          <View
            key={s.title}
            style={[styles.step, i < steps.length - 1 && styles.stepBorder]}
          >
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.stepHeader}>
                <Ionicons
                  name={s.icon as IconName}
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.stepTitle}>{s.title}</Text>
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  hero: { backgroundColor: colors.primary, borderRadius: 16, padding: 20 },
  heroSmall: { color: colors.surface, fontSize: 15, fontWeight: "600" },
  heroTitle: {
    color: colors.surface,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
  },
  heroText: {
    color: colors.surface,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionTextLight: { color: colors.surface, fontWeight: "700", fontSize: 15 },
  actionTextBlue: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
  },
  stepBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumberText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  stepText: {
    marginTop: 3,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: 14,
  },
  tipText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
});
