import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  Specialty,
  SpecialtyPayload,
} from "../../types/specialty";

interface SpecialtyModalProps {
  specialty: Specialty | null;
  specialties: Specialty[];
  isSaving: boolean;
  onClose: () => void;

  onSave: (
    specialty: SpecialtyPayload,
  ) => Promise<void>;
}

interface SpecialtyForm {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  general?: string;
}

const emptyForm: SpecialtyForm = {
  name: "",
  description: "",
};

const validNamePattern =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s()/-]+$/;

export default function SpecialtyModal({
  specialty,
  specialties,
  isSaving,
  onClose,
  onSave,
}: SpecialtyModalProps) {
  const [form, setForm] =
    useState<SpecialtyForm>(
      emptyForm,
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  useEffect(() => {
    if (specialty) {
      setForm({
        name: specialty.name,
        description:
          specialty.description ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [specialty]);

  function changeField(
    field: keyof SpecialtyForm,
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

    const cleanName =
      form.name.trim();

    const cleanDescription =
      form.description.trim();

    if (!cleanName) {
      newErrors.name =
        "El nombre de la especialidad es obligatorio.";
    } else if (
      cleanName.length < 3
    ) {
      newErrors.name =
        "El nombre debe tener al menos 3 caracteres.";
    } else if (
      cleanName.length > 100
    ) {
      newErrors.name =
        "El nombre no puede superar los 100 caracteres.";
    } else if (
      !validNamePattern.test(cleanName)
    ) {
      newErrors.name =
        "El nombre contiene caracteres no permitidos.";
    }

    if (
      cleanDescription.length > 500
    ) {
      newErrors.description =
        "La descripción no puede superar los 500 caracteres.";
    }

    const duplicatedSpecialty =
      specialties.some(
        (currentSpecialty) =>
          currentSpecialty.id !==
            specialty?.id &&
          currentSpecialty.name
            .trim()
            .toLowerCase() ===
            cleanName.toLowerCase(),
      );

    if (duplicatedSpecialty) {
      newErrors.name =
        "Ya existe una especialidad registrada con este nombre.";
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

    const specialtyData: SpecialtyPayload =
      {
        name: form.name.trim(),

        description:
          form.description.trim() ||
          null,

        is_active:
          specialty
            ? specialty.is_active
            : true,
      };

    try {
      await onSave(specialtyData);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la especialidad.",
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

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  {specialty
                    ? "Editar especialidad"
                    : "Registrar especialidad"}
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

                <div className="mb-3">
                  <label className="form-label">
                    Nombre de la especialidad *
                  </label>

                  <input
                    type="text"
                    className={getInputClass(
                      "name",
                    )}
                    value={form.name}
                    onChange={(event) =>
                      changeField(
                        "name",
                        event.target.value,
                      )
                    }
                    maxLength={100}
                    placeholder="Ejemplo: Ortodoncia"
                    disabled={isSaving}
                  />

                  {errors.name ? (
                    <div className="invalid-feedback">
                      {errors.name}
                    </div>
                  ) : (
                    <small className="text-muted">
                      Debe ser un nombre único.
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Descripción
                  </label>

                  <textarea
                    className={getInputClass(
                      "description",
                    )}
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      changeField(
                        "description",
                        event.target.value,
                      )
                    }
                    rows={4}
                    maxLength={500}
                    placeholder="Ejemplo: Especialidad encargada de corregir la posición de los dientes."
                    disabled={isSaving}
                  />

                  {errors.description ? (
                    <div className="invalid-feedback">
                      {
                        errors.description
                      }
                    </div>
                  ) : (
                    <small className="text-muted">
                      {
                        form.description
                          .length
                      }
                      /500
                    </small>
                  )}
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
                    : specialty
                      ? "Guardar cambios"
                      : "Registrar especialidad"}
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