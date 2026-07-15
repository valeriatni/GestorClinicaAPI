import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import AppointmentModal from "../components/appointments/AppointmentModal";

import {
  attendAppointment,
  cancelAppointment,
  markAppointmentNoShow,
} from "../api/appointmentApi";

import {
  useAuth,
} from "../context/authContext";

import {
  useAppointments,
} from "../hooks/useAppointments";

import type {
  Appointment,
  AppointmentPayload,
  AppointmentStatus,
} from "../types/appointment";


function getToday(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function getAppointmentDateTime(
  appointment: Appointment,
): Date {
  return new Date(
    `${appointment.appointment_date}` +
      `T${appointment.appointment_time.slice(
        0,
        5,
      )}:00`,
  );
}


function hasAppointmentTimePassed(
  appointment: Appointment,
): boolean {
  return (
    getAppointmentDateTime(
      appointment,
    ).getTime() <= new Date().getTime()
  );
}


function getStatusText(
  status: AppointmentStatus,
): string {
  const statusTexts: Record<
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
  const statusClasses: Record<
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


export default function AppointmentsPage() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  const isReceptionist =
    user?.role === "Recepcionista";

  const isSpecialist =
    user?.role === "Especialista";

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const patientFromUrl =
    searchParams.get("patient");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(getToday());

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    selectedAppointment,
    setSelectedAppointment,
  ] = useState<Appointment | null>(null);

  const [
    initialPatientId,
    setInitialPatientId,
  ] = useState<number | null>(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    actionAppointmentId,
    setActionAppointmentId,
  ] = useState<number | null>(null);

  const {
    appointments,
    patients,
    specialists,
    isLoading,
    isError,
    queryError,
    refetchAppointments,
    createMutation,
    updateMutation,
  } = useAppointments();


  useEffect(() => {
    if (
      !isReceptionist ||
      !patientFromUrl ||
      patients.length === 0
    ) {
      return;
    }

    const patientId = Number(
      patientFromUrl,
    );

    if (
      Number.isNaN(patientId) ||
      patientId <= 0
    ) {
      setErrorMessage(
        "El paciente seleccionado no es válido.",
      );

      setSearchParams(
        {},
        {
          replace: true,
        },
      );

      return;
    }

    const patient = patients.find(
      (currentPatient) =>
        currentPatient.id === patientId,
    );

    if (!patient) {
      setErrorMessage(
        "No se encontró el paciente seleccionado.",
      );
    } else if (!patient.is_active) {
      setErrorMessage(
        "El paciente está inactivo y no puede recibir nuevas citas.",
      );
    } else {
      setInitialPatientId(
        patient.id,
      );

      setSelectedAppointment(
        null,
      );

      setShowModal(true);
    }

    setSearchParams(
      {},
      {
        replace: true,
      },
    );
  }, [
    isReceptionist,
    patientFromUrl,
    patients,
    setSearchParams,
  ]);


  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSearch(
      searchInput
        .trim()
        .toLowerCase(),
    );
  }


  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }


  function clearMessages() {
    setSuccessMessage("");
    setErrorMessage("");
  }


  function openCreateModal() {
    clearMessages();

    if (!isReceptionist) {
      setErrorMessage(
        "Solo recepción puede registrar citas.",
      );

      return;
    }

    setSelectedAppointment(null);
    setInitialPatientId(null);
    setShowModal(true);
  }


  function openEditModal(
    appointment: Appointment,
  ) {
    clearMessages();

    if (!isReceptionist) {
      setErrorMessage(
        "Solo recepción puede editar citas.",
      );

      return;
    }

    if (
      appointment.appointment_status !==
      "Pending"
    ) {
      setErrorMessage(
        "Solo una cita pendiente puede editarse.",
      );

      return;
    }

    if (
      hasAppointmentTimePassed(
        appointment,
      )
    ) {
      setErrorMessage(
        "Una cita cuya hora ya pasó no puede reprogramarse desde edición.",
      );

      return;
    }

    setSelectedAppointment(
      appointment,
    );

    setInitialPatientId(null);
    setShowModal(true);
  }


  async function saveAppointment(
    appointmentData: AppointmentPayload,
  ) {
    clearMessages();

    if (!isReceptionist) {
      throw new Error(
        "Solo recepción puede guardar citas.",
      );
    }

    if (selectedAppointment) {
      await updateMutation.mutateAsync({
        id: selectedAppointment.id,
        appointment: appointmentData,
      });

      setSuccessMessage(
        "La cita se actualizó correctamente.",
      );
    } else {
      await createMutation.mutateAsync(
        appointmentData,
      );

      setSuccessMessage(
        "La cita se registró como pendiente.",
      );
    }

    setSelectedDate(
      appointmentData.appointment_date,
    );

    setShowModal(false);
    setSelectedAppointment(null);
    setInitialPatientId(null);
  }


  async function executeAction(
    appointmentId: number,
    action: () => Promise<Appointment>,
    successText: string,
  ) {
    clearMessages();

    setActionAppointmentId(
      appointmentId,
    );

    try {
      await action();
      await refetchAppointments();

      setSuccessMessage(
        successText,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo completar la operación.",
      );
    } finally {
      setActionAppointmentId(null);
    }
  }


  async function handleNoShow(
    appointment: Appointment,
  ) {
    if (
      !hasAppointmentTimePassed(
        appointment,
      )
    ) {
      setErrorMessage(
        "Todavía no puede marcarse como no asistida porque la hora no ha llegado.",
      );

      return;
    }

    const confirmed = window.confirm(
      "¿Confirma que el paciente no asistió a la cita?",
    );

    if (!confirmed) {
      return;
    }

    await executeAction(
      appointment.id,
      () =>
        markAppointmentNoShow(
          appointment.id,
        ),
      "La cita fue marcada como no asistida.",
    );
  }


  async function handleCancel(
    appointment: Appointment,
  ) {
    const reason = window.prompt(
      "Ingrese el motivo de cancelación:",
    );

    if (reason === null) {
      return;
    }

    const cleanReason = reason.trim();

    if (cleanReason.length < 5) {
      setErrorMessage(
        "El motivo de cancelación debe tener al menos 5 caracteres.",
      );

      return;
    }

    await executeAction(
      appointment.id,
      () =>
        cancelAppointment(
          appointment.id,
          cleanReason,
        ),
      "La cita fue cancelada correctamente.",
    );
  }


  async function handleAttend(
    appointment: Appointment,
  ) {
    clearMessages();

    setActionAppointmentId(
      appointment.id,
    );

    try {
      // Marca la cita como atendida sin validar
      // la fecha ni la hora programada.
      await attendAppointment(
        appointment.id,
      );

      await refetchAppointments();

      navigate(
        `/medical-records?patient=${appointment.patient}` +
          `&appointment=${appointment.id}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo marcar la cita como atendida.",
      );
    } finally {
      setActionAppointmentId(
        null,
      );
    }
  }


  function openMedicalRecord(
    appointment: Appointment,
  ) {
    clearMessages();

    if (
      appointment.appointment_status ===
        "Cancelled" ||
      appointment.appointment_status ===
        "No Show"
    ) {
      setErrorMessage(
        "No se puede abrir la atención de una cita cancelada o no asistida.",
      );

      return;
    }

    navigate(
      `/medical-records?patient=${appointment.patient}` +
        `&appointment=${appointment.id}`,
    );
  }


  function goToPayment(
    appointment: Appointment,
  ) {
    clearMessages();

    if (
      appointment.appointment_status ===
      "Cancelled"
    ) {
      setErrorMessage(
        "No se puede registrar un pago para una cita cancelada.",
      );

      return;
    }

    if (
      appointment.appointment_status ===
      "No Show"
    ) {
      setErrorMessage(
        "No se puede registrar un pago para una cita a la que el paciente no asistió.",
      );

      return;
    }

    navigate(
      `/payments?patient=${appointment.patient}` +
        `&appointment=${appointment.id}`,
    );
  }


  function findPatient(
    patientId: number,
  ) {
    return patients.find(
      (patient) =>
        patient.id === patientId,
    );
  }


  function findSpecialist(
    specialistId: number,
  ) {
    return specialists.find(
      (specialist) =>
        specialist.id === specialistId,
    );
  }


  const filteredAppointments =
    appointments
      .filter((appointment) => {
        if (isSpecialist) {
          // El especialista ve las citas de hoy
          // y todas las citas futuras.
          return (
            appointment.appointment_date >=
            getToday()
          );
        }

        // Recepción y gerencia mantienen
        // el filtro de la fecha seleccionada.
        return (
          appointment.appointment_date ===
          selectedDate
        );
      })
      .filter((appointment) => {
        if (!search) {
          return true;
        }

        const patient = findPatient(
          appointment.patient,
        );

        const specialist = findSpecialist(
          appointment.specialist,
        );

        const searchableText = `
          ${patient?.first_name ?? ""}
          ${patient?.last_name ?? ""}
          ${patient?.dni ?? ""}
          ${specialist?.first_name ?? ""}
          ${specialist?.last_name ?? ""}
          ${appointment.reason}
          ${getStatusText(
            appointment.appointment_status,
          )}
        `.toLowerCase();

        return searchableText.includes(
          search,
        );
      })
      .sort(
        (
          firstAppointment,
          secondAppointment,
        ) => {
          const dateComparison =
            firstAppointment.appointment_date
              .localeCompare(
                secondAppointment
                  .appointment_date,
              );

          if (dateComparison !== 0) {
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


  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Citas</h2>

          <p className="text-muted mb-0">
            {isReceptionist
              ? "Registre y controle las citas de los pacientes."
              : "Consulte y atienda sus citas programadas."}
          </p>
        </div>

        {isReceptionist && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            Nueva cita
          </button>
        )}
      </div>

      {successMessage && (
        <div className="alert alert-success alert-dismissible">
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

      {errorMessage && (
        <div className="alert alert-danger alert-dismissible">
          {errorMessage}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setErrorMessage("")
            }
          />
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <form
            className="row g-3 align-items-end"
            onSubmit={handleSearch}
          >
            {!isSpecialist && (
              <div className="col-md-3">
                <label className="form-label">
                  Fecha
                </label>

                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(event) =>
                    setSelectedDate(
                      event.target.value,
                    )
                  }
                />
              </div>
            )}

            <div className="col-md-5">
              <label className="form-label">
                Buscar
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Paciente, DNI, especialista, motivo o estado"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="col-md-2">
              <button
                type="submit"
                className="btn btn-outline-primary w-100"
              >
                Buscar
              </button>
            </div>

            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={clearSearch}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            {isSpecialist
              ? "Citas de hoy y próximas citas"
              : `Citas del ${selectedDate}`}
          </h5>
        </div>

        <div className="card-body">
          {isLoading && (
            <div className="text-center py-4">
              <div className="spinner-border" />

              <p className="mt-2">
                Cargando citas...
              </p>
            </div>
          )}

          {isError && (
            <div className="alert alert-danger">
              <p>
                {queryError instanceof Error
                  ? queryError.message
                  : "No se pudieron cargar las citas."}
              </p>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() =>
                  refetchAppointments()
                }
              >
                Intentar nuevamente
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            filteredAppointments.length ===
              0 && (
              <div className="alert alert-info">
                {isSpecialist
                  ? "No tiene citas pendientes para hoy ni fechas futuras."
                  : "No existen citas para la fecha seleccionada."}
              </div>
            )}

          {!isLoading &&
            !isError &&
            filteredAppointments.length >
              0 && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      {isSpecialist && (
                        <th>Fecha</th>
                      )}
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>Especialista</th>
                      <th>Motivo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAppointments.map(
                      (appointment) => {
                        const patient =
                          findPatient(
                            appointment.patient,
                          );

                        const specialist =
                          findSpecialist(
                            appointment.specialist,
                          );

                        const actionIsPending =
                          actionAppointmentId ===
                          appointment.id;

                        return (
                          <tr key={appointment.id}>
                            {isSpecialist && (
                              <td>
                                <strong>
                                  {appointment.appointment_date}
                                </strong>
                              </td>
                            )}

                            <td>
                              <strong>
                                {appointment.appointment_time.slice(
                                  0,
                                  5,
                                )}
                              </strong>
                            </td>

                            <td>
                              {patient ? (
                                <>
                                  <strong>
                                    {patient.first_name}{" "}
                                    {patient.last_name}
                                  </strong>

                                  <div>
                                    <small className="text-muted">
                                      DNI: {patient.dni}
                                    </small>
                                  </div>

                                  {!patient.is_active && (
                                    <span className="badge text-bg-secondary mt-1">
                                      Paciente inactivo
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-danger">
                                  Paciente no encontrado
                                </span>
                              )}
                            </td>

                            <td>
                              {specialist ? (
                                <>
                                  <strong>
                                    Dr(a).{" "}
                                    {specialist.first_name}{" "}
                                    {specialist.last_name}
                                  </strong>

                                  {!specialist.is_active && (
                                    <div>
                                      <small className="text-danger">
                                        Especialista inactivo
                                      </small>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-danger">
                                  Especialista no encontrado
                                </span>
                              )}
                            </td>

                            <td>
                              {appointment.reason}
                            </td>

                            <td>
                              <span
                                className={`badge ${getStatusClass(
                                  appointment.appointment_status,
                                )}`}
                              >
                                {getStatusText(
                                  appointment.appointment_status,
                                )}
                              </span>
                            </td>

                            <td>
                              <div className="d-flex gap-2 flex-wrap">
                                {isSpecialist &&
                                  appointment.appointment_status ===
                                    "Pending" && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success"
                                      onClick={() =>
                                        handleAttend(
                                          appointment,
                                        )
                                      }
                                      disabled={
                                        actionIsPending
                                      }
                                    >
                                      {actionIsPending
                                        ? "Atendiendo..."
                                        : "Atender"}
                                    </button>
                                  )}

                                {isSpecialist &&
                                  appointment.appointment_status ===
                                    "Attended" && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() =>
                                        openMedicalRecord(
                                          appointment,
                                        )
                                      }
                                    >
                                      Historia clínica
                                    </button>
                                  )}

                                {isReceptionist &&
                                  (appointment.appointment_status ===
                                    "Pending" ||
                                    appointment.appointment_status ===
                                      "Attended") && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() =>
                                        goToPayment(
                                          appointment,
                                        )
                                      }
                                    >
                                      Registrar pago
                                    </button>
                                  )}

                                {isReceptionist &&
                                  appointment.appointment_status ===
                                    "Pending" && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() =>
                                        openEditModal(
                                          appointment,
                                        )
                                      }
                                    >
                                      Editar
                                    </button>
                                  )}

                                {isReceptionist &&
                                  appointment.appointment_status ===
                                    "Pending" && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-dark"
                                      onClick={() =>
                                        handleNoShow(
                                          appointment,
                                        )
                                      }
                                      disabled={actionIsPending}
                                    >
                                      No asistió
                                    </button>
                                  )}

                                {isReceptionist &&
                                  appointment.appointment_status ===
                                    "Pending" && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() =>
                                        handleCancel(
                                          appointment,
                                        )
                                      }
                                      disabled={actionIsPending}
                                    >
                                      Cancelar
                                    </button>
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
            )}
        </div>
      </div>

      {showModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          initialPatientId={initialPatientId}
          patients={patients}
          specialists={specialists}
          appointments={appointments}
          isSaving={
            createMutation.isPending ||
            updateMutation.isPending
          }
          onClose={() => {
            setShowModal(false);
            setSelectedAppointment(null);
            setInitialPatientId(null);
          }}
          onSave={saveAppointment}
        />
      )}
    </div>
  );
}