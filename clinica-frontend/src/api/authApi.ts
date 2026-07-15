import type {
  AuthUser,
  LoginResponse,
} from "../types/auth";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (typeof data.message === "string") {
      return data.message;
    }
  } catch {
    // La respuesta no tenía JSON.
  }

  return "Ocurrió un error al procesar la solicitud.";
}


export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/token/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "El usuario o la contraseña son incorrectos."
      );
    }

    throw new Error(
      await getErrorMessage(response)
    );
  }

  return response.json();
}


export async function getCurrentUser(
  accessToken?: string
): Promise<AuthUser> {
  const token =
    accessToken ??
    localStorage.getItem("access_token");

  if (!token) {
    throw new Error(
      "No existe una sesión iniciada."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/me/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "La sesión venció. Inicie sesión nuevamente."
      );
    }

    throw new Error(
      await getErrorMessage(response)
    );
  }

  return response.json();
}