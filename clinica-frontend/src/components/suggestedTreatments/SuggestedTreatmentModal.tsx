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


interface Props {
  medicalRecordId: number;

  treatment:
    | SuggestedTreatment
    | null;

  treatments: SuggestedTreatment[];
  procedures: ProcedureOption[];
  specialists: TreatmentSpecialist[];

  isSaving: boolean;

  onClose: () => void;

  onSave: (
    treatment:
      SuggestedTreatmentPayload,
  ) => Promise<void>;
}


function getRelationId(
  value:
    | number
    | {
        id: number;
      }
    | null
    | undefined,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return typeof value === "number"
    ? value
    : value.id;
}


function today(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


export default function SuggestedTreatmentModal({
  medicalRecordId,
  treatment,
  procedures,
  specialists,
  isSaving,
  onClose,
  onSave,
}: Props) {
  const [
    procedureId,
    setProcedureId,
  ] = useState("");

  const [
    specialistId,
    setSpecialistId,
  ] = useState("");

  const [
    diagnosis,
    setDiagnosis,
  ] = useState("");

  const [
    clinicalObservations,
    setClinicalObservations,
  ] = useState("");

  const [
    diagnosisDate,
    setDiagnosisDate,
  ] = useState(today());

  const [
    treatmentStatus,
    setTreatmentStatus,
  ] = useState<TreatmentStatus>(
    "Suggested",
  );

  const [
    cancelledReason,
    setCancelledReason,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    if (!treatment) {
      setProcedureId("");
      setSpecialistId("");
      setDiagnosis("");
      setClinicalObservations("");
      setDiagnosisDate(today());
      setTreatmentStatus(
        "Suggested",
      );
      setCancelledReason("");
      setErrorMessage("");

      return;
    }

    const currentProcedureId =
      getRelationId(
        treatment.procedure,
      );

    const currentSpecialistId =
      getRelationId(
        treatment.specialist,
      );

    setProcedureId(
      currentProcedureId
        ? String(
            currentProcedureId,
          )
        : "",
    );

    setSpecialistId(
      currentSpecialistId
        ? String(
            currentSpecialistId,
          )
        : "",
    );

    setDiagnosis(
      treatment.diagnosis ?? "",
    );

    setClinicalObservations(
      treatment
        .clinical_observations ??
        "",
    );

    setDiagnosisDate(
      treatment.diagnosis_date,
    );

    setTreatmentStatus(
      treatment.treatment_status,
    );

    setCancelledReason(
      treatment.cancelled_reason ??
        "",
    );

    setErrorMessage("");
  }, [treatment]);


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    const parsedProcedureId =
      Number(procedureId);

    const parsedSpecialistId =
      Number(specialistId);

    if (
      !Number.isInteger(
        parsedProcedureId,
      ) ||
      parsedProcedureId <= 0
    ) {
      setErrorMessage(
        "Debe seleccionar un procedimiento.",
      );

      return;
    }

    if (
      !Number.isInteger(
        parsedSpecialistId,
      ) ||
      parsedSpecialistId <= 0
    ) {
      setErrorMessage(
        "Debe seleccionar un especialista.",
      );

      return;
    }

    if (
      diagnosis.trim().length < 3
    ) {
      setErrorMessage(
        "Debe ingresar el diagnóstico.",
      );

      return;
    }

    if (!diagnosisDate) {
      setErrorMessage(
        "Debe ingresar la fecha del diagnóstico.",
      );

      return;
    }

    if (
      diagnosisDate > today()
    ) {
      setErrorMessage(
        "La fecha del diagnóstico no puede estar en el futuro.",
      );

      return;
    }

    if (
      treatmentStatus ===
        "Cancelled" &&
      !cancelledReason.trim()
    ) {
      setErrorMessage(
        "Debe ingresar el motivo de cancelación.",
      );

      return;
    }

    try {
      await onSave({
        medical_record:
          medicalRecordId,

        procedure:
          parsedProcedureId,

        specialist:
          parsedSpecialistId,

        diagnosis:
          diagnosis.trim(),

        clinical_observations:
          clinicalObservations
            .trim() ||
          null,

        diagnosis_date:
          diagnosisDate,

        treatment_status:
          treatmentStatus,

        is_active:
          treatmentStatus !==
          "Cancelled",

        cancelled_reason:
          treatmentStatus ===
          "Cancelled"
            ? cancelledReason.trim()
            : null,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el tratamiento sugerido.",
      );
    }
  }


  const activeProcedures =
    procedures.filter(
      (procedure) =>
        procedure.is_active &&
        !procedure.is_deleted,
    );

  const activeSpecialists =
    specialists.filter(
      (specialist) =>
        specialist.is_active &&
        !specialist.is_deleted,
    );


  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{
        backgroundColor:
          "rgba(0, 0, 0, 0.5)",

        overflowY: "auto",
        padding: "1rem 0",
      }}
    >
      <div
        className="modal-dialog modal-lg"
        role="document"
        style={{
          marginTop: 0,
          marginBottom: 0,
        }}
      >
        <div
          className="modal-content"
          style={{
            maxHeight:
              "calc(100vh - 2rem)",

            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div className="modal-header flex-shrink-0">
            <h5 className="modal-title">
              {treatment
                ? "Editar tratamiento sugerido"
                : "Nuevo tratamiento sugerido"}
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Cerrar"
            />
          </div>

          <form
            onSubmit={handleSubmit}
            className="d-flex flex-column flex-grow-1"
            style={{
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              className="modal-body"
              style={{
                minHeight: 0,
                overflowY: "scroll",
                overflowX: "hidden",
                scrollbarGutter: "stable",
                paddingRight: "1.25rem",
              }}
            >
              {errorMessage && (
                <div className="alert alert-danger">
                  {errorMessage}
                </div>
              )}

              <div className="alert alert-light border">
                Historia clínica:{" "}
                <strong>
                  #{medicalRecordId}
                </strong>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Procedimiento *
                  </label>

                  <select
                    className="form-select"
                    value={procedureId}
                    onChange={(event) =>
                      setProcedureId(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSaving}
                  >
                    <option value="">
                      Seleccione un procedimiento
                    </option>

                    {activeProcedures.map(
                      (procedure) => {
                        const price =
                          procedure.base_price ??
                          procedure.price;

                        return (
                          <option
                            key={procedure.id}
                            value={procedure.id}
                          >
                            {procedure.name}
                            {price
                              ? ` - S/ ${price}`
                              : ""}
                          </option>
                        );
                      },
                    )}
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Especialista *
                  </label>

                  <select
                    className="form-select"
                    value={specialistId}
                    onChange={(event) =>
                      setSpecialistId(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSaving}
                  >
                    <option value="">
                      Seleccione un especialista
                    </option>

                    {activeSpecialists.map(
                      (specialist) => (
                        <option
                          key={specialist.id}
                          value={specialist.id}
                        >
                          Dr(a).{" "}
                          {specialist.first_name}{" "}
                          {specialist.last_name}
                          {" - "}
                          {specialist.license_number}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="col-md-8 mb-3">
                  <label className="form-label">
                    Diagnóstico *
                  </label>

                  <textarea
                    className="form-control"
                    rows={4}
                    value={diagnosis}
                    onChange={(event) =>
                      setDiagnosis(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    Fecha del diagnóstico *
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={diagnosisDate}
                    max={today()}
                    onChange={(event) =>
                      setDiagnosisDate(
                        event.target.value,
                      )
                    }
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="col-12 mb-3">
                  <label className="form-label">
                    Observaciones clínicas
                  </label>

                  <textarea
                    className="form-control"
                    rows={4}
                    value={
                      clinicalObservations
                    }
                    onChange={(event) =>
                      setClinicalObservations(
                        event.target.value,
                      )
                    }
                    disabled={isSaving}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Estado
                  </label>

                  <select
                    className="form-select"
                    value={treatmentStatus}
                    onChange={(event) =>
                      setTreatmentStatus(
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
                      En tratamiento
                    </option>

                    <option value="Finished">
                      Finalizado
                    </option>

                    <option value="Cancelled">
                      Cancelado
                    </option>
                  </select>
                </div>

                {treatmentStatus ===
                  "Cancelled" && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Motivo de cancelación *
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={cancelledReason}
                      onChange={(event) =>
                        setCancelledReason(
                          event.target.value,
                        )
                      }
                      required
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer flex-shrink-0 bg-white">
              <button
                type="button"
                className="btn btn-outline-secondary"
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
                    : "Registrar tratamiento"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}