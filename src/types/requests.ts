
export type RequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

export type ServiceRequest = {
  id: string;
  skill_id: string;
  requester_id: string;
  provider_id: string;
  message: string;
  preferred_date: string | null;
  status: RequestStatus;
  created_at: string;
  skills?: { skill_name: string; category: string } | null;
};

export type RequestInput = {
  skill_id: string;
  provider_id: string;
  message: string;
  preferred_date: string | null;
};
