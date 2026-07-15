export type PaymentMethod =
  | "Cash"
  | "Card"
  | "Transfer"
  | "Insurance";

export interface Payment {
  id: number;
  budget: number | null;
  appointment: number | null;
  amount: string;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentPayload {
  budget: number | null;
  appointment: number | null;
  amount: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
}

export interface PaymentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payment[];
}