import type {
  Payment,
  PaymentPayload,
  PaymentsResponse,
} from "../types/payment";

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

  if (data.budget) {
    return convertErrorToText(data.budget);
  }

  if (data.appointment) {
    return convertErrorToText(
      data.appointment,
    );
  }

  if (data.amount) {
    return convertErrorToText(data.amount);
  }

  if (data.payment_method) {
    return convertErrorToText(
      data.payment_method,
    );
  }

  if (data.reference_number) {
    return convertErrorToText(
      data.reference_number,
    );
  }

  if (data.non_field_errors) {
    const message = convertErrorToText(
      data.non_field_errors,
    );

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes("budget") &&
      lowerMessage.includes("appointment")
    ) {
      return "Debe seleccionar una cita o un presupuesto, pero no ambos.";
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

  const firstError =
    Object.values(data)[0];

  const message =
    convertErrorToText(firstError);

  return (
    message ||
    "No se pudo completar la operación."
  );
}

export async function getPayments(): Promise<
  Payment[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/payments/`,
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
    | Payment[]
    | PaymentsResponse =
    await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}

export async function createPayment(
  payment: PaymentPayload,
): Promise<Payment> {
  const response = await fetch(
    `${API_BASE_URL}/api/payments/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payment),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}