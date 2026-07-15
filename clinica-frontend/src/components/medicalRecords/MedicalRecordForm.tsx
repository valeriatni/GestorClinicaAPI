import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  MedicalRecord,
  MedicalRecordPayload,
} from "../../types/medicalRecord";

interface MedicalRecordFormProps {
  patientId: number;
  medicalRecord: MedicalRecord | null;
  isSaving: boolean;

  onSave: (
    medicalRecord: MedicalRecordPayload,
  ) => Promise<void>;
}

interface MedicalRecordFormData {
  medical_history: string;
  allergies: string;
  general_observations: string;
}

interface FormErrors {
  medical_history?: string;
  allergies?: string;
  general_observations?: string;
  general?: string;
}

const emptyForm: MedicalRecordFormData = {
  medical_history: "",
  allergies: "",
  general_observations: "",
};

export default function MedicalRecordForm({
  patientId,
  medicalRecord,
  isSaving,
  onSave,
}: MedicalRecordFormProps) {
  const [form, setForm] =
    useState<MedicalRecordFormData>(emptyForm);

  const [errors, setErrors] =
    useState<FormErrors>({});

  useEffect(() => {
    if (medicalRecord) {
      setForm({
        medical_history:
          medicalRecord.medical_history ?? "",

        allergies:
          medicalRecord.allergies ?? "",

        general_observations:
          medicalRecord.general_observations ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [medicalRecord, patientId]);

  function changeField(
    field: keyof MedicalRecordFormData,
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

    const medicalHistory =
      form.medical_history.trim();

    const allergies =
      form.allergies.trim();

    const observations =
      form.general_observations.trim();

    if (
      !medicalHistory &&
      !allergies &&
      !observations
    ) {
      newErrors.general =
        "Debe registrar al menos un dato clínico antes de guardar.";
    }

    if (medicalHistory.length > 2000) {
      newErrors.medical_history =
        "Los antecedentes no pueden superar los 2000 caracteres.";
    }

    if (allergies.length > 1000) {
      newErrors.allergies =
        "Las alergias no pueden superar los 1000 caracteres.";
    }

    if (observations.length > 2000) {
      newErrors.general_observations =
        "Las observaciones no pueden superar los 2000 caracteres.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrors({});

    if (!patientId) {
      setErrors({
        general:
          "Debe seleccionar un paciente.",
      });

      return;
    }

    if (!validateForm()) {
      return;
    }

    const medicalRecordData: MedicalRecordPayload = {
      patient: patientId,

      medical_history:
        form.medical_history.trim() || null,

      allergies:
        form.allergies.trim() || null,

      general_observations:
        form.general_observations.trim() || null,

      is_active: true,
    };

    try {
      await onSave(medicalRecordData);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la historia clínica.",
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

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
    >
      {errors.general && (
        <div className="alert alert-danger">
          {errors.general}
        </div>
      )}

      {!medicalRecord && (
        <div className="alert alert-info">
          Este paciente todavía no tiene una
          historia clínica. Complete los datos para
          crearla.
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">
          Antecedentes médicos
        </label>

        <textarea
          className={inputClass(
            "medical_history",
          )}
          value={form.medical_history}
          onChange={(event) =>
            changeField(
              "medical_history",
              event.target.value,
            )
          }
          rows={4}
          maxLength={2000}
          placeholder="Ejemplo: enfermedades anteriores, operaciones, tratamientos, medicamentos que utiliza..."
          disabled={isSaving}
        />

        {errors.medical_history ? (
          <div className="invalid-feedback">
            {errors.medical_history}
          </div>
        ) : (
          <small className="text-muted">
            {form.medical_history.length}/2000
          </small>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">
          Alergias
        </label>

        <textarea
          className={inputClass("allergies")}
          value={form.allergies}
          onChange={(event) =>
            changeField(
              "allergies",
              event.target.value,
            )
          }
          rows={3}
          maxLength={1000}
          placeholder="Ejemplo: alergia a la penicilina. Si no presenta alergias, puede escribir: Ninguna conocida."
          disabled={isSaving}
        />

        {errors.allergies ? (
          <div className="invalid-feedback">
            {errors.allergies}
          </div>
        ) : (
          <small className="text-muted">
            {form.allergies.length}/1000
          </small>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">
          Observaciones clínicas / diagnóstico
        </label>

        <textarea
          className={inputClass(
            "general_observations",
          )}
          value={form.general_observations}
          onChange={(event) =>
            changeField(
              "general_observations",
              event.target.value,
            )
          }
          rows={5}
          maxLength={2000}
          placeholder="Ejemplo: presenta caries en la pieza 16, dolor al masticar y sensibilidad..."
          disabled={isSaving}
        />

        {errors.general_observations ? (
          <div className="invalid-feedback">
            {errors.general_observations}
          </div>
        ) : (
          <small className="text-muted">
            {form.general_observations.length}/2000
          </small>
        )}
      </div>

      <div className="d-flex justify-content-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving}
        >
          {isSaving
            ? "Guardando..."
            : medicalRecord
              ? "Actualizar historia clínica"
              : "Crear historia clínica"}
        </button>
      </div>
    </form>
  );
}