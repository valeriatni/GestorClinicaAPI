import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  Specialist,
  SpecialistPayload,
} from "../../types/specialist";

import type {
  Specialty,
} from "../../types/specialty";

interface SpecialistModalProps {
  specialist: Specialist | null;
  specialists: Specialist[];
  specialties: Specialty[];
  isSaving: boolean;
  onClose: () => void;

  onSave: (
    specialist: SpecialistPayload,
  ) => Promise<void>;
}

interface SpecialistForm {
  specialty: string;
  first_name: string;
  last_name: string;
  license_number: string;
  phone: string;
  email: string;
}

interface FormErrors {
  specialty?: string;
  first_name?: string;
  last_name?: string;
  license_number?: string;
  phone?: string;
  email?: string;
  general?: string;
}

const emptyForm: SpecialistForm = {
  specialty: "",
  first_name: "",
  last_name: "",
  license_number: "",
  phone: "",
  email: "",
};

const namePattern =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/;

const licensePattern =
  /^[A-Za-z0-9/-]+$/;

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SpecialistModal({
  specialist,
  specialists,
  specialties,
  isSaving,
  onClose,
  onSave,
}: SpecialistModalProps) {
  const [form, setForm] =
    useState<SpecialistForm>(
      emptyForm,
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  useEffect(() => {
    if (specialist) {
      setForm({
        specialty: String(
          specialist.specialty,
        ),

        first_name:
          specialist.first_name,

        last_name:
          specialist.last_name,

        license_number:
          specialist.license_number,

        phone:
          specialist.phone ?? "",

        email:
          specialist.email ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [specialist]);

  function changeField(
    field: keyof SpecialistForm,
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

    const licenseNumber =
      form.license_number
        .trim()
        .toUpperCase();

    const email =
      form.email
        .trim()
        .toLowerCase();

    if (!form.specialty) {
      newErrors.specialty =
        "Debe seleccionar una especialidad.";
    } else {
      const selectedSpecialty =
        specialties.find(
          (specialty) =>
            specialty.id ===
            Number(form.specialty),
        );

      if (!selectedSpecialty) {
        newErrors.specialty =
          "La especialidad seleccionada no existe.";
      } else if (
        !selectedSpecialty.is_active &&
        Number(form.specialty) !==
          specialist?.specialty
      ) {
        newErrors.specialty =
          "La especialidad está inactiva y no puede asignarse.";
      }
    }

    if (!firstName) {
      newErrors.first_name =
        "Los nombres son obligatorios.";
    } else if (
      firstName.length < 2
    ) {
      newErrors.first_name =
        "Los nombres deben tener al menos 2 caracteres.";
    } else if (
      firstName.length > 100
    ) {
      newErrors.first_name =
        "Los nombres no pueden superar los 100 caracteres.";
    } else if (
      !namePattern.test(firstName)
    ) {
      newErrors.first_name =
        "Los nombres solo deben contener letras.";
    }

    if (!lastName) {
      newErrors.last_name =
        "Los apellidos son obligatorios.";
    } else if (
      lastName.length < 2
    ) {
      newErrors.last_name =
        "Los apellidos deben tener al menos 2 caracteres.";
    } else if (
      lastName.length > 100
    ) {
      newErrors.last_name =
        "Los apellidos no pueden superar los 100 caracteres.";
    } else if (
      !namePattern.test(lastName)
    ) {
      newErrors.last_name =
        "Los apellidos solo deben contener letras.";
    }

    if (!licenseNumber) {
      newErrors.license_number =
        "El número de colegiatura es obligatorio.";
    } else if (
      licenseNumber.length < 4
    ) {
      newErrors.license_number =
        "El número de colegiatura debe tener al menos 4 caracteres.";
    } else if (
      licenseNumber.length > 30
    ) {
      newErrors.license_number =
        "El número de colegiatura no puede superar los 30 caracteres.";
    } else if (
      !licensePattern.test(
        licenseNumber,
      )
    ) {
      newErrors.license_number =
        "La colegiatura solo puede contener letras, números, guiones o barras.";
    }

    if (
      form.phone &&
      !/^9\d{8}$/.test(form.phone)
    ) {
      newErrors.phone =
        "El celular debe tener 9 números y comenzar con 9.";
    }

    if (
      email &&
      !emailPattern.test(email)
    ) {
      newErrors.email =
        "Ingrese un correo electrónico válido.";
    }

    if (email.length > 150) {
      newErrors.email =
        "El correo no puede superar los 150 caracteres.";
    }

    const duplicatedLicense =
      specialists.some(
        (currentSpecialist) =>
          currentSpecialist.id !==
            specialist?.id &&
          currentSpecialist
            .license_number
            .trim()
            .toUpperCase() ===
            licenseNumber,
      );

    if (duplicatedLicense) {
      newErrors.license_number =
        "Ya existe un especialista registrado con esta colegiatura.";
    }

    if (email) {
      const duplicatedEmail =
        specialists.some(
          (currentSpecialist) =>
            currentSpecialist.id !==
              specialist?.id &&
            currentSpecialist.email
              ?.trim()
              .toLowerCase() ===
              email,
        );

      if (duplicatedEmail) {
        newErrors.email =
          "Ya existe un especialista registrado con este correo.";
      }
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length ===
      0
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

    const specialistData: SpecialistPayload =
      {
        specialty: Number(
          form.specialty,
        ),

        first_name:
          form.first_name.trim(),

        last_name:
          form.last_name.trim(),

        license_number:
          form.license_number
            .trim()
            .toUpperCase(),

        phone:
          form.phone.trim() || null,

        email:
          form.email
            .trim()
            .toLowerCase() || null,

        is_active:
          specialist
            ? specialist.is_active
            : true,
      };

    try {
      await onSave(specialistData);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el especialista.",
      });
    }
  }

  function getInputClass(
    field: keyof FormErrors,
  ) {
    return `form-control ${
      errors[field]
        ? "is-invalid"
        : ""
    }`;
  }

  function getSelectClass(
    field: keyof FormErrors,
  ) {
    return `form-select ${
      errors[field]
        ? "is-invalid"
        : ""
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
                  {specialist
                    ? "Editar especialista"
                    : "Registrar especialista"}
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
                      value={
                        form.first_name
                      }
                      onChange={(event) =>
                        changeField(
                          "first_name",
                          event.target.value,
                        )
                      }
                      maxLength={100}
                      placeholder="Ejemplo: Ana María"
                      disabled={isSaving}
                    />

                    {errors.first_name && (
                      <div className="invalid-feedback">
                        {
                          errors.first_name
                        }
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
                      placeholder="Ejemplo: López Ramos"
                      disabled={isSaving}
                    />

                    {errors.last_name && (
                      <div className="invalid-feedback">
                        {errors.last_name}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Especialidad *
                    </label>

                    <select
                      className={getSelectClass(
                        "specialty",
                      )}
                      value={form.specialty}
                      onChange={(event) =>
                        changeField(
                          "specialty",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    >
                      <option value="">
                        Seleccione una
                        especialidad
                      </option>

                      {specialties.map(
                        (specialty) => (
                          <option
                            key={specialty.id}
                            value={specialty.id}
                            disabled={
                              !specialty.is_active &&
                              specialty.id !==
                                specialist?.specialty
                            }
                          >
                            {specialty.name}
                            {!specialty.is_active
                              ? " - Inactiva"
                              : ""}
                          </option>
                        ),
                      )}
                    </select>

                    {errors.specialty && (
                      <div className="invalid-feedback">
                        {errors.specialty}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Número de colegiatura *
                    </label>

                    <input
                      type="text"
                      className={getInputClass(
                        "license_number",
                      )}
                      value={
                        form.license_number
                      }
                      onChange={(event) =>
                        changeField(
                          "license_number",
                          event.target.value
                            .toUpperCase()
                            .replace(
                              /[^A-Z0-9/-]/g,
                              "",
                            ),
                        )
                      }
                      maxLength={30}
                      placeholder="Ejemplo: COP-12345"
                      disabled={isSaving}
                    />

                    {errors.license_number ? (
                      <div className="invalid-feedback">
                        {
                          errors.license_number
                        }
                      </div>
                    ) : (
                      <small className="text-muted">
                        Debe ser única.
                      </small>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
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
                      placeholder="987654321"
                      disabled={isSaving}
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

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Correo electrónico
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
                      placeholder="especialista@clinica.com"
                      disabled={isSaving}
                    />

                    {errors.email && (
                      <div className="invalid-feedback">
                        {errors.email}
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
                    : specialist
                      ? "Guardar cambios"
                      : "Registrar especialista"}
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