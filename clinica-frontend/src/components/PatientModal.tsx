import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  Patient,
  PatientFormData,
  PatientPayload,
} from "../types/patient";

interface PatientModalProps {
  patient: Patient | null;
  isSaving: boolean;

  onClose: () => void;

  onSave: (
    patient: PatientPayload,
  ) => Promise<void>;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  dni?: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  address?: string;
  general?: string;
}

const emptyForm: PatientFormData = {
  first_name: "",
  last_name: "",
  dni: "",
  phone: "",
  email: "",
  birth_date: "",
  address: "",
};

const namePattern =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function PatientModal({
  patient,
  isSaving,
  onClose,
  onSave,
}: PatientModalProps) {
  const [form, setForm] =
    useState<PatientFormData>(emptyForm);

  const [errors, setErrors] =
    useState<FormErrors>({});

  useEffect(() => {
    if (patient) {
      setForm({
        first_name: patient.first_name,
        last_name: patient.last_name,
        dni: patient.dni,
        phone: patient.phone ?? "",
        email: patient.email ?? "",
        birth_date:
          patient.birth_date ?? "",
        address: patient.address ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [patient]);

  function changeField(
    field: keyof PatientFormData,
    value: string,
  ) {
    setForm({
      ...form,
      [field]: value,
    });

    setErrors({
      ...errors,
      [field]: undefined,
      general: undefined,
    });
  }

  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    const firstName =
      form.first_name.trim();

    const lastName =
      form.last_name.trim();

    const address =
      form.address.trim();

    if (!firstName) {
      newErrors.first_name =
        "Los nombres son obligatorios.";
    } else if (firstName.length < 2) {
      newErrors.first_name =
        "Los nombres deben tener al menos 2 caracteres.";
    } else if (
      !namePattern.test(firstName)
    ) {
      newErrors.first_name =
        "Los nombres solo deben contener letras.";
    }

    if (!lastName) {
      newErrors.last_name =
        "Los apellidos son obligatorios.";
    } else if (lastName.length < 2) {
      newErrors.last_name =
        "Los apellidos deben tener al menos 2 caracteres.";
    } else if (
      !namePattern.test(lastName)
    ) {
      newErrors.last_name =
        "Los apellidos solo deben contener letras.";
    }

    if (!form.dni) {
      newErrors.dni =
        "El DNI es obligatorio.";
    } else if (
      !/^\d{8}$/.test(form.dni)
    ) {
      newErrors.dni =
        "El DNI debe contener exactamente 8 números.";
    }

    if (
      form.phone &&
      !/^9\d{8}$/.test(form.phone)
    ) {
      newErrors.phone =
        "El celular debe tener 9 números y comenzar con 9.";
    }

    if (
      form.email &&
      !emailPattern.test(form.email)
    ) {
      newErrors.email =
        "Ingrese un correo electrónico válido.";
    }

    if (
      form.birth_date &&
      form.birth_date > getToday()
    ) {
      newErrors.birth_date =
        "La fecha de nacimiento no puede estar en el futuro.";
    }

    if (
      address &&
      address.length < 5
    ) {
      newErrors.address =
        "La dirección debe tener al menos 5 caracteres.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrors({});

    if (!validateForm()) {
      return;
    }

    const patientData: PatientPayload = {
      first_name:
        form.first_name.trim(),
      last_name:
        form.last_name.trim(),
      dni: form.dni,
      phone:
        form.phone.trim() || null,
      email:
        form.email.trim().toLowerCase() ||
        null,
      birth_date:
        form.birth_date || null,
      address:
        form.address.trim() || null,
    };

    try {
      await onSave(patientData);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el paciente.",
      });
    }
  }

  function getInputClass(
    field: keyof FormErrors,
  ) {
    return `form-control ${
      errors[field] ? "is-invalid" : ""
    }`;
  }

  return (
    <>
      <div
        className="modal fade show d-block"
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
                  {patient
                    ? "Editar paciente"
                    : "Registrar paciente"}
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

                <p className="text-muted">
                  Los campos con * son
                  obligatorios.
                </p>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Nombres *
                    </label>

                    <input
                      type="text"
                      className={getInputClass(
                        "first_name",
                      )}
                      value={form.first_name}
                      onChange={(event) =>
                        changeField(
                          "first_name",
                          event.target.value,
                        )
                      }
                      maxLength={100}
                    />

                    {errors.first_name && (
                      <div className="invalid-feedback">
                        {errors.first_name}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Apellidos *
                    </label>

                    <input
                      type="text"
                      className={getInputClass(
                        "last_name",
                      )}
                      value={form.last_name}
                      onChange={(event) =>
                        changeField(
                          "last_name",
                          event.target.value,
                        )
                      }
                      maxLength={100}
                    />

                    {errors.last_name && (
                      <div className="invalid-feedback">
                        {errors.last_name}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      DNI *
                    </label>

                    <input
                      type="text"
                      className={getInputClass(
                        "dni",
                      )}
                      value={form.dni}
                      onChange={(event) =>
                        changeField(
                          "dni",
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 8),
                        )
                      }
                      maxLength={8}
                    />

                    {errors.dni ? (
                      <div className="invalid-feedback">
                        {errors.dni}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Debe tener 8 números.
                      </small>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Celular
                    </label>

                    <input
                      type="text"
                      className={getInputClass(
                        "phone",
                      )}
                      value={form.phone}
                      onChange={(event) =>
                        changeField(
                          "phone",
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 9),
                        )
                      }
                      maxLength={9}
                    />

                    {errors.phone ? (
                      <div className="invalid-feedback">
                        {errors.phone}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Debe comenzar con 9.
                      </small>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Fecha de nacimiento
                    </label>

                    <input
                      type="date"
                      className={getInputClass(
                        "birth_date",
                      )}
                      value={form.birth_date}
                      max={getToday()}
                      onChange={(event) =>
                        changeField(
                          "birth_date",
                          event.target.value,
                        )
                      }
                    />

                    {errors.birth_date && (
                      <div className="invalid-feedback">
                        {errors.birth_date}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Correo
                    </label>

                    <input
                      type="email"
                      className={getInputClass(
                        "email",
                      )}
                      value={form.email}
                      onChange={(event) =>
                        changeField(
                          "email",
                          event.target.value,
                        )
                      }
                      maxLength={150}
                    />

                    {errors.email && (
                      <div className="invalid-feedback">
                        {errors.email}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Dirección
                    </label>

                    <input
                      type="text"
                      className={getInputClass(
                        "address",
                      )}
                      value={form.address}
                      onChange={(event) =>
                        changeField(
                          "address",
                          event.target.value,
                        )
                      }
                      maxLength={250}
                    />

                    {errors.address && (
                      <div className="invalid-feedback">
                        {errors.address}
                      </div>
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
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Guardando..."
                    : patient
                      ? "Guardar cambios"
                      : "Registrar paciente"}
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