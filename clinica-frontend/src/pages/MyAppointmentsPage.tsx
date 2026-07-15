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


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


interface PersonData {
  id: number;
  first_name?: string;
  last_name?: string;
}


interface Appointment {
  id: number;

  patient:
    | number
    | PersonData;

  patient_name?: string;
  patient_full_name?: string;

  appointment_date: string;
  appointment_time: string;
  reason: string;
  appointment_status: string;
}


function getPatientId(
  appointment: Appointment,
): number {
  if (
    typeof appointment.patient ===
    "number"
  ) {
    return appointment.patient;
  }

  return appointment.patient.id;
}


function getPatientName(
  appointment: Appointment,
): string {
  if (appointment.patient_name) {
    return appointment.patient_name;
  }

  if (
    appointment.patient_full_name
  ) {
    return (
      appointment.patient_full_name
    );
  }

  if (
    typeof appointment.patient ===
    "object"
  ) {
    const fullName = `
      ${appointment.patient.first_name ?? ""}
      ${appointment.patient.last_name ?? ""}
    `.trim();

    if (fullName) {
      return fullName;
    }
  }

  return (
    appointment.patient_name ||
    `Paciente #${getPatientId(
      appointment,
    )}`
  );
}


function getStatusText(
  status: string,
): string {
  const statusTexts:
    Record<string, string> = {
      Pending: "Pendiente",
      Confirmed: "Confirmada",
      Waiting: "En espera",
      "In Consultation": "En consulta",
      Attended: "Atendida",
      Cancelled: "Cancelada",
      "No Show": "No asistió",
    };

  return statusTexts[status] ?? status;
}


function getStatusClass(
  status: string,
): string {
  const statusClasses:
    Record<string, string> = {
      Pending: "text-bg-warning",
      Confirmed: "text-bg-primary",
      Waiting: "text-bg-info",
      "In Consultation":
        "text-bg-secondary",
      Attended: "text-bg-success",
      Cancelled: "text-bg-danger",
      "No Show": "text-bg-dark",
    };

  return (
    statusClasses[status] ??
    "text-bg-secondary"
  );
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
    successMessage,
    setSuccessMessage,
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
            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const data = await response
            .json()
            .catch(() => null);

          throw new Error(
            data?.detail ??
              "No se pudieron obtener las citas.",
          );
        }

        const data =
          await response.json();

        const appointmentList =
          Array.isArray(data)
            ? data
            : data.results ?? [];

        setAppointments(
          appointmentList,
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
    const patientId =
      getPatientId(appointment);

    navigate(
      `/medical-records?patient=${patientId}` +
        `&appointment=${appointment.id}`,
    );
  }


  async function executeAppointmentAction(
    appointment: Appointment,
    action: string,
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
        `${appointment.id}/${action}/`,
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
      const data = await response
        .json()
        .catch(() => null);

      throw new Error(
        data?.detail ??
          data?.error ??
          "No se pudo completar la operación.",
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


  async function startConsultation(
    appointment: Appointment,
  ) {
    setError("");
    setSuccessMessage("");

    setActionAppointmentId(
      appointment.id,
    );

    try {
      const updatedAppointment =
        await executeAppointmentAction(
          appointment,
          "start-consultation",
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
          : "No se pudo iniciar la consulta.",
      );
    } finally {
      setActionAppointmentId(
        null,
      );
    }
  }


  async function finishConsultation(
    appointment: Appointment,
  ) {
    setError("");
    setSuccessMessage("");

    const confirmed =
      window.confirm(
        "¿Confirma que terminó la atención del paciente?",
      );

    if (!confirmed) {
      return;
    }

    setActionAppointmentId(
      appointment.id,
    );

    try {
      const updatedAppointment =
        await executeAppointmentAction(
          appointment,
          "finish-consultation",
        );

      updateAppointmentInList(
        updatedAppointment,
      );

      setSuccessMessage(
        "La cita fue marcada como atendida.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo finalizar la atención.",
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

      {successMessage && (
        <div
          className="alert alert-success alert-dismissible"
          role="alert"
        >
          {successMessage}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setSuccessMessage("")
            }
          />
        </div>
      )}

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

                    const canStart =
                      status === "Pending" ||
                      status === "Confirmed" ||
                      status === "Waiting";

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
                          {getPatientName(
                            appointment,
                          )}
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
                            {canStart && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  startConsultation(
                                    appointment,
                                  )
                                }
                                disabled={
                                  isChanging
                                }
                              >
                                {isChanging
                                  ? "Iniciando..."
                                  : "Atender"}
                              </button>
                            )}

                            {status ===
                              "In Consultation" && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() =>
                                    openMedicalRecord(
                                      appointment,
                                    )
                                  }
                                  disabled={
                                    isChanging
                                  }
                                >
                                  Continuar atención
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() =>
                                    finishConsultation(
                                      appointment,
                                    )
                                  }
                                  disabled={
                                    isChanging
                                  }
                                >
                                  {isChanging
                                    ? "Finalizando..."
                                    : "Finalizar atención"}
                                </button>
                              </>
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