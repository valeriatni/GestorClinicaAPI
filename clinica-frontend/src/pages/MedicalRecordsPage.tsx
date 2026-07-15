import {
  useEffect,
  useMemo,
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
  MedicalRecord,
  MedicalRecordPayload,
  MedicalRecordPatientRelation,
} from "../types/medicalRecord";


function getPatientId(
  patient:
    MedicalRecordPatientRelation,
): number {
  return typeof patient ===
    "number"
    ? patient
    : patient.id;
}


export default function MedicalRecordsPage() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const patientFromUrl =
    searchParams.get(
      "patient",
    );

  const appointmentFromUrl =
    searchParams.get(
      "appointment",
    );

  const [
    selectedPatientId,
    setSelectedPatientId,
  ] = useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    lastSavedRecord,
    setLastSavedRecord,
  ] = useState<
    MedicalRecord | null
  >(null);


  const {
    medicalRecords,
    patients,
    isLoading,
    isError,
    queryError,
    refetchMedicalRecords,
    createMutation,
    updateMutation,
    reactivateMutation,
  } = useMedicalRecords();


  useEffect(() => {
    if (
      !patientFromUrl ||
      patients.length === 0
    ) {
      return;
    }

    const patientId =
      Number(patientFromUrl);

    const patientExists =
      patients.some(
        (patient) =>
          patient.id ===
            patientId &&
          patient.is_active &&
          !patient.is_deleted,
      );

    if (patientExists) {
      setSelectedPatientId(
        String(patientId),
      );

      return;
    }

    setErrorMessage(
      "El paciente seleccionado no existe, está desactivado o fue eliminado.",
    );
  }, [
    patientFromUrl,
    patients,
  ]);


  useEffect(() => {
    setLastSavedRecord(null);
  }, [selectedPatientId]);


  const activePatients =
    useMemo(
      () =>
        patients
          .filter(
            (patient) =>
              patient.is_active &&
              !patient.is_deleted,
          )
          .filter(
            (patient) => {
              const search =
                searchInput
                  .trim()
                  .toLowerCase();

              if (!search) {
                return true;
              }

              const searchableText = `
                ${patient.first_name}
                ${patient.last_name}
                ${patient.dni}
                ${patient.phone ?? ""}
                ${patient.email ?? ""}
              `.toLowerCase();

              return searchableText.includes(
                search,
              );
            },
          )
          .sort(
            (
              firstPatient,
              secondPatient,
            ) =>
              `${firstPatient.last_name} ${firstPatient.first_name}`
                .localeCompare(
                  `${secondPatient.last_name} ${secondPatient.first_name}`,
                ),
          ),
      [
        patients,
        searchInput,
      ],
    );


  const selectedPatient =
    patients.find(
      (patient) =>
        patient.id ===
        Number(
          selectedPatientId,
        ),
    );


  const storedMedicalRecord =
    medicalRecords.find(
      (medicalRecord) =>
        getPatientId(
          medicalRecord.patient,
        ) ===
        Number(
          selectedPatientId,
        ),
    ) ?? null;


  const selectedMedicalRecord =
    lastSavedRecord ??
    storedMedicalRecord;


  async function saveMedicalRecord(
    medicalRecordData:
      MedicalRecordPayload,
  ) {
    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedPatient) {
      throw new Error(
        "Debe seleccionar un paciente.",
      );
    }

    if (
      !selectedPatient.is_active ||
      selectedPatient.is_deleted
    ) {
      throw new Error(
        "El paciente no está disponible para modificar su historia clínica.",
      );
    }

    if (
      selectedMedicalRecord &&
      !selectedMedicalRecord.is_active
    ) {
      throw new Error(
        "La historia clínica está archivada. Debe reactivarla antes de modificarla.",
      );
    }

    let savedRecord:
      MedicalRecord;

    if (selectedMedicalRecord) {
      savedRecord =
        await updateMutation
          .mutateAsync({
            id:
              selectedMedicalRecord.id,

            medicalRecord:
              medicalRecordData,
          });

      setSuccessMessage(
        "La historia clínica se actualizó correctamente.",
      );
    } else {
      savedRecord =
        await createMutation
          .mutateAsync(
            medicalRecordData,
          );

      setSuccessMessage(
        "La historia clínica se creó correctamente. Ya puede continuar al tratamiento sugerido.",
      );
    }

    setLastSavedRecord(
      savedRecord,
    );

    await refetchMedicalRecords();
  }


  async function reactivateRecord() {
    if (!selectedMedicalRecord) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    try {
      const reactivatedRecord =
        await reactivateMutation
          .mutateAsync(
            selectedMedicalRecord.id,
          );

      setLastSavedRecord(
        reactivatedRecord,
      );

      setSuccessMessage(
        "La historia clínica fue reactivada.",
      );

      await refetchMedicalRecords();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo reactivar la historia clínica.",
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

    if (
      !selectedMedicalRecord.is_active
    ) {
      setErrorMessage(
        "La historia clínica está archivada. Debe reactivarla antes de registrar tratamientos.",
      );

      return;
    }

    const appointmentParameter =
      appointmentFromUrl
        ? `&appointment=${appointmentFromUrl}`
        : "";

    navigate(
      `/suggested-treatments?patient=${selectedPatient.id}` +
        `&medical_record=${selectedMedicalRecord.id}` +
        `${appointmentParameter}`,
    );
  }


  function goBack() {
    if (appointmentFromUrl) {
      navigate(
        "/my-appointments",
      );

      return;
    }

    navigate(-1);
  }


  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            Historias clínicas
          </h2>

          <p className="text-muted mb-0">
            Consulte, cree o actualice los antecedentes clínicos del paciente y continúe al tratamiento sugerido.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={goBack}
        >
          {appointmentFromUrl
            ? "Volver a mis citas"
            : "Volver"}
        </button>
      </div>

      {appointmentFromUrl && (
        <div className="alert alert-info">
          Atención correspondiente a la cita número{" "}
          <strong>
            {appointmentFromUrl}
          </strong>
          . Primero revise la historia clínica y luego continúe al tratamiento sugerido.
        </div>
      )}

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
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">
                Buscar paciente
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Nombre, DNI, teléfono o correo"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                disabled={isLoading}
              />
            </div>

            <div className="col-md-8">
              <label className="form-label">
                Paciente *
              </label>

              <select
                className="form-select"
                value={
                  selectedPatientId
                }
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

                {activePatients.map(
                  (patient) => (
                    <option
                      key={patient.id}
                      value={patient.id}
                    >
                      {patient.first_name}{" "}
                      {patient.last_name}
                      {" - DNI "}
                      {patient.dni}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border" />

          <p className="mt-2">
            Cargando historias clínicas...
          </p>
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">
          <p>
            {queryError instanceof Error
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
                  DNI:{" "}
                  {selectedPatient.dni}
                </small>
              </div>

              {selectedMedicalRecord ? (
                selectedMedicalRecord.is_active ? (
                  <span className="badge text-bg-success">
                    Historia registrada
                  </span>
                ) : (
                  <span className="badge text-bg-secondary">
                    Historia archivada
                  </span>
                )
              ) : (
                <span className="badge text-bg-warning">
                  Sin historia clínica
                </span>
              )}
            </div>

            <div className="card-body">
              {selectedMedicalRecord &&
                !selectedMedicalRecord.is_active ? (
                <div className="alert alert-warning mb-0">
                  <p>
                    Esta historia clínica está archivada.
                  </p>

                  {selectedMedicalRecord.inactive_reason && (
                    <p>
                      <strong>
                        Motivo:
                      </strong>{" "}
                      {selectedMedicalRecord.inactive_reason}
                    </p>
                  )}

                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={
                      reactivateRecord
                    }
                    disabled={
                      reactivateMutation.isPending
                    }
                  >
                    {reactivateMutation.isPending
                      ? "Reactivando..."
                      : "Reactivar historia clínica"}
                  </button>
                </div>
              ) : (
                <MedicalRecordForm
                  patientId={
                    selectedPatient.id
                  }
                  medicalRecord={
                    selectedMedicalRecord
                  }
                  isSaving={
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                  onSave={
                    saveMedicalRecord
                  }
                />
              )}
            </div>

            {selectedMedicalRecord &&
              selectedMedicalRecord.is_active && (
                <div className="card-footer bg-white d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={
                      continueToTreatment
                    }
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
            Seleccione un paciente para consultar o crear su historia clínica.
          </div>
        )}
    </div>
  );
}
