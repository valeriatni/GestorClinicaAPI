import type {
  Appointment,
  AppointmentPayload,
  AppointmentSpecialist,
  AppointmentsResponse,
  SpecialistsResponse,
} from "../types/appointment";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


export interface AvailableTimesResponse {
  specialist: number;
  specialist_name: string;
  date: string;
  duration_minutes: number;
  available_times: string[];
  occupied_times: string[];
}


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
      .map(String)
      .join(" ");
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    return Object.values(value)
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
      "No tienes permiso para realizar esta operación."
    );
  }

  if (data.patient) {
    return convertErrorToText(
      data.patient,
    );
  }

  if (data.specialist) {
    return convertErrorToText(
      data.specialist,
    );
  }

  if (data.date) {
    return convertErrorToText(
      data.date,
    );
  }

  if (data.appointment_date) {
    return convertErrorToText(
      data.appointment_date,
    );
  }

  if (data.appointment_time) {
    return convertErrorToText(
      data.appointment_time,
    );
  }

  if (data.reason) {
    return convertErrorToText(
      data.reason,
    );
  }

  if (data.appointment_status) {
    return convertErrorToText(
      data.appointment_status,
    );
  }

  if (data.non_field_errors) {
    const message =
      convertErrorToText(
        data.non_field_errors,
      );

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes(
        "specialist",
      ) ||
      lowerMessage.includes(
        "especialista",
      )
    ) {
      return (
        "El especialista ya tiene una cita " +
        "en esa fecha y hora."
      );
    }

    if (
      lowerMessage.includes(
        "patient",
      ) ||
      lowerMessage.includes(
        "paciente",
      )
    ) {
      return (
        "El paciente ya tiene una cita " +
        "en esa fecha y hora."
      );
    }

    return message;
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


export async function getAppointments():
Promise<Appointment[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/appointments/`,
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
    | Appointment[]
    | AppointmentsResponse =
      await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}


export async function
getAppointmentSpecialists():
Promise<AppointmentSpecialist[]> {
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
    | AppointmentSpecialist[]
    | SpecialistsResponse =
      await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}


export async function
getAvailableAppointmentTimes(
  specialistId: number,
  appointmentDate: string,
  excludeAppointmentId?: number,
): Promise<AvailableTimesResponse> {
  const params =
    new URLSearchParams({
      specialist: String(
        specialistId,
      ),
      date: appointmentDate,
    });

  if (excludeAppointmentId) {
    params.set(
      "exclude_appointment",
      String(excludeAppointmentId),
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/appointments/` +
      `available-times/?${params.toString()}`,
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

  return response.json();
}


export async function createAppointment(
  appointment: AppointmentPayload,
): Promise<Appointment> {
  const response = await fetch(
    `${API_BASE_URL}/api/appointments/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(
        appointment,
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


export async function updateAppointment(
  id: number,
  appointment:
    Partial<AppointmentPayload>,
): Promise<Appointment> {
  const response = await fetch(
    `${API_BASE_URL}/api/appointments/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(
        appointment,
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


async function patchAppointmentAction(
  id: number,
  action: string,
  body?: Record<string, unknown>,
): Promise<Appointment> {
  const response = await fetch(
    `${API_BASE_URL}/api/appointments/` +
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


export async function confirmAppointment(
  id: number,
): Promise<Appointment> {
  return patchAppointmentAction(
    id,
    "confirm",
  );
}


export async function markAppointmentArrived(
  id: number,
): Promise<Appointment> {
  return patchAppointmentAction(
    id,
    "arrive",
  );
}


export async function cancelAppointment(
  id: number,
  reason: string,
): Promise<Appointment> {
  return patchAppointmentAction(
    id,
    "cancel",
    {
      reason,
    },
  );
}


export async function markAppointmentNoShow(
  id: number,
): Promise<Appointment> {
  return patchAppointmentAction(
    id,
    "no-show",
  );
}


export async function startConsultation(
  id: number,
): Promise<Appointment> {
  return patchAppointmentAction(
    id,
    "start-consultation",
  );
}


export async function finishConsultation(
  id: number,
): Promise<Appointment> {
  return patchAppointmentAction(
    id,
    "finish-consultation",
  );
}