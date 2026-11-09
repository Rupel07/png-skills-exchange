import { colors } from "@/theme";
import * as Location from "expo-location";
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
import { useAuth } from "../../context/AuthContext";
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

type Coords = {
  latitude: number;
  longitude: number;
};

export default function SkillFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Edit mode: load the skill and pre-fill the fields.
  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const skill = await getSkill(id);
        if (!active) return;
        if (skill.latitude != null && skill.longitude != null) {
          setCoords({ latitude: skill.latitude, longitude: skill.longitude });
        }
        setTitle(skill.skill_name ?? "");
        setDescription(skill.description);
        setCategory(skill.category);
        const skillPrice = (skill as unknown as { price?: number | null })
          .price;
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

  const fillFromCurrentLocation = async () => {
    setLocating(true);
    setLocationError(null);
    const result = await getCurrentCoords();
    if (result.status === "granted") {
      setCoords(result.coords);
      const place = await reverseGeocode(result.coords);
      if (place && location.trim() === "") setLocation(place);
    } else if (result.status === "denied") {
      setLocationError(
        "Location permission was denied. Allow it in your phone settings, or type the place by hand.",
      );
    } else {
      setLocationError(
        "Could not get your position. Check that location is switched on and try again.",
      );
    }
    setLocating(false);
  };

  const onSave = async () => {
    if (!validate()) return;

    const input = {
      skill_name: title.trim(),
      description: description.trim(),
      category,
      price: price.trim() === "" ? null : Number(price),
      location: location.trim() === "" ? null : location.trim(),
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    };

    try {
      setSaving(true);
      if (isEdit && id) {
        await updateSkill(id, input);
      } else {
        if (!user) {
          Alert.alert("Not signed in", "Please log in again.");
          setSaving(false);
          return;
        }
        await createSkill(input, user.id);
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
        <ActivityIndicator size="large" color={colors.primary} />
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
          placeholderTextColor={colors.placeholder}
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
          placeholderTextColor={colors.placeholder}
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
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
        />
        {errors.price ? <Text style={styles.error}>{errors.price}</Text> : null}

        <Text style={styles.label}>Location (optional)</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Lae, Morobe"
          placeholderTextColor={colors.placeholder}
        />
        <Pressable
          style={styles.locationBtn}
          onPress={fillFromCurrentLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.locationBtnText}>
              {coords
                ? "Update from my current location"
                : "Use my current location"}
            </Text>
          )}
        </Pressable>
        <Text style={styles.hint}>
          {coords
            ? "Map position saved."
            : "Add a position so this skill appears on the map."}
        </Text>
        {locationError ? (
          <Text style={styles.error}>{locationError}</Text>
        ) : null}

        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textBody,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  multiline: { minHeight: 110 },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.textBody, fontWeight: "600", fontSize: 14 },
  chipTextSelected: { color: colors.onPrimary },
  locationBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  locationBtnText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  hint: { color: colors.textBody, fontSize: 12, marginTop: 6 },
  saveBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  disabled: { opacity: 0.6 },
  saveText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: "center" },
  cancelText: { color: colors.textBody, fontWeight: "600" },
});

type CurrentCoordsResult =
  | { status: "granted"; coords: Coords }
  | { status: "denied" }
  | { status: "error" };

async function getCurrentCoords(): Promise<CurrentCoordsResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return { status: "denied" };

    const position = await Location.getCurrentPositionAsync({});
    return {
      status: "granted",
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch {
    return { status: "error" };
  }
}

async function reverseGeocode(coords: Coords): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    const place = results[0];
    if (!place) return null;
    return [place.city, place.region, place.country].filter(Boolean).join(", ");
  } catch {
    return null;
  }
}
