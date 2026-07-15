export type TreatmentStatus =
  | "Suggested"
  | "Budgeted"
  | "In Progress"
  | "Finished"
  | "Cancelled";

export interface SuggestedTreatment {
  id: number;
  medical_record: number;
  procedure: number | null;
  specialist: number;
  tooth_code: string | null;
  quantity: number;
  notes: string | null;
  treatment_status: TreatmentStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuggestedTreatmentPayload {
  medical_record: number;
  procedure: number;
  specialist: number;
  tooth_code: string | null;
  quantity: number;
  notes: string | null;
  treatment_status: TreatmentStatus;
  is_active: boolean;
}

export interface ProcedureOption {
  id: number;
  name: string;
  price: string;
  description: string | null;
  is_active: boolean;
}

export interface TreatmentSpecialist {
  id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  is_active: boolean;
}

export interface SuggestedTreatmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SuggestedTreatment[];
}

export interface ProceduresResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProcedureOption[];
}

export interface TreatmentSpecialistsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TreatmentSpecialist[];
}