import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  getAvailableAppointmentTimes,
} from "../../api/appointmentApi";

import type {
  Appointment,
  AppointmentPayload,
  AppointmentSpecialist,
} from "../../types/appointment";

import type {
  Patient,
} from "../../types/patient";


interface AppointmentModalProps {
  appointment: Appointment | null;
  initialPatientId: number | null;
  patients: Patient[];
  specialists: AppointmentSpecialist[];
  appointments: Appointment[];
  isSaving: boolean;
  onClose: () => void;

  onSave: (
    appointment: AppointmentPayload,
  ) => Promise<void>;
}


interface AppointmentForm {
  patient: string;
  specialist: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
}


interface FormErrors {
  patient?: string;
  specialist?: string;
  appointment_date?: string;
  appointment_time?: string;
  reason?: string;
  general?: string;
}


function getToday(): string {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatTime(
  value: string,
): string {
  const [hourText, minute] =
    value.split(":");

  const hour = Number(
    hourText,
  );

  const suffix =
    hour >= 12
      ? "p. m."
      : "a. m.";

  const displayHour =
    hour % 12 || 12;

  return (
    `${displayHour}:` +
    `${minute} ${suffix}`
  );
}


const emptyForm:
AppointmentForm = {
  patient: "",
  specialist: "",
  appointment_date:
    getToday(),
  appointment_time: "",
  reason: "",
};


export default function AppointmentModal({
  appointment,
  initialPatientId,
  patients,
  specialists,
  appointments,
  isSaving,
  onClose,
  onSave,
}: AppointmentModalProps) {
  const [form, setForm] =
    useState<AppointmentForm>(
      emptyForm,
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [
    availableTimes,
    setAvailableTimes,
  ] = useState<string[]>([]);

  const [
    isLoadingTimes,
    setIsLoadingTimes,
  ] = useState(false);

  const [
    scheduleMessage,
    setScheduleMessage,
  ] = useState("");


  useEffect(() => {
    if (appointment) {
      setForm({
        patient: String(
          appointment.patient,
        ),

        specialist: String(
          appointment.specialist,
        ),

        appointment_date:
          appointment
            .appointment_date,

        appointment_time:
          appointment
            .appointment_time
            .slice(0, 5),

        reason:
          appointment.reason,
      });
    } else {
      setForm({
        ...emptyForm,

        patient:
          initialPatientId
            ? String(
                initialPatientId,
              )
            : "",
      });
    }

    setErrors({});
    setAvailableTimes([]);
    setScheduleMessage("");
  }, [
    appointment,
    initialPatientId,
  ]);


  useEffect(() => {
    if (
      !form.specialist ||
      !form.appointment_date
    ) {
      setAvailableTimes([]);
      setScheduleMessage(
        "Seleccione especialista y fecha para consultar los horarios.",
      );

      return;
    }

    let isCancelled = false;

    async function loadTimes() {
      setIsLoadingTimes(true);
      setScheduleMessage("");

      try {
        const response =
          await getAvailableAppointmentTimes(
            Number(
              form.specialist,
            ),
            form.appointment_date,
            appointment?.id,
          );

        if (isCancelled) {
          return;
        }

        setAvailableTimes(
          response.available_times,
        );

        if (
          response.available_times
            .length === 0
        ) {
          setScheduleMessage(
            "No existen horarios disponibles para esta fecha.",
          );
        }

        setForm(
          (currentForm) => {
            if (
              currentForm
                .appointment_time &&
              !response
                .available_times
                .includes(
                  currentForm
                    .appointment_time,
                )
            ) {
              return {
                ...currentForm,
                appointment_time: "",
              };
            }

            return currentForm;
          },
        );
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setAvailableTimes([]);

        setScheduleMessage(
          error instanceof Error
            ? error.message
            : "No se pudieron consultar los horarios.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingTimes(false);
        }
      }
    }

    loadTimes();

    return () => {
      isCancelled = true;
    };
  }, [
    form.specialist,
    form.appointment_date,
    appointment?.id,
  ]);


  function changeField(
    field: keyof AppointmentForm,
    value: string,
  ) {
    setForm(
      (currentForm) => ({
        ...currentForm,
        [field]: value,

        ...(
          field === "specialist" ||
          field === "appointment_date"
            ? {
                appointment_time: "",
              }
            : {}
        ),
      }),
    );

    setErrors(
      (currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
        appointment_time:
          field === "specialist" ||
          field === "appointment_date"
            ? undefined
            : currentErrors
                .appointment_time,
        general: undefined,
      }),
    );
  }


  function validateForm():
  boolean {
    const newErrors:
      FormErrors = {};

    const patientId = Number(
      form.patient,
    );

    const specialistId = Number(
      form.specialist,
    );

    if (!form.patient) {
      newErrors.patient =
        "Debe seleccionar un paciente.";
    } else {
      const selectedPatient =
        patients.find(
          (patient) =>
            patient.id === patientId,
        );

      if (!selectedPatient) {
        newErrors.patient =
          "El paciente seleccionado no existe.";
      } else if (
        !selectedPatient.is_active
      ) {
        newErrors.patient =
          "El paciente está inactivo y no puede recibir nuevas citas.";
      }
    }

    if (!form.specialist) {
      newErrors.specialist =
        "Debe seleccionar un especialista.";
    } else {
      const selectedSpecialist =
        specialists.find(
          (specialist) =>
            specialist.id ===
            specialistId,
        );

      if (!selectedSpecialist) {
        newErrors.specialist =
          "El especialista seleccionado no existe.";
      } else if (
        !selectedSpecialist.is_active
      ) {
        newErrors.specialist =
          "El especialista está inactivo y no puede recibir nuevas citas.";
      }
    }

    if (!form.appointment_date) {
      newErrors.appointment_date =
        "Debe seleccionar la fecha de la cita.";
    } else if (
      form.appointment_date <
      getToday()
    ) {
      newErrors.appointment_date =
        "La fecha de la cita no puede estar en el pasado.";
    }

    if (!form.appointment_time) {
      newErrors.appointment_time =
        "Debe seleccionar un horario disponible.";
    } else if (
      !availableTimes.includes(
        form.appointment_time,
      )
    ) {
      newErrors.appointment_time =
        "El horario seleccionado ya no está disponible.";
    }

    if (
      form.appointment_date &&
      form.appointment_time
    ) {
      const selectedDateTime =
        new Date(
          `${form.appointment_date}` +
          `T${form.appointment_time}:00`,
        );

      if (
        selectedDateTime.getTime() <=
        new Date().getTime()
      ) {
        newErrors.appointment_time =
          "La fecha y hora deben ser posteriores al momento actual.";
      }
    }

    const cleanReason =
      form.reason.trim();

    if (!cleanReason) {
      newErrors.reason =
        "Debe ingresar el motivo de la cita.";
    } else if (
      cleanReason.length < 5
    ) {
      newErrors.reason =
        "El motivo debe tener al menos 5 caracteres.";
    } else if (
      cleanReason.length > 250
    ) {
      newErrors.reason =
        "El motivo no puede superar los 250 caracteres.";
    }

    if (
      form.patient &&
      form.specialist &&
      form.appointment_date &&
      form.appointment_time
    ) {
      const validAppointments =
        appointments.filter(
          (currentAppointment) =>
            currentAppointment.id !==
              appointment?.id &&
            currentAppointment
              .appointment_status !==
              "Cancelled" &&
            currentAppointment
              .appointment_status !==
              "No Show",
        );

      const specialistConflict =
        validAppointments.some(
          (currentAppointment) =>
            currentAppointment
              .specialist ===
              specialistId &&
            currentAppointment
              .appointment_date ===
              form.appointment_date &&
            currentAppointment
              .appointment_time
              .slice(0, 5) ===
              form.appointment_time,
        );

      if (specialistConflict) {
        newErrors
          .appointment_time =
          "El especialista ya tiene una cita en ese horario.";
      }

      const patientConflict =
        validAppointments.some(
          (currentAppointment) =>
            currentAppointment
              .patient ===
              patientId &&
            currentAppointment
              .appointment_date ===
              form.appointment_date &&
            currentAppointment
              .appointment_time
              .slice(0, 5) ===
              form.appointment_time,
        );

      if (patientConflict) {
        newErrors.patient =
          "El paciente ya tiene una cita en ese horario.";
      }
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  }


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrors({});

    if (!validateForm()) {
      return;
    }

    const appointmentData:
      AppointmentPayload = {
        patient: Number(
          form.patient,
        ),

        specialist: Number(
          form.specialist,
        ),

        appointment_date:
          form.appointment_date,

        appointment_time:
          form.appointment_time,

        reason:
          form.reason.trim(),

        appointment_status:
          appointment
            ?.appointment_status ??
          "Pending",
      };

    try {
      await onSave(
        appointmentData,
      );
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la cita.",
      });
    }
  }


  function inputClass(
    field:
      keyof FormErrors,
  ): string {
    return (
      `form-control ${
        errors[field]
          ? "is-invalid"
          : ""
      }`
    );
  }


  function selectClass(
    field:
      keyof FormErrors,
  ): string {
    return (
      `form-select ${
        errors[field]
          ? "is-invalid"
          : ""
      }`
    );
  }


  return (
    <>
      <div
        className="
          modal
          fade
          show
          d-block
        "
        tabIndex={-1}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  {appointment
                    ? "Editar cita"
                    : "Registrar cita"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  disabled={isSaving}
                />
              </div>

              <div className="modal-body">
                {errors.general && (
                  <div className="alert alert-danger">
                    {errors.general}
                  </div>
                )}

                <div className="alert alert-info py-2">
                  Las citas tienen una duración
                  estándar de 30 minutos.
                </div>

                <p className="text-muted">
                  Los campos con * son obligatorios.
                </p>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Paciente *
                    </label>

                    <select
                      className={selectClass(
                        "patient",
                      )}
                      value={form.patient}
                      onChange={(event) =>
                        changeField(
                          "patient",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    >
                      <option value="">
                        Seleccione un paciente
                      </option>

                      {patients.map(
                        (patient) => (
                          <option
                            key={patient.id}
                            value={patient.id}
                            disabled={
                              !patient.is_active
                            }
                          >
                            {patient.first_name}{" "}
                            {patient.last_name}
                            {" - DNI "}
                            {patient.dni}

                            {!patient.is_active
                              ? " - Inactivo"
                              : ""}
                          </option>
                        ),
                      )}
                    </select>

                    {errors.patient && (
                      <div className="invalid-feedback">
                        {errors.patient}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Especialista *
                    </label>

                    <select
                      className={selectClass(
                        "specialist",
                      )}
                      value={form.specialist}
                      onChange={(event) =>
                        changeField(
                          "specialist",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    >
                      <option value="">
                        Seleccione un especialista
                      </option>

                      {specialists.map(
                        (specialist) => (
                          <option
                            key={specialist.id}
                            value={specialist.id}
                            disabled={
                              !specialist.is_active
                            }
                          >
                            Dr(a).{" "}
                            {specialist.first_name}{" "}
                            {specialist.last_name}

                            {!specialist.is_active
                              ? " - Inactivo"
                              : ""}
                          </option>
                        ),
                      )}
                    </select>

                    {errors.specialist && (
                      <div className="invalid-feedback">
                        {errors.specialist}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Fecha *
                    </label>

                    <input
                      type="date"
                      className={inputClass(
                        "appointment_date",
                      )}
                      value={
                        form.appointment_date
                      }
                      min={getToday()}
                      onChange={(event) =>
                        changeField(
                          "appointment_date",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    />

                    {errors.appointment_date && (
                      <div className="invalid-feedback">
                        {
                          errors
                            .appointment_date
                        }
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Horario disponible *
                    </label>

                    <select
                      className={selectClass(
                        "appointment_time",
                      )}
                      value={
                        form.appointment_time
                      }
                      onChange={(event) =>
                        changeField(
                          "appointment_time",
                          event.target.value,
                        )
                      }
                      disabled={
                        isSaving ||
                        isLoadingTimes ||
                        !form.specialist ||
                        !form.appointment_date
                      }
                    >
                      <option value="">
                        {isLoadingTimes
                          ? "Consultando horarios..."
                          : "Seleccione un horario"}
                      </option>

                      {availableTimes.map(
                        (appointmentTime) => (
                          <option
                            key={
                              appointmentTime
                            }
                            value={
                              appointmentTime
                            }
                          >
                            {formatTime(
                              appointmentTime,
                            )}
                          </option>
                        ),
                      )}
                    </select>

                    {errors.appointment_time && (
                      <div className="invalid-feedback">
                        {
                          errors
                            .appointment_time
                        }
                      </div>
                    )}

                    {!errors.appointment_time &&
                      scheduleMessage && (
                        <small
                          className={
                            availableTimes.length ===
                            0
                              ? "text-danger"
                              : "text-muted"
                          }
                        >
                          {scheduleMessage}
                        </small>
                      )}
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">
                      Motivo de la cita *
                    </label>

                    <textarea
                      className={inputClass(
                        "reason",
                      )}
                      value={form.reason}
                      onChange={(event) =>
                        changeField(
                          "reason",
                          event.target.value,
                        )
                      }
                      rows={3}
                      maxLength={250}
                      placeholder="Ejemplo: Dolor de muela desde hace dos días"
                      disabled={isSaving}
                    />

                    {errors.reason ? (
                      <div className="invalid-feedback">
                        {errors.reason}
                      </div>
                    ) : (
                      <small className="text-muted">
                        {form.reason.length}/250
                      </small>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    isSaving ||
                    isLoadingTimes ||
                    availableTimes.length ===
                      0
                  }
                >
                  {isSaving
                    ? "Guardando..."
                    : appointment
                      ? "Guardar cambios"
                      : "Registrar cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}