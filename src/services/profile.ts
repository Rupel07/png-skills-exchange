import { supabase } from "../lib/supabase";

export type ProfileStats = { skills: number; sent: number; received: number };

async function countRows(
  table: "skills" | "service_requests",
  column: "user_id" | "requester_id" | "provider_id",
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, userId);
  if (error) throw error;
  return count ?? 0;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [skills, sent, received] = await Promise.all([
    countRows("skills", "user_id", userId),
    countRows("service_requests", "requester_id", userId),
    countRows("service_requests", "provider_id", userId),
  ]);
  return { skills, sent, received };
}
