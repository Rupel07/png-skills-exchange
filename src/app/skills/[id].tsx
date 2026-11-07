import {
  Href,
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
import { deleteSkill, getSkill } from "../../services/skills";
import { Skill } from "../../types/skills";

export default function SkillDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reload on focus so edits made on the form show up when you come back.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          setError(null);
          const [skillData, userRes] = await Promise.all([
            getSkill(id),
            supabase.auth.getUser(),
          ]);
          if (!active) return;
          setSkill(skillData);
          setCurrentUserId(userRes.data.user?.id ?? null);
        } catch (e) {
          if (active) setError("Could not load this skill.");
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [id]),
  );

  const isOwner = !!skill && skill.user_id === currentUserId;
  const price = (skill as (Skill & { price?: number | null }) | null)?.price;

  const confirmDelete = () => {
    if (!skill) return;
    Alert.alert(
      "Delete skill",
      "This will permanently remove this skill. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteSkill(skill.id);
              router.back();
            } catch (e) {
              setDeleting(false);
              Alert.alert("Error", "Could not delete the skill. Try again.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Skill Details" }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !skill) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Skill Details" }} />
        <Text style={styles.errorText}>{error ?? "Skill not found."}</Text>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Skill Details" }} />

      <Text style={styles.title}>
        {(skill as Skill & { title: string }).title}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{skill.category}</Text>
        </View>
        {price != null && <Text style={styles.price}>K{price}</Text>}
      </View>

      <Text style={styles.label}>Description</Text>
      <Text style={styles.body}>{skill.description}</Text>

      {skill.location ? (
        <>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.body}>📍 {skill.location}</Text>
        </>
      ) : null}

      <Text style={styles.label}>Posted</Text>
      <Text style={styles.body}>
        {new Date(skill.created_at).toLocaleDateString()}
      </Text>

      {isOwner ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.editBtn]}
            onPress={() =>
              router.push({
                pathname: "/skills/form",
                params: { id: skill.id },
              } as unknown as Href)
            }
            disabled={deleting}
          >
            <Text style={styles.btnText}>Edit</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.deleteBtn, deleting && styles.disabled]}
            onPress={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Delete</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.editBtn]}
            onPress={() =>
              router.push({
                pathname: "/requests/new",
                params: { skillId: skill.id },
              } as unknown as Href)
            }
          >
            <Text style={styles.btnText}>Request Service</Text>
          </Pressable>
        </View>
      )}
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
  title: { fontSize: 24, fontWeight: "700", color: "#222" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  chip: {
    backgroundColor: "#E3EEFF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  chipText: { color: "#1F6FEB", fontWeight: "600", fontSize: 13 },
  price: { marginLeft: 12, fontSize: 18, fontWeight: "700", color: "#246b45" },
  label: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
  },
  body: { marginTop: 4, fontSize: 16, color: "#333", lineHeight: 22 },
  actions: { flexDirection: "row", gap: 12, marginTop: 32 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  editBtn: { backgroundColor: "#1F6FEB" },
  deleteBtn: { backgroundColor: "#D32F2F" },
  disabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorText: {
    fontSize: 15,
    color: "#B00020",
    textAlign: "center",
    marginBottom: 12,
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F6FEB",
  },
  secondaryText: { color: "#1F6FEB", fontWeight: "600" },
});
