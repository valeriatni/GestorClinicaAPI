import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  MedicalRecord,
  MedicalRecordPayload,
} from "../../types/medicalRecord";


interface Props {
  patientId: number;

  medicalRecord:
    | MedicalRecord
    | null;

  isSaving: boolean;

  onSave: (
    payload:
      MedicalRecordPayload,
  ) => Promise<void>;
}


export default function MedicalRecordForm({
  patientId,
  medicalRecord,
  isSaving,
  onSave,
}: Props) {
  const [
    medicalHistory,
    setMedicalHistory,
  ] = useState("");

  const [
    allergies,
    setAllergies,
  ] = useState("");

  const [
    generalObservations,
    setGeneralObservations,
  ] = useState("");

  const [
    formError,
    setFormError,
  ] = useState("");


  useEffect(() => {
    setMedicalHistory(
      medicalRecord
        ?.medical_history ??
        "",
    );

    setAllergies(
      medicalRecord?.allergies ??
        "",
    );

    setGeneralObservations(
      medicalRecord
        ?.general_observations ??
        "",
    );

    setFormError("");
  }, [
    medicalRecord,
    patientId,
  ]);


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError("");

    try {
      await onSave({
        patient: patientId,

        medical_history:
          medicalHistory.trim() ||
          null,

        allergies:
          allergies.trim() ||
          null,

        general_observations:
          generalObservations
            .trim() ||
          null,
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la historia clínica.",
      );
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
    >
      {formError && (
        <div className="alert alert-danger">
          {formError}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">
          Antecedentes médicos
        </label>

        <textarea
          className="form-control"
          rows={4}
          value={medicalHistory}
          onChange={(event) =>
            setMedicalHistory(
              event.target.value,
            )
          }
          placeholder="Enfermedades previas, intervenciones, medicamentos u otros antecedentes."
          disabled={isSaving}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">
          Alergias
        </label>

        <textarea
          className="form-control"
          rows={3}
          value={allergies}
          onChange={(event) =>
            setAllergies(
              event.target.value,
            )
          }
          placeholder="Alergias conocidas. Escriba 'Ninguna conocida' cuando corresponda."
          disabled={isSaving}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">
          Observaciones generales
        </label>

        <textarea
          className="form-control"
          rows={4}
          value={
            generalObservations
          }
          onChange={(event) =>
            setGeneralObservations(
              event.target.value,
            )
          }
          placeholder="Información clínica general relevante para futuras atenciones."
          disabled={isSaving}
        />
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
              ? "Guardar cambios"
              : "Crear historia clínica"}
        </button>
      </div>
    </form>
  );
}
