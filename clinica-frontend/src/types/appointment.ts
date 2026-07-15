export type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "Waiting"
  | "In Consultation"
  | "Attended"
  | "Cancelled"
  | "No Show";

export interface Appointment {
  id: number;
  patient: number;
  patient_name: string;
  specialist: number;
  specialist_name: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  appointment_status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AppointmentPayload {
  patient: number;
  specialist: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  appointment_status: AppointmentStatus;
}

export interface AppointmentSpecialist {
  id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  is_active: boolean;
  specialty:
    | number
    | {
        id: number;
        name: string;
      };
}

export interface AppointmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Appointment[];
}

export interface SpecialistsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AppointmentSpecialist[];
}