import type {
  ClinicUser,
  UserPayload,
  UserSpecialist,
  UsersResponse,
  UserSpecialistsResponse,
} from "../types/user";


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
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map(convertErrorToText)
      .filter(Boolean)
      .join(" ");
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
  let data: Record<string, unknown> = {};

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
      convertErrorToText(data.detail) ||
      "No tienes permiso para administrar usuarios."
    );
  }

  const preferredFields = [
    "username",
    "password",
    "first_name",
    "last_name",
    "email",
    "role",
    "specialist",
    "detail",
    "message",
    "error",
    "non_field_errors",
  ];

  for (const field of preferredFields) {
    if (data[field]) {
      const message =
        convertErrorToText(
          data[field],
        );

      if (message) {
        return message;
      }
    }
  }

  const firstError =
    Object.values(data)[0];

  return (
    convertErrorToText(firstError) ||
    "No se pudo completar la operación."
  );
}


export async function getUsers():
Promise<ClinicUser[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/`,
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
    | ClinicUser[]
    | UsersResponse =
      await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}


export async function getUserSpecialists():
Promise<UserSpecialist[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/specialists/` +
      `?show_inactive=true`,
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
    | UserSpecialist[]
    | UserSpecialistsResponse =
      await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}


export async function createUser(
  user: UserPayload,
): Promise<ClinicUser> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}


export async function updateUser(
  id: number,
  user: Partial<UserPayload>,
): Promise<ClinicUser> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}


async function patchUserAction(
  id: number,
  action: string,
  body?: Record<string, unknown>,
): Promise<ClinicUser> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/` +
      `${id}/${action}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(
        body ?? {},
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


export async function activateUser(
  id: number,
): Promise<ClinicUser> {
  return patchUserAction(
    id,
    "activate",
  );
}


export async function deactivateUser(
  id: number,
): Promise<ClinicUser> {
  return patchUserAction(
    id,
    "deactivate",
  );
}


export async function changeUserPassword(
  id: number,
  password: string,
  passwordConfirmation: string,
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/` +
      `${id}/set-password/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        password,
        password_confirmation:
          passwordConfirmation,
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

export async function deleteUser(
  userId: number,
  reason: string,
): Promise<void> {
  const token = localStorage.getItem(
    "access_token",
  );

  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/`,
    {
      method: "DELETE",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        reason,
      }),
    },
  );

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => null);

    throw new Error(
      data?.detail ??
        "No se pudo eliminar el usuario.",
    );
  }
}