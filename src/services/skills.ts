import { supabase } from "../lib/supabase";
import { Skill, SkillInput } from "../types/skills";

export async function getSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSkill(id: string): Promise<Skill> {
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createSkill(input: SkillInput, userId: string) {
  const { error } = await supabase
    .from("skills")
    .insert({ ...input, user_id: userId });
  if (error) throw error;
}

export async function updateSkill(id: string, input: SkillInput) {
  const { error } = await supabase.from("skills").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteSkill(id: string) {
  const { error } = await supabase.from("skills").delete().eq("id", id);
  if (error) throw error;
}
