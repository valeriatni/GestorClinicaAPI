export interface Specialty {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpecialtyPayload {
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface SpecialtiesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Specialty[];
}