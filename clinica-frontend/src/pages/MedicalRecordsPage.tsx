import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import MedicalRecordForm from "../components/medicalRecords/MedicalRecordForm";

import {
  useMedicalRecords,
} from "../hooks/useMedicalRecords";

import type {
  MedicalRecordPayload,
} from "../types/medicalRecord";

export default function MedicalRecordsPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const patientFromUrl =
    searchParams.get("patient");

  const appointmentFromUrl =
    searchParams.get("appointment");

  const [
    selectedPatientId,
    setSelectedPatientId,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const {
    medicalRecords,
    patients,
    isLoading,
    isError,
    queryError,
    refetchMedicalRecords,
    createMutation,
    updateMutation,
  } = useMedicalRecords();

  useEffect(() => {
    if (
      !patientFromUrl ||
      patients.length === 0
    ) {
      return;
    }

    const patientId = Number(patientFromUrl);

    const patientExists = patients.some(
      (patient) =>
        patient.id === patientId &&
        patient.is_active,
    );

    if (patientExists) {
      setSelectedPatientId(
        String(patientId),
      );
    } else {
      setErrorMessage(
        "El paciente seleccionado no existe o está inactivo.",
      );
    }
  }, [patientFromUrl, patients]);

  const selectedPatient = patients.find(
    (patient) =>
      patient.id === Number(selectedPatientId),
  );

  const selectedMedicalRecord =
    medicalRecords.find(
      (medicalRecord) =>
        medicalRecord.patient ===
          Number(selectedPatientId) &&
        medicalRecord.is_active,
    ) ?? null;

  async function saveMedicalRecord(
    medicalRecordData: MedicalRecordPayload,
  ) {
    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedPatient) {
      throw new Error(
        "Debe seleccionar un paciente.",
      );
    }

    if (!selectedPatient.is_active) {
      throw new Error(
        "El paciente está inactivo y su historia clínica no puede ser modificada.",
      );
    }

    if (selectedMedicalRecord) {
      await updateMutation.mutateAsync({
        id: selectedMedicalRecord.id,
        medicalRecord: medicalRecordData,
      });

      setSuccessMessage(
        "La historia clínica se actualizó correctamente.",
      );
    } else {
      await createMutation.mutateAsync(
        medicalRecordData,
      );

      setSuccessMessage(
        "La historia clínica se creó correctamente.",
      );
    }
  }

  function continueToTreatment() {
    if (!selectedPatient) {
      setErrorMessage(
        "Debe seleccionar un paciente.",
      );

      return;
    }

    if (!selectedMedicalRecord) {
      setErrorMessage(
        "Primero debe crear la historia clínica del paciente.",
      );

      return;
    }

    const appointmentParameter = appointmentFromUrl
      ? `&appointment=${appointmentFromUrl}`
      : "";

    navigate(
      `/suggested-treatments?patient=${selectedPatient.id}&medical_record=${selectedMedicalRecord.id}${appointmentParameter}`,
    ); 
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Historia clínica</h2>

          <p className="text-muted mb-0">
            Registre los antecedentes, alergias y
            observaciones clínicas del paciente.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() =>
            navigate("/appointments")
          }
        >
          Volver a citas
        </button>
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

      {appointmentFromUrl && (
        <div className="alert alert-info">
          Atención correspondiente a la cita número{" "}
          <strong>{appointmentFromUrl}</strong>.
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <label className="form-label">
            Paciente *
          </label>

          <select
            className="form-select"
            value={selectedPatientId}
            onChange={(event) => {
              setSelectedPatientId(
                event.target.value,
              );

              setSuccessMessage("");
              setErrorMessage("");
            }}
            disabled={isLoading}
          >
            <option value="">
              Seleccione un paciente
            </option>

            {patients.map((patient) => (
              <option
                key={patient.id}
                value={patient.id}
                disabled={!patient.is_active}
              >
                {patient.first_name}{" "}
                {patient.last_name} - DNI{" "}
                {patient.dni}
              </option>
            ))}
          </select>

          {!selectedPatientId && (
            <small className="text-muted">
              Seleccione al paciente que será
              atendido.
            </small>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border" />

          <p className="mt-2">
            Cargando historia clínica...
          </p>
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">
          <p>
            {queryError
              ? queryError.message
              : "No se pudo cargar la información."}
          </p>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() =>
              refetchMedicalRecords()
            }
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {!isLoading &&
        !isError &&
        selectedPatient && (
          <div className="card">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">
                  {selectedPatient.first_name}{" "}
                  {selectedPatient.last_name}
                </h5>

                <small className="text-muted">
                  DNI: {selectedPatient.dni}
                </small>
              </div>

              {selectedMedicalRecord ? (
                <span className="badge text-bg-success">
                  Historia registrada
                </span>
              ) : (
                <span className="badge text-bg-warning">
                  Sin historia clínica
                </span>
              )}
            </div>

            <div className="card-body">
              <MedicalRecordForm
                patientId={selectedPatient.id}
                medicalRecord={
                  selectedMedicalRecord
                }
                isSaving={
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                onSave={saveMedicalRecord}
              />
            </div>

            {selectedMedicalRecord && (
              <div className="card-footer bg-white d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={continueToTreatment}
                >
                  Continuar a tratamiento sugerido
                </button>
              </div>
            )}
          </div>
        )}

      {!isLoading &&
        !isError &&
        !selectedPatientId && (
          <div className="alert alert-info">
            Seleccione un paciente para consultar o
            crear su historia clínica.
          </div>
        )}
    </div>
  );
}