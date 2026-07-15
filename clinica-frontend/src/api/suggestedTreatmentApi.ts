import type {
  ProcedureOption,
  ProceduresResponse,
  SuggestedTreatment,
  SuggestedTreatmentPayload,
  SuggestedTreatmentsResponse,
  TreatmentSpecialist,
  TreatmentSpecialistsResponse,
} from "../types/suggestedTreatment";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function convertErrorToText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(String).join(" ");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

async function getErrorMessage(
  response: Response,
): Promise<string> {
  let data: Record<string, unknown> = {};

  try {
    data = await response.json();
  } catch {
    return "No se pudo conectar correctamente con el servidor.";
  }

  if (response.status === 401) {
    return "Tu sesión venció. Vuelve a iniciar sesión.";
  }

  if (data.medical_record) {
    return convertErrorToText(data.medical_record);
  }

  if (data.procedure) {
    return convertErrorToText(data.procedure);
  }

  if (data.specialist) {
    return convertErrorToText(data.specialist);
  }

  if (data.tooth_code) {
    return convertErrorToText(data.tooth_code);
  }

  if (data.quantity) {
    return convertErrorToText(data.quantity);
  }

  if (data.notes) {
    return convertErrorToText(data.notes);
  }

  if (data.treatment_status) {
    return convertErrorToText(data.treatment_status);
  }

  if (data.non_field_errors) {
    return convertErrorToText(data.non_field_errors);
  }

  if (data.detail) {
    return convertErrorToText(data.detail);
  }

  if (data.error) {
    return convertErrorToText(data.error);
  }

  if (data.message) {
    return convertErrorToText(data.message);
  }

  const firstError = Object.values(data)[0];
  const message = convertErrorToText(firstError);

  return message || "No se pudo completar la operación.";
}

export async function getSuggestedTreatments(): Promise<
  SuggestedTreatment[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/suggested-treatments/`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data:
    | SuggestedTreatment[]
    | SuggestedTreatmentsResponse = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}

export async function getTreatmentProcedures(): Promise<
  ProcedureOption[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/procedures/?show_inactive=true`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data:
    | ProcedureOption[]
    | ProceduresResponse = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}

export async function getTreatmentSpecialists(): Promise<
  TreatmentSpecialist[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialists/?show_inactive=true`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data:
    | TreatmentSpecialist[]
    | TreatmentSpecialistsResponse = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}

export async function createSuggestedTreatment(
  treatment: SuggestedTreatmentPayload,
): Promise<SuggestedTreatment> {
  const response = await fetch(
    `${API_BASE_URL}/api/suggested-treatments/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(treatment),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function updateSuggestedTreatment(
  id: number,
  treatment: Partial<SuggestedTreatmentPayload>,
): Promise<SuggestedTreatment> {
  const response = await fetch(
    `${API_BASE_URL}/api/suggested-treatments/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(treatment),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}