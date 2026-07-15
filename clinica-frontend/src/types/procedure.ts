export interface Procedure {
  id: number;
  name: string;
  description?: string;
  base_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcedureFormData {
  name: string;
  description: string;
  base_price: string;
}