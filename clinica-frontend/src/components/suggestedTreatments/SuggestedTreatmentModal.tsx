import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  ProcedureOption,
  SuggestedTreatment,
  SuggestedTreatmentPayload,
  TreatmentSpecialist,
  TreatmentStatus,
} from "../../types/suggestedTreatment";

interface SuggestedTreatmentModalProps {
  medicalRecordId: number;
  treatment: SuggestedTreatment | null;
  treatments: SuggestedTreatment[];
  procedures: ProcedureOption[];
  specialists: TreatmentSpecialist[];
  isSaving: boolean;
  onClose: () => void;

  onSave: (
    treatment: SuggestedTreatmentPayload,
  ) => Promise<void>;
}

interface TreatmentForm {
  procedure: string;
  specialist: string;
  tooth_code: string;
  quantity: string;
  notes: string;
  treatment_status: TreatmentStatus;
}

interface FormErrors {
  procedure?: string;
  specialist?: string;
  tooth_code?: string;
  quantity?: string;
  notes?: string;
  treatment_status?: string;
  general?: string;
}

const emptyForm: TreatmentForm = {
  procedure: "",
  specialist: "",
  tooth_code: "",
  quantity: "1",
  notes: "",
  treatment_status: "Suggested",
};

export default function SuggestedTreatmentModal({
  medicalRecordId,
  treatment,
  treatments,
  procedures,
  specialists,
  isSaving,
  onClose,
  onSave,
}: SuggestedTreatmentModalProps) {
  const [form, setForm] =
    useState<TreatmentForm>(emptyForm);

  const [errors, setErrors] =
    useState<FormErrors>({});

  useEffect(() => {
    if (treatment) {
      setForm({
        procedure: treatment.procedure
          ? String(treatment.procedure)
          : "",

        specialist: String(treatment.specialist),

        tooth_code: treatment.tooth_code ?? "",

        quantity: String(treatment.quantity),

        notes: treatment.notes ?? "",

        treatment_status:
          treatment.treatment_status,
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [treatment]);

  function changeField(
    field: keyof TreatmentForm,
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

    const procedureId = Number(form.procedure);
    const specialistId = Number(form.specialist);
    const quantity = Number(form.quantity);
    const toothCode = form.tooth_code.trim();
    const notes = form.notes.trim();

    if (!form.procedure) {
      newErrors.procedure =
        "Debe seleccionar un procedimiento.";
    } else {
      const selectedProcedure = procedures.find(
        (procedure) =>
          procedure.id === procedureId,
      );

      if (!selectedProcedure) {
        newErrors.procedure =
          "El procedimiento seleccionado no existe.";
      } else if (!selectedProcedure.is_active) {
        newErrors.procedure =
          "El procedimiento está inactivo.";
      }
    }

    if (!form.specialist) {
      newErrors.specialist =
        "Debe seleccionar un especialista.";
    } else {
      const selectedSpecialist = specialists.find(
        (specialist) =>
          specialist.id === specialistId,
      );

      if (!selectedSpecialist) {
        newErrors.specialist =
          "El especialista seleccionado no existe.";
      } else if (!selectedSpecialist.is_active) {
        newErrors.specialist =
          "El especialista está inactivo.";
      }
    }

    if (!form.quantity) {
      newErrors.quantity =
        "Debe ingresar la cantidad.";
    } else if (!Number.isInteger(quantity)) {
      newErrors.quantity =
        "La cantidad debe ser un número entero.";
    } else if (quantity <= 0) {
      newErrors.quantity =
        "La cantidad debe ser mayor que cero.";
    } else if (quantity > 32) {
      newErrors.quantity =
        "La cantidad no puede superar 32.";
    }

    if (toothCode.length > 20) {
      newErrors.tooth_code =
        "La pieza dental no puede superar los 20 caracteres.";
    }

    if (notes.length > 500) {
      newErrors.notes =
        "Las notas no pueden superar los 500 caracteres.";
    }

    if (
      form.procedure &&
      form.specialist &&
      form.quantity
    ) {
      const duplicateTreatment = treatments.some(
        (currentTreatment) =>
          currentTreatment.id !== treatment?.id &&
          currentTreatment.medical_record ===
            medicalRecordId &&
          currentTreatment.procedure === procedureId &&
          (currentTreatment.tooth_code ?? "")
            .trim()
            .toLowerCase() ===
            toothCode.toLowerCase() &&
          currentTreatment.treatment_status !==
            "Cancelled",
      );

      if (duplicateTreatment) {
        newErrors.general =
          "Ya existe este procedimiento sugerido para la misma pieza dental.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrors({});

    if (!validateForm()) {
      return;
    }

    const treatmentData: SuggestedTreatmentPayload = {
      medical_record: medicalRecordId,

      procedure: Number(form.procedure),

      specialist: Number(form.specialist),

      tooth_code:
        form.tooth_code.trim().toUpperCase() ||
        null,

      quantity: Number(form.quantity),

      notes: form.notes.trim() || null,

      treatment_status:
        form.treatment_status,

      is_active: true,
    };

    try {
      await onSave(treatmentData);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el tratamiento.",
      });
    }
  }

  function inputClass(
    field: keyof FormErrors,
  ): string {
    return `form-control ${
      errors[field] ? "is-invalid" : ""
    }`;
  }

  function selectClass(
    field: keyof FormErrors,
  ): string {
    return `form-select ${
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
                  {treatment
                    ? "Editar tratamiento sugerido"
                    : "Agregar tratamiento sugerido"}
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
                  Los campos con * son obligatorios.
                </p>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Procedimiento *
                    </label>

                    <select
                      className={selectClass(
                        "procedure",
                      )}
                      value={form.procedure}
                      onChange={(event) =>
                        changeField(
                          "procedure",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    >
                      <option value="">
                        Seleccione un procedimiento
                      </option>

                      {procedures.map((procedure) => (
                        <option
                          key={procedure.id}
                          value={procedure.id}
                          disabled={!procedure.is_active}
                        >
                          {procedure.name} - S/{" "}
                          {procedure.price}
                          {!procedure.is_active
                            ? " - Inactivo"
                            : ""}
                        </option>
                      ))}
                    </select>

                    {errors.procedure && (
                      <div className="invalid-feedback">
                        {errors.procedure}
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

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Pieza dental
                    </label>

                    <input
                      type="text"
                      className={inputClass(
                        "tooth_code",
                      )}
                      value={form.tooth_code}
                      onChange={(event) =>
                        changeField(
                          "tooth_code",
                          event.target.value,
                        )
                      }
                      maxLength={20}
                      placeholder="Ejemplo: 16"
                      disabled={isSaving}
                    />

                    {errors.tooth_code ? (
                      <div className="invalid-feedback">
                        {errors.tooth_code}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Puede dejarse vacío para
                        procedimientos generales.
                      </small>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Cantidad *
                    </label>

                    <input
                      type="number"
                      className={inputClass(
                        "quantity",
                      )}
                      value={form.quantity}
                      min={1}
                      max={32}
                      onChange={(event) =>
                        changeField(
                          "quantity",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    />

                    {errors.quantity && (
                      <div className="invalid-feedback">
                        {errors.quantity}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Estado *
                    </label>

                    <select
                      className={selectClass(
                        "treatment_status",
                      )}
                      value={
                        form.treatment_status
                      }
                      onChange={(event) =>
                        changeField(
                          "treatment_status",
                          event.target
                            .value as TreatmentStatus,
                        )
                      }
                      disabled={isSaving}
                    >
                      <option value="Suggested">
                        Sugerido
                      </option>

                      <option value="Budgeted">
                        Presupuestado
                      </option>

                      <option value="In Progress">
                        En progreso
                      </option>

                      <option value="Finished">
                        Finalizado
                      </option>

                      <option value="Cancelled">
                        Cancelado
                      </option>
                    </select>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">
                      Notas
                    </label>

                    <textarea
                      className={inputClass("notes")}
                      value={form.notes}
                      onChange={(event) =>
                        changeField(
                          "notes",
                          event.target.value,
                        )
                      }
                      rows={3}
                      maxLength={500}
                      placeholder="Ejemplo: realizar después de controlar la inflamación"
                      disabled={isSaving}
                    />

                    {errors.notes ? (
                      <div className="invalid-feedback">
                        {errors.notes}
                      </div>
                    ) : (
                      <small className="text-muted">
                        {form.notes.length}/500
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
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Guardando..."
                    : treatment
                      ? "Guardar cambios"
                      : "Agregar tratamiento"}
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