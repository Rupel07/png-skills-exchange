import { loadCache } from "@/lib/cache";
import { supabase } from "../lib/supabase";
import type { Skill, SkillInput } from "../types/skills";

const SKILLS_CACHE_KEY = "skills-list";

export type SkillsResult = {
  skills: Skill[];
  fromCache: boolean; // true when the network failed and saved data is shown
  savedAt: number | null; // when the saved copy was last refreshed
};

export async function getSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSkillsCached(): Promise<SkillsResult> {
  try {
    const skills = await getSkills();
    await saveCache(SKILLS_CACHE_KEY, skills);
    return { skills, fromCache: false, savedAt: Date.now() };
  } catch (err) {
    const cached = await loadCache<Skill[]>(SKILLS_CACHE_KEY);
    if (cached) {
      return { skills: cached.data, fromCache: true, savedAt: cached.savedAt };
    }
    throw err; // offline and nothing saved yet: let the screen show its error
  }
}
export async function getSkill(id: string): Promise<Skill> {
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    const cached = await loadCache<Skill[]>(SKILLS_CACHE_KEY);
    const found = cached?.data.find((s) => s.id === id);
    if (found) return found;
    throw error;
  }
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
function saveCache(key: string, skills: Skill[]) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ data: skills, savedAt: Date.now() }),
    );
  } catch {
    // Caching is best-effort; unavailable storage should not block loading skills.
  }
}
