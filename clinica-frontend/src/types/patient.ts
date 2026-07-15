export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  dni: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  address: string | null;
  is_active: boolean;
  is_deleted: boolean;
  inactive_reason: string | null;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientPayload {
  first_name: string;
  last_name: string;
  dni: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  address: string | null;
}

export interface PatientFormData {
  first_name: string;
  last_name: string;
  dni: string;
  phone: string;
  email: string;
  birth_date: string;
  address: string;
}

export interface PatientsPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Patient[];
}