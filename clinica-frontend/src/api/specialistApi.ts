import type {
  Specialist,
  SpecialistPayload,
  SpecialistsResponse,
} from "../types/specialist";


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


function convertErrorToText(
  value: unknown,
): string {
  if (Array.isArray(value)) {
    return value
      .map(convertErrorToText)
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
      .map(convertErrorToText)
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
      "No se pudo conectar correctamente " +
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
      convertErrorToText(
        data.detail,
      ) ||
      "No tienes permiso para realizar esta operación."
    );
  }

  if (data.specialty) {
    return convertErrorToText(
      data.specialty,
    );
  }

  if (data.first_name) {
    return convertErrorToText(
      data.first_name,
    );
  }

  if (data.last_name) {
    return convertErrorToText(
      data.last_name,
    );
  }

  if (data.license_number) {
    const message =
      convertErrorToText(
        data.license_number,
      );

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes("exists") ||
      lowerMessage.includes("unique") ||
      lowerMessage.includes("existe")
    ) {
      return (
        "Ya existe un especialista " +
        "registrado con este número de colegiatura."
      );
    }

    return message;
  }

  if (data.phone) {
    return convertErrorToText(
      data.phone,
    );
  }

  if (data.email) {
    const message =
      convertErrorToText(
        data.email,
      );

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes("exists") ||
      lowerMessage.includes("unique") ||
      lowerMessage.includes("existe")
    ) {
      return (
        "Ya existe un especialista " +
        "registrado con este correo."
      );
    }

    return message;
  }

  if (data.non_field_errors) {
    return convertErrorToText(
      data.non_field_errors,
    );
  }

  if (data.detail) {
    return convertErrorToText(
      data.detail,
    );
  }

  if (data.error) {
    return convertErrorToText(
      data.error,
    );
  }

  if (data.message) {
    return convertErrorToText(
      data.message,
    );
  }

  const firstError =
    Object.values(data)[0];

  const message =
    convertErrorToText(
      firstError,
    );

  return (
    message ||
    "No se pudo completar la operación."
  );
}


export async function getSpecialists(
  showInactive: boolean,
  showDeleted: boolean,
): Promise<Specialist[]> {
  const params =
    new URLSearchParams();

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
    `${API_BASE_URL}/api/specialists/${
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
    | Specialist[]
    | SpecialistsResponse =
      await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}


export async function createSpecialist(
  specialist:
    SpecialistPayload,
): Promise<Specialist> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialists/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(
        specialist,
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}


export async function updateSpecialist(
  id: number,
  specialist:
    SpecialistPayload,
): Promise<Specialist> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialists/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(
        specialist,
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}


export async function changeSpecialistStatus(
  id: number,
  isActive: boolean,
): Promise<Specialist> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialists/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        is_active: isActive,
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
 */
export async function deleteSpecialist(
  id: number,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialists/${id}/`,
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
 * Restauración del especialista eliminado.
 */
export async function restoreSpecialist(
  id: number,
): Promise<Specialist> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialists/${id}/restore/`,
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