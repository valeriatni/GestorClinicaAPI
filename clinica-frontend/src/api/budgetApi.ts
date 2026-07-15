import type {
  Budget,
  BudgetPayload,
  BudgetsResponse,
} from "../types/budget";

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
    return convertErrorToText(data.patient);
  }

  if (data.suggested_treatment) {
    const message = convertErrorToText(
      data.suggested_treatment,
    );

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes("unique") ||
      lowerMessage.includes("already exists")
    ) {
      return "Este tratamiento sugerido ya tiene un presupuesto registrado.";
    }

    return message;
  }

  if (data.gross_total) {
    return convertErrorToText(
      data.gross_total,
    );
  }

  if (data.discount) {
    return convertErrorToText(data.discount);
  }

  if (data.net_total) {
    return convertErrorToText(data.net_total);
  }

  if (data.budget_status) {
    return convertErrorToText(
      data.budget_status,
    );
  }

  if (data.non_field_errors) {
    return convertErrorToText(
      data.non_field_errors,
    );
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

  const firstError =
    Object.values(data)[0];

  const message =
    convertErrorToText(firstError);

  return (
    message ||
    "No se pudo completar la operación."
  );
}

export async function getBudgets(): Promise<
  Budget[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/budgets/`,
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
    | Budget[]
    | BudgetsResponse =
    await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}

export async function createBudget(
  budget: BudgetPayload,
): Promise<Budget> {
  const response = await fetch(
    `${API_BASE_URL}/api/budgets/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(budget),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}

export async function updateBudget(
  id: number,
  budget: Partial<BudgetPayload>,
): Promise<Budget> {
  const response = await fetch(
    `${API_BASE_URL}/api/budgets/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(budget),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}