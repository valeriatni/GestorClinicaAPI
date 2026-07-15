export interface MedicalRecord {
  id: number;
  patient: number;
  medical_history: string | null;
  allergies: string | null;
  general_observations: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordPayload {
  patient: number;
  medical_history: string | null;
  allergies: string | null;
  general_observations: string | null;
  is_active: boolean;
}

export interface MedicalRecordsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MedicalRecord[];
}