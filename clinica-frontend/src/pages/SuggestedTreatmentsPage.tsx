import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import SuggestedTreatmentModal from "../components/suggestedTreatments/SuggestedTreatmentModal";

import {
  useSuggestedTreatments,
} from "../hooks/useSuggestedTreatments";

import type {
  ProcedureOption,
  SuggestedTreatment,
  SuggestedTreatmentPayload,
  TreatmentSpecialist,
  TreatmentStatus,
} from "../types/suggestedTreatment";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


function getTreatmentStatusText(
  status: TreatmentStatus,
): string {
  const statusTexts:
    Record<TreatmentStatus, string> = {
      Suggested: "Sugerido",
      Budgeted: "Presupuestado",
      "In Progress": "En tratamiento",
      Finished: "Finalizado",
      Cancelled: "Cancelado",
    };

  return statusTexts[status];
}


function getTreatmentStatusClass(
  status: TreatmentStatus,
): string {
  const statusClasses:
    Record<TreatmentStatus, string> = {
      Suggested: "text-bg-info",
      Budgeted: "text-bg-primary",
      "In Progress":
        "text-bg-warning",
      Finished: "text-bg-success",
      Cancelled: "text-bg-danger",
    };

  return statusClasses[status];
}


function parsePositiveId(
  value: string | null,
): number | null {
  if (!value) {
    return null;
  }

  const parsedValue =
    Number(value);

  if (
    !Number.isInteger(
      parsedValue,
    ) ||
    parsedValue <= 0
  ) {
    return null;
  }

  return parsedValue;
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


function getProcedure(
  treatment: SuggestedTreatment,
  procedures: ProcedureOption[],
): ProcedureOption | undefined {
  if (
    treatment.procedure &&
    typeof treatment.procedure ===
      "object"
  ) {
    return treatment.procedure;
  }

  const procedureId =
    getRelationId(
      treatment.procedure,
    );

  if (procedureId === null) {
    return undefined;
  }

  return procedures.find(
    (procedure) =>
      procedure.id ===
      procedureId,
  );
}


function getSpecialist(
  treatment: SuggestedTreatment,
  specialists:
    TreatmentSpecialist[],
): TreatmentSpecialist | undefined {
  if (
    typeof treatment.specialist ===
    "object"
  ) {
    return treatment.specialist;
  }

  const specialistId =
    getRelationId(
      treatment.specialist,
    );

  if (specialistId === null) {
    return undefined;
  }

  return specialists.find(
    (specialist) =>
      specialist.id ===
      specialistId,
  );
}


function getAuthHeaders() {
  const token =
    localStorage.getItem(
      "access_token",
    );

  return {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}


export default function SuggestedTreatmentsPage() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const medicalRecordId =
    parsePositiveId(
      searchParams.get(
        "medical_record",
      ),
    );

  const patientId =
    parsePositiveId(
      searchParams.get(
        "patient",
      ),
    );

  const appointmentId =
    parsePositiveId(
      searchParams.get(
        "appointment",
      ),
    );

  const {
    treatments,
    procedures,
    specialists,
    isLoading,
    isError,
    queryError,
    refetchTreatments,
    createMutation,
    updateMutation,
  } = useSuggestedTreatments();


  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    selectedTreatment,
    setSelectedTreatment,
  ] = useState<
    SuggestedTreatment | null
  >(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    isFinishing,
    setIsFinishing,
  ] = useState(false);


  function clearMessages() {
    setSuccessMessage("");
    setErrorMessage("");
  }


  function handleSearch(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSearch(
      searchInput
        .trim()
        .toLowerCase(),
    );
  }


  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }


  function openCreateModal() {
    clearMessages();

    if (!medicalRecordId) {
      setErrorMessage(
        "Para registrar un tratamiento debe ingresar desde la historia clínica del paciente.",
      );

      return;
    }

    setSelectedTreatment(null);
    setShowModal(true);
  }


  function openEditModal(
    treatment:
      SuggestedTreatment,
  ) {
    clearMessages();

    setSelectedTreatment(
      treatment,
    );

    setShowModal(true);
  }


  async function saveTreatment(
    treatmentData:
      SuggestedTreatmentPayload,
  ): Promise<void> {
    clearMessages();

    if (selectedTreatment) {
      await updateMutation
        .mutateAsync({
          id:
            selectedTreatment.id,

          treatment:
            treatmentData,
        });

      setSuccessMessage(
        "El tratamiento sugerido se actualizó correctamente.",
      );
    } else {
      await createMutation
        .mutateAsync(
          treatmentData,
        );

      setSuccessMessage(
        "El tratamiento sugerido se registró correctamente.",
      );
    }

    setShowModal(false);
    setSelectedTreatment(null);
  }


  const treatmentsToDisplay =
    useMemo(() => {
      if (!medicalRecordId) {
        return treatments;
      }

      return treatments.filter(
        (treatment) =>
          getRelationId(
            treatment.medical_record,
          ) === medicalRecordId,
      );
    }, [
      treatments,
      medicalRecordId,
    ]);


  const filteredTreatments =
    useMemo(() => {
      if (!search) {
        return treatmentsToDisplay;
      }

      return treatmentsToDisplay.filter(
        (treatment) => {
          const procedure =
            getProcedure(
              treatment,
              procedures,
            );

          const specialist =
            getSpecialist(
              treatment,
              specialists,
            );

          const searchableText = `
            Historia clínica ${
              getRelationId(
                treatment.medical_record,
              ) ?? ""
            }
            ${treatment.diagnosis}
            ${
              treatment.clinical_observations ??
              ""
            }
            ${treatment.diagnosis_date}
            ${procedure?.name ?? ""}
            ${procedure?.description ?? ""}
            ${specialist?.first_name ?? ""}
            ${specialist?.last_name ?? ""}
            ${
              specialist?.license_number ??
              ""
            }
            ${getTreatmentStatusText(
              treatment.treatment_status,
            )}
          `.toLowerCase();

          return searchableText.includes(
            search,
          );
        },
      );
    }, [
      treatmentsToDisplay,
      search,
      procedures,
      specialists,
    ]);


  const modalMedicalRecordId =
    selectedTreatment
      ? getRelationId(
          selectedTreatment
            .medical_record,
        )
      : medicalRecordId;


  async function finishAttention() {
    clearMessages();

    if (!appointmentId) {
      setErrorMessage(
        "No se encontró la cita que se está atendiendo.",
      );

      return;
    }

    if (!medicalRecordId) {
      setErrorMessage(
        "No se encontró la historia clínica.",
      );

      return;
    }

    if (
      treatmentsToDisplay.length ===
      0
    ) {
      setErrorMessage(
        "Debe registrar al menos un tratamiento sugerido antes de finalizar la atención.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        "¿Confirma que terminó la atención del paciente?",
      );

    if (!confirmed) {
      return;
    }

    setIsFinishing(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/` +
          `${appointmentId}/attend/`,
        {
          method: "PATCH",

          headers:
            getAuthHeaders(),

          body: JSON.stringify({}),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            data?.error ??
            "No se pudo finalizar la atención.",
        );
      }

      navigate(
        "/my-appointments",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo finalizar la atención.",
      );
    } finally {
      setIsFinishing(false);
    }
  }


  function returnToMedicalRecord() {
    if (patientId) {
      const appointmentParameter =
        appointmentId
          ? `&appointment=${appointmentId}`
          : "";

      navigate(
        `/medical-records?patient=${patientId}` +
          `${appointmentParameter}`,
      );

      return;
    }

    navigate("/medical-records");
  }


  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            Atención y tratamientos
          </h2>

          <p className="text-muted mb-0">
            {medicalRecordId
              ? `Tratamientos de la historia clínica #${medicalRecordId}.`
              : "Consulta general de tratamientos sugeridos."}
          </p>
        </div>

        <div className="d-flex gap-2">
          {medicalRecordId && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={
                returnToMedicalRecord
              }
            >
              Volver a historia clínica
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            Nuevo tratamiento
          </button>
        </div>
      </div>

      {appointmentId && (
        <div className="alert alert-info">
          Atención correspondiente a la
          cita número{" "}
          <strong>
            {appointmentId}
          </strong>
          .
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

      {!medicalRecordId && (
        <div className="alert alert-info">
          Puede consultar los tratamientos.
          Para registrar uno nuevo, ingrese
          desde la historia clínica del
          paciente.
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <form
            className="row g-3 align-items-end"
            onSubmit={handleSearch}
          >
            <div className="col-md-8">
              <label className="form-label">
                Buscar
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Diagnóstico, procedimiento, especialista, observaciones o estado"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="col-md-2">
              <button
                type="submit"
                className="btn btn-outline-primary w-100"
              >
                Buscar
              </button>
            </div>

            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={clearSearch}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            Lista de tratamientos
          </h5>
        </div>

        <div className="card-body">
          {isLoading && (
            <div className="text-center py-4">
              <div className="spinner-border" />

              <p className="mt-2 mb-0">
                Cargando tratamientos...
              </p>
            </div>
          )}

          {isError && (
            <div className="alert alert-danger">
              <p className="mb-3">
                {queryError instanceof Error
                  ? queryError.message
                  : "No se pudieron cargar los tratamientos sugeridos."}
              </p>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() =>
                  refetchTreatments()
                }
              >
                Intentar nuevamente
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            filteredTreatments.length ===
              0 && (
              <div className="alert alert-info mb-0">
                No existen tratamientos
                sugeridos que coincidan con
                la búsqueda.
              </div>
            )}

          {!isLoading &&
            !isError &&
            filteredTreatments.length >
              0 && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>
                        Historia clínica
                      </th>

                      <th>
                        Fecha
                      </th>

                      <th>
                        Diagnóstico
                      </th>

                      <th>
                        Procedimiento
                      </th>

                      <th>
                        Especialista
                      </th>

                      <th>
                        Observaciones
                      </th>

                      <th>
                        Estado
                      </th>

                      <th>
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTreatments.map(
                      (treatment) => {
                        const procedure =
                          getProcedure(
                            treatment,
                            procedures,
                          );

                        const specialist =
                          getSpecialist(
                            treatment,
                            specialists,
                          );

                        const procedurePrice =
                          procedure
                            ?.base_price ??
                          procedure?.price;

                        return (
                          <tr
                            key={
                              treatment.id
                            }
                          >
                            <td>
                              #
                              {getRelationId(
                                treatment
                                  .medical_record,
                              )}
                            </td>

                            <td>
                              {
                                treatment
                                  .diagnosis_date
                              }
                            </td>

                            <td>
                              <strong>
                                {
                                  treatment
                                    .diagnosis
                                }
                              </strong>
                            </td>

                            <td>
                              {procedure ? (
                                <>
                                  <strong>
                                    {
                                      procedure.name
                                    }
                                  </strong>

                                  {procedurePrice && (
                                    <div>
                                      <small className="text-muted">
                                        S/{" "}
                                        {
                                          procedurePrice
                                        }
                                      </small>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted">
                                  Sin procedimiento
                                </span>
                              )}
                            </td>

                            <td>
                              {specialist ? (
                                <>
                                  <strong>
                                    Dr(a).{" "}
                                    {
                                      specialist
                                        .first_name
                                    }{" "}
                                    {
                                      specialist
                                        .last_name
                                    }
                                  </strong>

                                  <div>
                                    <small className="text-muted">
                                      Registro:{" "}
                                      {
                                        specialist
                                          .license_number
                                      }
                                    </small>
                                  </div>
                                </>
                              ) : (
                                <span className="text-muted">
                                  Especialista no encontrado
                                </span>
                              )}
                            </td>

                            <td>
                              {treatment
                                .clinical_observations ||
                                "Sin observaciones"}
                            </td>

                            <td>
                              <span
                                className={
                                  `badge ${getTreatmentStatusClass(
                                    treatment
                                      .treatment_status,
                                  )}`
                                }
                              >
                                {getTreatmentStatusText(
                                  treatment
                                    .treatment_status,
                                )}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  openEditModal(
                                    treatment,
                                  )
                                }
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {appointmentId &&
          medicalRecordId && (
            <div className="card-footer bg-white d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-success"
                onClick={
                  finishAttention
                }
                disabled={
                  treatmentsToDisplay
                    .length === 0 ||
                  createMutation
                    .isPending ||
                  updateMutation
                    .isPending ||
                  isFinishing
                }
                title={
                  treatmentsToDisplay
                    .length === 0
                    ? "Primero registre al menos un tratamiento sugerido."
                    : undefined
                }
              >
                {isFinishing
                  ? "Finalizando..."
                  : "Finalizar atención"}
              </button>
            </div>
          )}
      </div>

      {showModal &&
        modalMedicalRecordId && (
          <SuggestedTreatmentModal
            medicalRecordId={
              modalMedicalRecordId
            }
            treatment={
              selectedTreatment
            }
            treatments={
              treatments
            }
            procedures={
              procedures
            }
            specialists={
              specialists
            }
            isSaving={
              createMutation.isPending ||
              updateMutation.isPending
            }
            onClose={() => {
              setShowModal(false);
              setSelectedTreatment(
                null,
              );
            }}
            onSave={saveTreatment}
          />
        )}
    </div>
  );
}
