export type PaymentMethod =
  | "Cash"
  | "Card"
  | "Transfer"
  | "Insurance";


export type Relation<T extends { id: number }> =
  | number
  | T;


export interface PaymentPatient {
  id: number;
  first_name: string;
  last_name: string;
  dni: string;
  is_active: boolean;
  is_deleted?: boolean;
}


export interface PaymentProcedure {
  id: number;
  name: string;
  description?: string | null;
  base_price?: string;
  price?: string;
  is_active?: boolean;
  is_deleted?: boolean;
}


export interface PaymentTreatment {
  id: number;

  procedure:
    | Relation<PaymentProcedure>
    | null;

  diagnosis?: string;
  diagnosis_date?: string;
  treatment_status?: string;
}


export interface PaymentBudget {
  id: number;

  patient:
    Relation<PaymentPatient>;

  suggested_treatment:
    Relation<PaymentTreatment>;

  gross_total: string;
  discount: string;
  net_total: string;
  budget_status: string;

  is_active?: boolean;
  is_deleted?: boolean;
}


export interface PaymentAppointment {
  id: number;

  patient:
    Relation<PaymentPatient>;

  appointment_date: string;
  appointment_time: string;
  reason: string;
  appointment_status: string;

  is_active?: boolean;
  is_deleted?: boolean;
}


export interface Payment {
  id: number;

  budget:
    | Relation<PaymentBudget>
    | null;

  appointment:
    | Relation<PaymentAppointment>
    | null;

  amount: string;
  payment_date: string;
  payment_method: PaymentMethod;

  reference_number:
    | string
    | null;

  remaining_balance:
    | string
    | number
    | null;

  created_at: string;
  updated_at: string;
}


export interface PaymentPayload {
  budget: number | null;
  appointment: number | null;
  amount: string;
  payment_method: PaymentMethod;

  reference_number:
    | string
    | null;
}


export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
