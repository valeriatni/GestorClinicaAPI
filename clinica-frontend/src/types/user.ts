export type UserRole =
  | "Gerente"
  | "Recepcionista"
  | "Especialista";


export interface ClinicUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: UserRole | null;
  specialist: number | null;
  specialist_name: string | null;
  is_active: boolean;
  date_joined: string;
  is_deleted: boolean;
  deletion_reason: string | null;
  deleted_at: string | null;
}


export interface UserPayload {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  specialist: number | null;
  password?: string;
}


export interface UsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClinicUser[];
}


export interface UserSpecialist {
  id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  is_active: boolean;
  is_deleted?: boolean;
}


export interface UserSpecialistsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserSpecialist[];
}