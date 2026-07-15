export type BudgetStatus =
  | "Draft"
  | "Approved"
  | "Closed"
  | "Cancelled";

export interface Budget {
  id: number;
  suggested_treatment: number;
  patient: number;
  gross_total: string;
  discount: string;
  net_total: string;
  budget_status: BudgetStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetPayload {
  suggested_treatment: number;
  patient: number;
  gross_total: string;
  discount: string;
  net_total: string;
  budget_status: BudgetStatus;
  is_active: boolean;
}

export interface BudgetsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Budget[];
}