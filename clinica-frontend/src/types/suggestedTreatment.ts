export type TreatmentStatus =
  | "Suggested"
  | "Budgeted"
  | "In Progress"
  | "Finished"
  | "Cancelled";


export interface PatientRelation {
  id: number;
  first_name?: string;
  last_name?: string;
  dni?: string;
}


export interface MedicalRecordRelation {
  id: number;

  patient:
    | number
    | PatientRelation;

  medical_history:
    | string
    | null;

  allergies:
    | string
    | null;

  general_observations:
    | string
    | null;

  is_active: boolean;
}


export interface ProcedureOption {
  id: number;
  name: string;

  description:
    | string
    | null;

  /*
   * El modelo actual usa base_price.
   * price queda opcional para tolerar
   * serializers antiguos mientras se
   * termina la migración del frontend.
   */
  base_price?: string;
  price?: string;

  is_active: boolean;
  is_deleted?: boolean;
}


export interface TreatmentSpecialist {
  id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  is_active: boolean;
  is_deleted?: boolean;
}


export type RelationValue<T> =
  | number
  | T;


export interface SuggestedTreatment {
  id: number;

  medical_record:
    RelationValue<MedicalRecordRelation>;

  procedure:
    | RelationValue<ProcedureOption>
    | null;

  specialist:
    RelationValue<TreatmentSpecialist>;

  diagnosis: string;

  clinical_observations:
    | string
    | null;

  diagnosis_date: string;

  treatment_status:
    TreatmentStatus;

  is_active: boolean;
  is_deleted: boolean;

  cancelled_reason:
    | string
    | null;

  cancelled_at:
    | string
    | null;

  created_at: string;
  updated_at: string;
}


export interface SuggestedTreatmentPayload {
  medical_record: number;
  procedure: number;
  specialist: number;

  diagnosis: string;

  clinical_observations:
    | string
    | null;

  diagnosis_date: string;

  treatment_status:
    TreatmentStatus;

  is_active?: boolean;

  cancelled_reason?:
    | string
    | null;
}


export interface SuggestedTreatmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SuggestedTreatment[];
}


export interface ProceduresResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProcedureOption[];
}


export interface TreatmentSpecialistsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TreatmentSpecialist[];
}
