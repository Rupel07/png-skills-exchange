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
import { getSkillsCached } from "../../services/skills";
import { Skill } from "../../types/skills";

export default function SkillsListScreen() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const loadSkills = useCallback(async () => {
    try {
      setError(null);
      const result = await getSkillsCached();
      setSkills(result.skills);
      setOffline(result.fromCache);
      setSavedAt(result.savedAt);
    } catch (e) {
      setError("Could not load skills. Check your connection and try again.");
    }
  }, []);

  // Runs every time the screen comes into focus, so the list
  // refreshes after you add, edit or delete a skill.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await loadSkills();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [loadSkills]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSkills();
    setRefreshing(false);
  };

  const openSkill = (id: string) =>
    router.push({ pathname: "/skills/[id]" as any, params: { id } });

  const renderItem = ({ item }: { item: Skill }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => openSkill(item.id)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>
          {item.skill_name}
        </Text>
        {item.price != null && <Text style={styles.price}>K{item.price}</Text>}
      </View>
      <Text style={styles.category}>{item.category}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      {item.location ? (
        <Text style={styles.location}>📍 {item.location}</Text>
      ) : null}
    </Pressable>
  );

  // First load
  if (loading && skills.length === 0 && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Error with nothing to show
  if (error && skills.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={onRefresh} style={styles.retry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Offline – showing saved skills
            {savedAt ? ` from ${new Date(savedAt).toLocaleString()}` : ""}
          </Text>
        </View>
      )}

      <FlatList
        data={skills}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={
          skills.length === 0
            ? styles.center
            : { padding: 16, paddingBottom: 96 }
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {error ?? "No skills available yet."}
          </Text>
        }
      />

      <Pressable style={styles.fab} onPress={() => router.push("/skills/form")}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: { flex: 1, backgroundColor: colors.background },
  offlineBanner: {
    backgroundColor: colors.warningBg,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: { color: colors.warningText, fontSize: 13, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: colors.onPrimary, fontSize: 30, lineHeight: 32 },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  cardPressed: { opacity: 0.75 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { flex: 1, fontSize: 17, fontWeight: "600", color: colors.text },
  price: { marginLeft: 12, fontWeight: "600", color: colors.success },
  category: { marginTop: 6, color: colors.textMuted },
  description: { marginTop: 8, color: colors.text },
  location: { marginTop: 8, color: colors.textMuted },
  errorText: { color: colors.danger, textAlign: "center" },
  retry: { marginTop: 16 },
  retryText: { color: colors.primary, fontWeight: "600" },
  emptyText: { color: colors.textMuted, textAlign: "center" },
});
