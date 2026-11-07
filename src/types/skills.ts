export type Skill = {
  id: string;
  user_id: string;
  skill_name: string;
  category: string;
  description: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type SkillInput = Omit<Skill, "id" | "user_id" | "created_at">;
