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
import { getSkills } from "../../services/skills";
import { Skill } from "../../types/skills";

const styles: Record<string, any> = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1F6FEB",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 30, lineHeight: 32 },

  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  cardPressed: { opacity: 0.75 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { flex: 1, fontSize: 17, fontWeight: "600", color: "#222" },
  price: { marginLeft: 12, fontWeight: "600", color: "#246b45" },
  category: { marginTop: 6, color: "#666" },
  description: { marginTop: 8, color: "#444" },
  location: { marginTop: 8, color: "#666" },
});

export default function SkillsListScreen() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    try {
      setError(null);
      const data = await getSkills();
      setSkills(data);
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
          {item.title}
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Error with nothing to show
  if (error && skills.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#b00020", textAlign: "center" }}>{error}</Text>
        <Pressable onPress={onRefresh} style={{ marginTop: 16 }}>
          <Text style={{ color: "#246b45", fontWeight: "600" }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <Text style={{ color: "#666", textAlign: "center" }}>
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
