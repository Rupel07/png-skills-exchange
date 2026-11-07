import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { createSkill, getSkill, updateSkill } from "../../services/skills";

const CATEGORIES = [
  "Carpentry",
  "Plumbing",
  "Electrical",
  "Mechanic",
  "Tutoring",
  "IT Support",
  "Cooking",
  "Sewing",
  "Other",
];

type Errors = {
  title?: string;
  description?: string;
  category?: string;
  price?: string;
};

export default function SkillFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Edit mode: load the skill and pre-fill the fields.
  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const skill = await getSkill(id);
        if (!active) return;
        setTitle(skill.title);
        setDescription(skill.description);
        setCategory(skill.category);
        setPrice(skill.price != null ? String(skill.price) : "");
        setLocation(skill.location ?? "");
      } catch (e) {
        Alert.alert("Error", "Could not load this skill.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const validate = (): boolean => {
    const next: Errors = {};
    if (title.trim().length < 3)
      next.title = "Enter a title (at least 3 characters).";
    if (!description.trim()) next.description = "Enter a description.";
    if (!category) next.category = "Choose a category.";
    if (price.trim() !== "") {
      const n = Number(price);
      if (Number.isNaN(n) || n < 0)
        next.price = "Price must be a number, 0 or more.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    const input = {
      title: title.trim(),
      description: description.trim(),
      category,
      price: price.trim() === "" ? null : Number(price),
      location: location.trim() === "" ? null : location.trim(),
    };

    try {
      setSaving(true);
      if (isEdit && id) {
        await updateSkill(id, input);
      } else {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) {
          Alert.alert("Not signed in", "Please log in again.");
          setSaving(false);
          return;
        }
        await createSkill(input, userId);
      }
      router.back();
    } catch (e) {
      setSaving(false);
      Alert.alert("Error", "Could not save the skill. Try again.");
    }
  };

  const screenTitle = isEdit ? "Edit Skill" : "Add Skill";

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: screenTitle }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: screenTitle }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. House painting"
          placeholderTextColor="#999"
        />
        {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

        <Text style={styles.label}>Category *</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => {
            const selected = c === category;
            return (
              <Pressable
                key={c}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setCategory(c)}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.category ? (
          <Text style={styles.error}>{errors.category}</Text>
        ) : null}

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            errors.description && styles.inputError,
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you offer, your experience, and your availability"
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
        />
        {errors.description ? (
          <Text style={styles.error}>{errors.description}</Text>
        ) : null}

        <Text style={styles.label}>Price (Kina, optional)</Text>
        <TextInput
          style={[styles.input, errors.price && styles.inputError]}
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 50"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
        {errors.price ? <Text style={styles.error}>{errors.price}</Text> : null}

        <Text style={styles.label}>Location (optional)</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Lae, Morobe"
          placeholderTextColor="#999"
        />

        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>
              {isEdit ? "Save changes" : "Add skill"}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D5D9DF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#222",
  },
  multiline: { minHeight: 110 },
  inputError: { borderColor: "#D32F2F" },
  error: { color: "#D32F2F", fontSize: 13, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D5D9DF",
  },
  chipSelected: { backgroundColor: "#1F6FEB", borderColor: "#1F6FEB" },
  chipText: { color: "#444", fontWeight: "600", fontSize: 14 },
  chipTextSelected: { color: "#fff" },
  saveBtn: {
    marginTop: 28,
    backgroundColor: "#1F6FEB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: "center" },
  cancelText: { color: "#1F6FEB", fontWeight: "600", fontSize: 15 },
});
