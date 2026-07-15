import type {
  SpecialtiesResponse,
  Specialty,
  SpecialtyPayload,
} from "../types/specialty";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders() {
  const token = localStorage.getItem(
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
      .map((item) =>
        convertErrorToText(item),
      )
      .join(" ");
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.values(value)
      .map((item) =>
        convertErrorToText(item),
      )
      .join(" ");
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

  if (data.name) {
    const message = convertErrorToText(
      data.name,
    );

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes("exists") ||
      lowerMessage.includes("unique")
    ) {
      return "Ya existe una especialidad registrada con este nombre.";
    }

    return message;
  }

  if (data.description) {
    return convertErrorToText(
      data.description,
    );
  }

  if (data.is_active) {
    return convertErrorToText(
      data.is_active,
    );
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
    convertErrorToText(firstError);

  return (
    message ||
    "No se pudo completar la operación."
  );
}

export async function getSpecialties(
  showInactive: boolean,
): Promise<Specialty[]> {
  const params = new URLSearchParams();

  if (showInactive) {
    params.append(
      "show_inactive",
      "true",
    );
  }

  const query = params.toString();

  const response = await fetch(
    `${API_BASE_URL}/api/specialties/${
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
    | Specialty[]
    | SpecialtiesResponse =
    await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}

export async function createSpecialty(
  specialty: SpecialtyPayload,
): Promise<Specialty> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialties/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(specialty),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}

export async function updateSpecialty(
  id: number,
  specialty: SpecialtyPayload,
): Promise<Specialty> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialties/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(specialty),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}

export async function changeSpecialtyStatus(
  id: number,
  isActive: boolean,
): Promise<Specialty> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialties/${id}/`,
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