import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/authContext";

import type {
  Appointment,
  AppointmentStatus,
} from "../types/appointment";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


function getStatusText(
  status: AppointmentStatus,
): string {
  const statusTexts:
    Record<
      AppointmentStatus,
      string
    > = {
      Pending: "Pendiente",
      Attended: "Atendida",
      Cancelled: "Cancelada",
      "No Show": "No asistió",
    };

  return statusTexts[status];
}


function getStatusClass(
  status: AppointmentStatus,
): string {
  const statusClasses:
    Record<
      AppointmentStatus,
      string
    > = {
      Pending: "text-bg-warning",
      Attended: "text-bg-success",
      Cancelled: "text-bg-danger",
      "No Show": "text-bg-dark",
    };

  return statusClasses[status];
}


async function getResponseError(
  response: Response,
): Promise<string> {
  const data = await response
    .json()
    .catch(() => null);

  if (
    data &&
    typeof data === "object"
  ) {
    if (
      "detail" in data &&
      typeof data.detail === "string"
    ) {
      return data.detail;
    }

    if (
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }
  }

  return "No se pudo completar la operación.";
}


export default function MyAppointmentsPage() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  const [
    appointments,
    setAppointments,
  ] = useState<Appointment[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    actionAppointmentId,
    setActionAppointmentId,
  ] = useState<number | null>(
    null,
  );


  useEffect(() => {
    async function loadAppointments() {
      const token =
        localStorage.getItem(
          "access_token",
        );

      if (!token) {
        setError(
          "No existe una sesión iniciada.",
        );

        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/appointments/`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            await getResponseError(
              response,
            ),
          );
        }

        const data:
          | Appointment[]
          | {
              results:
                Appointment[];
            } =
            await response.json();

        const appointmentList =
          Array.isArray(data)
            ? data
            : data.results ?? [];

        const orderedAppointments =
          [...appointmentList].sort(
            (
              firstAppointment,
              secondAppointment,
            ) => {
              const dateComparison =
                firstAppointment
                  .appointment_date
                  .localeCompare(
                    secondAppointment
                      .appointment_date,
                  );

              if (
                dateComparison !== 0
              ) {
                return dateComparison;
              }

              return firstAppointment
                .appointment_time
                .localeCompare(
                  secondAppointment
                    .appointment_time,
                );
            },
          );

        setAppointments(
          orderedAppointments,
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron obtener las citas.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAppointments();
  }, []);


  function openMedicalRecord(
    appointment: Appointment,
  ) {
    navigate(
      `/medical-records?patient=${appointment.patient}` +
        `&appointment=${appointment.id}`,
    );
  }


  async function attendAppointment(
    appointment: Appointment,
  ): Promise<Appointment> {
    const token =
      localStorage.getItem(
        "access_token",
      );

    if (!token) {
      throw new Error(
        "No existe una sesión iniciada.",
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/appointments/` +
        `${appointment.id}/attend/`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getResponseError(
          response,
        ),
      );
    }

    return response.json();
  }


  function updateAppointmentInList(
    updatedAppointment:
      Appointment,
  ) {
    setAppointments(
      (currentAppointments) =>
        currentAppointments.map(
          (appointment) =>
            appointment.id ===
            updatedAppointment.id
              ? {
                  ...appointment,
                  ...updatedAppointment,
                }
              : appointment,
        ),
    );
  }


  async function handleAttend(
    appointment: Appointment,
  ) {
    setError("");

    setActionAppointmentId(
      appointment.id,
    );

    try {
      const updatedAppointment =
        await attendAppointment(
          appointment,
        );

      updateAppointmentInList(
        updatedAppointment,
      );

      openMedicalRecord(
        updatedAppointment,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo atender la cita.",
      );
    } finally {
      setActionAppointmentId(
        null,
      );
    }
  }


  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border"
          role="status"
        />

        <p className="mt-3">
          Cargando sus citas...
        </p>
      </div>
    );
  }


  return (
    <div className="container">
      <div className="mb-4">
        <h1 className="h3 mb-1">
          Mis citas
        </h1>

        <p className="text-muted mb-0">
          Especialista:{" "}
          {user?.specialist_name ??
            user?.full_name}
        </p>
      </div>

      {error && (
        <div
          className="alert alert-danger alert-dismissible"
          role="alert"
        >
          {error}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setError("")
            }
          />
        </div>
      )}

      {!error &&
        appointments.length === 0 && (
          <div className="alert alert-info">
            No tiene citas asignadas.
          </div>
        )}

      {appointments.length > 0 && (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Motivo</th>
                  <th>Estado</th>

                  <th className="text-end">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {appointments.map(
                  (appointment) => {
                    const status =
                      appointment
                        .appointment_status;

                    const isChanging =
                      actionAppointmentId ===
                      appointment.id;

                    return (
                      <tr
                        key={
                          appointment.id
                        }
                      >
                        <td>
                          {
                            appointment
                              .appointment_date
                          }
                        </td>

                        <td>
                          {appointment
                            .appointment_time
                            .slice(0, 5)}
                        </td>

                        <td>
                          {
                            appointment
                              .patient_name
                          }
                        </td>

                        <td>
                          {appointment.reason ||
                            "Sin motivo"}
                        </td>

                        <td>
                          <span
                            className={
                              `badge ${getStatusClass(
                                status,
                              )}`
                            }
                          >
                            {getStatusText(
                              status,
                            )}
                          </span>
                        </td>

                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2 flex-wrap">
                            {status ===
                              "Pending" && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  handleAttend(
                                    appointment,
                                  )
                                }
                                disabled={
                                  isChanging
                                }
                              >
                                {isChanging
                                  ? "Atendiendo..."
                                  : "Atender"}
                              </button>
                            )}

                            {status ===
                              "Attended" && (
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm"
                                onClick={() =>
                                  openMedicalRecord(
                                    appointment,
                                  )
                                }
                              >
                                Ver atención
                              </button>
                            )}

                            {(status ===
                              "Cancelled" ||
                              status ===
                                "No Show") && (
                              <span className="text-muted">
                                Sin acciones
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}