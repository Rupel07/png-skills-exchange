export type Skill = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price: number | null;
  location: string | null;
  created_at: string;
};

export type SkillInput = Omit<Skill, "id" | "user_id" | "created_at">;
