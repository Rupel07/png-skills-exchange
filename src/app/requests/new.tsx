import { colors } from "@/theme";
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
import { createRequest } from "../../services/requests";
import { getSkill } from "../../services/skills";
import { Skill } from "../../types/skills";

type Errors = { message?: string; date?: string };

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export default function NewRequestScreen() {
  const { skillId } = useLocalSearchParams<{ skillId: string }>();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [skillData, userRes] = await Promise.all([
          getSkill(skillId),
          supabase.auth.getUser(),
        ]);
        if (!active) return;
        setSkill(skillData);
        setUserId(userRes.data.user?.id ?? null);
      } catch (e) {
        if (active) setLoadError("Could not load this skill.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [skillId]);

  const validate = (): boolean => {
    const next: Errors = {};
    if (message.trim().length < 10) {
      next.message = "Please write at least 10 characters.";
    }
    if (date.trim() !== "") {
      if (!isValidDate(date.trim())) {
        next.date = "Use the format YYYY-MM-DD, e.g. 2026-12-01.";
      } else if (date.trim() < new Date().toISOString().slice(0, 10)) {
        next.date = "The date can't be in the past.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!skill || !userId) return;
    if (!validate()) return;

    try {
      setSaving(true);
      await createRequest(
        {
          skill_id: skill.id,
          provider_id: skill.user_id,
          message: message.trim(),
          preferred_date: date.trim() === "" ? null : date.trim(),
        },
        userId,
      );
      Alert.alert("Request sent", "The provider will see your request.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/my-requests") },
      ]);
    } catch (e) {
      setSaving(false);
      Alert.alert("Error", "Could not send the request. Try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Request Service" }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (loadError || !skill) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Request Service" }} />
        <Text style={styles.errorText}>{loadError ?? "Skill not found."}</Text>
        <Pressable style={styles.outlineBtn} onPress={() => router.back()}>
          <Text style={styles.outlineText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // Block requesting your own skill.
  if (skill.user_id === userId) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Request Service" }} />
        <Text style={styles.errorText}>You can't request your own skill.</Text>
        <Pressable style={styles.outlineBtn} onPress={() => router.back()}>
          <Text style={styles.outlineText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Request Service" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.skillCard}>
          <Text style={styles.skillLabel}>You are requesting</Text>
          <Text style={styles.skillTitle}>{skill.skill_name}</Text>
          <Text style={styles.skillMeta}>{skill.category}</Text>
        </View>

        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            errors.message && styles.inputError,
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe what you need and any details the provider should know"
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
        />
        {errors.message ? (
          <Text style={styles.error}>{errors.message}</Text>
        ) : null}

        <Text style={styles.label}>Preferred date (optional)</Text>
        <TextInput
          style={[styles.input, errors.date && styles.inputError]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        {errors.date ? <Text style={styles.error}>{errors.date}</Text> : null}

        <Pressable
          style={[styles.submitBtn, saving && styles.disabled]}
          onPress={onSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.submitText}>Send request</Text>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  skillCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: 16,
  },
  skillLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  skillTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  skillMeta: { fontSize: 14, color: "#555", marginTop: 4 },
  label: {
    marginTop: 20,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
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
  multiline: { minHeight: 120 },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: "center",
    marginBottom: 12,
  },
  submitBtn: {
    marginTop: 28,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  submitText: { color: colors.background, fontWeight: "700", fontSize: 16 },
  cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: "center" },
  cancelText: { color: colors.primary, fontWeight: "600", fontSize: 15 },
  outlineBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineText: { color: colors.primary, fontWeight: "600" },
});
