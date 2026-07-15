import type {
  PaginatedResponse,
  Payment,
  PaymentAppointment,
  PaymentBudget,
  PaymentPatient,
  PaymentPayload,
  PaymentProcedure,
  PaymentTreatment,
} from "../types/payment";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


function getAuthHeaders() {
  const token =
    localStorage.getItem(
      "access_token",
    );

  return {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}


async function getErrorMessage(
  response: Response,
): Promise<string> {
  const data = await response
    .json()
    .catch(() => null);

  if (
    data &&
    typeof data === "object"
  ) {
    const objectData =
      data as Record<
        string,
        unknown
      >;

    if (
      typeof objectData.detail ===
      "string"
    ) {
      return objectData.detail;
    }

    const messages =
      Object.entries(
        objectData,
      ).flatMap(
        ([field, value]) => {
          if (Array.isArray(value)) {
            return value.map(
              (message) =>
                `${field}: ${String(
                  message,
                )}`,
            );
          }

          if (
            typeof value ===
            "string"
          ) {
            return [
              `${field}: ${value}`,
            ];
          }

          return [];
        },
      );

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return (
    `Error del servidor (${response.status}).`
  );
}


async function fetchAllPages<T>(
  initialUrl: string,
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null =
    initialUrl;

  while (nextUrl) {
    const response:
      Response = await fetch(
        nextUrl,
        {
          headers:
            getAuthHeaders(),
        },
      );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
        ),
      );
    }

    const data:
      | T[]
      | PaginatedResponse<T> =
      await response.json();

    if (Array.isArray(data)) {
      results.push(...data);
      nextUrl = null;
    } else {
      results.push(
        ...(data.results ?? []),
      );

      nextUrl = data.next;
    }
  }

  return results;
}


export async function getPayments(): Promise<
  Payment[]
> {
  return fetchAllPages<Payment>(
    `${API_BASE_URL}/api/payments/`,
  );
}


export async function getPaymentPatients(): Promise<
  PaymentPatient[]
> {
  return fetchAllPages<PaymentPatient>(
    `${API_BASE_URL}/api/patients/?show_inactive=true`,
  );
}


export async function getPaymentAppointments(): Promise<
  PaymentAppointment[]
> {
  return fetchAllPages<PaymentAppointment>(
    `${API_BASE_URL}/api/appointments/`,
  );
}


export async function getPaymentBudgets(): Promise<
  PaymentBudget[]
> {
  return fetchAllPages<PaymentBudget>(
    `${API_BASE_URL}/api/budgets/`,
  );
}


export async function getPaymentTreatments(): Promise<
  PaymentTreatment[]
> {
  return fetchAllPages<PaymentTreatment>(
    `${API_BASE_URL}/api/suggested-treatments/`,
  );
}


export async function getPaymentProcedures(): Promise<
  PaymentProcedure[]
> {
  return fetchAllPages<PaymentProcedure>(
    `${API_BASE_URL}/api/procedures/?show_inactive=true`,
  );
}


export async function createPayment(
  payload: PaymentPayload,
): Promise<Payment> {
  const response = await fetch(
    `${API_BASE_URL}/api/payments/`,
    {
      method: "POST",

      headers:
        getAuthHeaders(),

      body: JSON.stringify(
        payload,
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return response.json();
}
