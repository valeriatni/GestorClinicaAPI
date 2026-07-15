export type UserRole =
  | "Gerente"
  | "Recepcionista"
  | "Especialista";

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: UserRole;
  specialist_id: number | null;
  specialist_name: string | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}