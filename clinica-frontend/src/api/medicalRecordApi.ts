import type {
  MedicalRecord,
  MedicalRecordPayload,
  MedicalRecordsResponse,
} from "../types/medicalRecord";

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

  if (data.patient) {
    const message = convertErrorToText(data.patient);
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("already exists") ||
      lowerMessage.includes("unique")
    ) {
      return "Este paciente ya tiene una historia clínica registrada.";
    }

    return message;
  }

  if (data.medical_history) {
    return convertErrorToText(data.medical_history);
  }

  if (data.allergies) {
    return convertErrorToText(data.allergies);
  }

  if (data.general_observations) {
    return convertErrorToText(
      data.general_observations,
    );
  }

  if (data.non_field_errors) {
    const message = convertErrorToText(
      data.non_field_errors,
    );

    if (
      message.toLowerCase().includes("unique") ||
      message.toLowerCase().includes("already exists")
    ) {
      return "Este paciente ya tiene una historia clínica registrada.";
    }

    return message;
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

export async function getMedicalRecords(): Promise<
  MedicalRecord[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/medical-records/`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data:
    | MedicalRecord[]
    | MedicalRecordsResponse = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}

export async function createMedicalRecord(
  medicalRecord: MedicalRecordPayload,
): Promise<MedicalRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/medical-records/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(medicalRecord),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function updateMedicalRecord(
  id: number,
  medicalRecord: MedicalRecordPayload,
): Promise<MedicalRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/medical-records/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(medicalRecord),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}