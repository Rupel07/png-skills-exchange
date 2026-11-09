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
import { useAuth } from "../../context/AuthContext";
import { createRequest } from "../../services/requests";
import { getSkill } from "../../services/skills";
import { Skill } from "../../types/skills";

type Errors = { message?: string; date?: string };

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export default function NewRequestScreen() {
  const { skillId } = useLocalSearchParams<{ skillId: string }>();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [skill, setSkill] = useState<Skill | null>(null);
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
        const skillData = await getSkill(skillId);
        if (active) setSkill(skillData);
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadError || !skill) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Request Service" }} />
        <Text style={styles.errorText}>{loadError ?? "Skill not found."}</Text>
        <Pressable style={styles.outlineBtn} onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // Block requesting your own skill
  if (userId === skill.user_id) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Request Service" }} />
        <Text style={styles.errorText}>You cannot request your own skill.</Text>
        <Pressable style={styles.outlineBtn} onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <Stack.Screen options={{ title: "Request Service" }} />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
          Request: {skill.id}
        </Text>
        <Text style={{ color: colors.text, marginBottom: 24 }}>
          Provider ID: {skill.user_id}
        </Text>
        <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Message</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: errors.message ? "red" : colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 4,
            minHeight: 80,
            textAlignVertical: "top",
          }}
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="Describe what you need..."
        />
        {errors.message ? (
          <Text style={{ color: "red", marginBottom: 8 }}>
            {errors.message}
          </Text>
        ) : null}
        <Text style={{ fontWeight: "bold", marginBottom: 4, marginTop: 16 }}>
          Preferred Date (optional)
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: errors.date ? "red" : colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 4,
          }}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
        />
        {errors.date ? (
          <Text style={{ color: "red", marginBottom: 8 }}>{errors.date}</Text>
        ) : null}
        <Pressable
          style={{
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 24,
            opacity: saving ? 0.7 : 1,
          }}
          onPress={onSubmit}
          disabled={saving}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            {saving ? "Sending..." : "Send Request"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
