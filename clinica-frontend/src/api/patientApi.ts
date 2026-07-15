import type {
  Patient,
  PatientPayload,
  PatientsPaginatedResponse,
} from "../types/patient";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


function getAuthHeaders() {
  const token =
    localStorage.getItem(
      "access_token",
    );

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


function getMessage(
  value: unknown,
): string {
  if (Array.isArray(value)) {
    return value
      .map(getMessage)
      .filter(Boolean)
      .join(" ");
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    return Object.values(
      value as Record<string, unknown>,
    )
      .map(getMessage)
      .filter(Boolean)
      .join(" ");
  }

  return "";
}


async function getErrorMessage(
  response: Response,
): Promise<string> {
  let data:
    Record<string, unknown> = {};

  try {
    data = await response.json();
  } catch {
    return (
      "Ocurrió un error al comunicarse " +
      "con el servidor."
    );
  }

  if (response.status === 401) {
    return (
      "Tu sesión venció. " +
      "Vuelve a iniciar sesión."
    );
  }

  if (response.status === 403) {
    return (
      getMessage(data.detail) ||
      "No tienes permiso para realizar esta operación."
    );
  }

  if (data.dni) {
    const message =
      getMessage(data.dni);

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes("exists") ||
      lowerMessage.includes("unique") ||
      lowerMessage.includes("existe")
    ) {
      return (
        "Ya existe un paciente " +
        "registrado con este DNI."
      );
    }

    return message;
  }

  if (data.email) {
    const message =
      getMessage(data.email);

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes("exists") ||
      lowerMessage.includes("unique") ||
      lowerMessage.includes("existe")
    ) {
      return (
        "Ya existe un paciente " +
        "registrado con este correo."
      );
    }

    return message;
  }

  if (data.detail) {
    return getMessage(data.detail);
  }

  if (data.error) {
    return getMessage(data.error);
  }

  if (data.message) {
    return getMessage(data.message);
  }

  if (data.reason) {
    return getMessage(data.reason);
  }

  if (data.non_field_errors) {
    return getMessage(
      data.non_field_errors,
    );
  }

  const firstError =
    Object.values(data)[0];

  const message =
    getMessage(firstError);

  return (
    message ||
    "No se pudo completar la operación."
  );
}


export async function getPatients(
  search: string,
  showInactive: boolean,
  showDeleted: boolean = false,
): Promise<Patient[]> {
  const params =
    new URLSearchParams();

  if (search.trim()) {
    params.append(
      "search",
      search.trim(),
    );
  }

  /*
   * Cuando se consultan eliminados,
   * también necesitamos que el backend
   * no descarte registros inactivos.
   */
  if (
    showInactive ||
    showDeleted
  ) {
    params.append(
      "show_inactive",
      "true",
    );
  }

  if (showDeleted) {
    params.append(
      "show_deleted",
      "true",
    );
  }

  const query =
    params.toString();

  const response = await fetch(
    `${API_BASE_URL}/api/patients/${
      query ? `?${query}` : ""
    }`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const data:
    | Patient[]
    | PatientsPaginatedResponse =
      await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}


export async function createPatient(
  patient: PatientPayload,
): Promise<Patient> {
  const response = await fetch(
    `${API_BASE_URL}/api/patients/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(patient),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}


export async function updatePatient(
  id: number,
  patient: PatientPayload,
): Promise<Patient> {
  const response = await fetch(
    `${API_BASE_URL}/api/patients/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(patient),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}


export async function deactivatePatient(
  id: number,
  reason: string,
): Promise<Patient> {
  const response = await fetch(
    `${API_BASE_URL}/api/patients/${id}/deactivate/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reason,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}


export async function reactivatePatient(
  id: number,
): Promise<Patient> {
  const response = await fetch(
    `${API_BASE_URL}/api/patients/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        is_active: true,
        inactive_reason: null,
        deactivated_at: null,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}


/*
 * Eliminación lógica.
 *
 * El backend debe cambiar:
 * is_deleted = true
 * is_active = false
 */
export async function deletePatient(
  id: number,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/patients/${id}/`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }
}


/*
 * Restauración del paciente eliminado.
 */
export async function restorePatient(
  id: number,
): Promise<Patient> {
  const response = await fetch(
    `${API_BASE_URL}/api/patients/${id}/restore/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}