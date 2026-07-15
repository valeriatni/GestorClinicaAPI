export interface Specialist {
  id: number;
  specialty: number;
  first_name: string;
  last_name: string;
  license_number: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpecialistPayload {
  specialty: number;
  first_name: string;
  last_name: string;
  license_number: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

export interface SpecialistsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Specialist[];
}