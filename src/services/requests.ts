import { supabase } from "../lib/supabase";
import { RequestInput, RequestStatus, ServiceRequest } from "../types/requests";

const SELECT = "*, skills(skill_name, category)";

export async function getMyRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from("service_requests")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ServiceRequest[];
}

export async function getRequest(id: string): Promise<ServiceRequest> {
  const { data, error } = await supabase
    .from("service_requests")
    .select(SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as ServiceRequest;
}

export async function createRequest(input: RequestInput, requesterId: string) {
  const { error } = await supabase
    .from("service_requests")
    .insert({ ...input, requester_id: requesterId });
  if (error) throw error;
}

export async function updateRequestStatus(id: string, status: RequestStatus) {
  const { error } = await supabase
    .from("service_requests")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}
