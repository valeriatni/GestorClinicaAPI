export interface MedicalRecordPatient {
  id: number;
  first_name: string;
  last_name: string;
  dni: string;
  phone?: string | null;
  email?: string | null;
  birth_date?: string | null;
  address?: string | null;
  is_active: boolean;
  is_deleted?: boolean;
}


export type MedicalRecordPatientRelation =
  | number
  | MedicalRecordPatient;


export interface MedicalRecordAppointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  appointment_status: string;
  specialist: string;
}


export interface MedicalRecordTreatment {
  id: number;
  procedure: number | null;
  procedure_name: string | null;
  specialist: string;
  diagnosis: string;
  clinical_observations: string | null;
  diagnosis_date: string;
  treatment_status: string;
  created_at: string;
  updated_at: string;
}


export interface MedicalRecordBudget {
  id: number;
  gross_total: string;
  discount: string;
  net_total: string;
  budget_status: string;
  issue_date: string;
}


export interface MedicalRecordPayment {
  id: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  budget: number | null;
  appointment: number | null;
}


export interface MedicalRecord {
  id: number;

  patient:
    MedicalRecordPatientRelation;

  medical_history:
    string | null;

  allergies:
    string | null;

  general_observations:
    string | null;

  is_active: boolean;

  inactive_reason:
    string | null;

  deactivated_at:
    string | null;

  created_at: string;
  updated_at: string;

  appointments?:
    MedicalRecordAppointment[];

  suggested_treatments?:
    MedicalRecordTreatment[];

  budgets?:
    MedicalRecordBudget[];

  payments?:
    MedicalRecordPayment[];
}


export interface MedicalRecordPayload {
  patient: number;

  medical_history:
    string | null;

  allergies:
    string | null;

  general_observations:
    string | null;
}


export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
