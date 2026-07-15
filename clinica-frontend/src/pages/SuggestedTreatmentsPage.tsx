import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import SuggestedTreatmentModal from "../components/suggestedTreatments/SuggestedTreatmentModal";

import {
  useSuggestedTreatments,
} from "../hooks/useSuggestedTreatments";

import type {
  SuggestedTreatment,
  SuggestedTreatmentPayload,
  TreatmentStatus,
} from "../types/suggestedTreatment";


function getTreatmentStatusText(
  status: TreatmentStatus,
): string {
  const statusTexts:
    Record<TreatmentStatus, string> = {
      Suggested: "Sugerido",
      Budgeted: "Presupuestado",
      "In Progress": "En progreso",
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
      Suggested:
        "text-bg-info",

      Budgeted:
        "text-bg-primary",

      "In Progress":
        "text-bg-warning",

      Finished:
        "text-bg-success",

      Cancelled:
        "text-bg-danger",
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


export default function SuggestedTreatmentsPage() {
  const [searchParams] =
    useSearchParams();

  /*
   * La creación de un tratamiento debe
   * abrirse desde una historia clínica:
   *
   * /suggested-treatments?medical_record=3
   */
  const medicalRecordId =
    parsePositiveId(
      searchParams.get(
        "medical_record",
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


  function findProcedure(
    procedureId:
      number | null,
  ) {
    if (procedureId === null) {
      return undefined;
    }

    return procedures.find(
      (procedure) =>
        procedure.id ===
        procedureId,
    );
  }


  function findSpecialist(
    specialistId: number,
  ) {
    return specialists.find(
      (specialist) =>
        specialist.id ===
        specialistId,
    );
  }


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
        "Para crear un tratamiento debe ingresar desde la historia clínica del paciente.",
      );

      return;
    }

    setSelectedTreatment(
      null,
    );

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

    setSelectedTreatment(
      null,
    );
  }


  const treatmentsToDisplay =
    useMemo(() => {
      /*
       * Cuando se abre desde una historia
       * clínica, muestra solo sus tratamientos.
       *
       * Cuando se abre sin parámetro, muestra
       * todos los tratamientos disponibles.
       */
      if (!medicalRecordId) {
        return treatments;
      }

      return treatments.filter(
        (treatment) =>
          treatment.medical_record ===
          medicalRecordId,
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
            findProcedure(
              treatment.procedure,
            );

          const specialist =
            findSpecialist(
              treatment.specialist,
            );

          const searchableText = `
            Historia clínica ${treatment.medical_record}
            ${procedure?.name ?? ""}
            ${procedure?.description ?? ""}
            ${specialist?.first_name ?? ""}
            ${specialist?.last_name ?? ""}
            ${specialist?.license_number ?? ""}
            ${treatment.tooth_code ?? ""}
            ${treatment.quantity}
            ${treatment.notes ?? ""}
            ${getTreatmentStatusText(
              treatment.treatment_status,
            )}
          `.toLowerCase();

          return searchableText
            .includes(search);
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
      ?.medical_record ??
    medicalRecordId;


  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            Tratamientos sugeridos
          </h2>

          <p className="text-muted mb-0">
            {medicalRecordId
              ? `Tratamientos de la historia clínica #${medicalRecordId}.`
              : "Consulta general de tratamientos registrados."}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          Nuevo tratamiento
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

      {!medicalRecordId && (
        <div className="alert alert-info">
          Puede consultar los tratamientos,
          pero para registrar uno nuevo debe
          ingresar desde la historia clínica
          correspondiente.
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
                placeholder="Procedimiento, especialista, pieza dental, notas o estado"
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
                {queryError
                  instanceof Error
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
            filteredTreatments
              .length === 0 && (
              <div className="alert alert-info mb-0">
                No existen tratamientos
                sugeridos que coincidan con
                la búsqueda.
              </div>
            )}

          {!isLoading &&
            !isError &&
            filteredTreatments
              .length > 0 && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>
                        Historia clínica
                      </th>

                      <th>
                        Procedimiento
                      </th>

                      <th>
                        Especialista
                      </th>

                      <th>
                        Pieza
                      </th>

                      <th>
                        Cantidad
                      </th>

                      <th>
                        Notas
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
                          findProcedure(
                            treatment.procedure,
                          );

                        const specialist =
                          findSpecialist(
                            treatment.specialist,
                          );

                        return (
                          <tr
                            key={
                              treatment.id
                            }
                          >
                            <td>
                              #
                              {
                                treatment
                                  .medical_record
                              }
                            </td>

                            <td>
                              {procedure ? (
                                <>
                                  <strong>
                                    {
                                      procedure
                                        .name
                                    }
                                  </strong>

                                  <div>
                                    <small className="text-muted">
                                      S/{" "}
                                      {
                                        procedure
                                          .price
                                      }
                                    </small>
                                  </div>
                                </>
                              ) : (
                                <span className="text-muted">
                                  Procedimiento no encontrado
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
                                .tooth_code ||
                                "General"}
                            </td>

                            <td>
                              {
                                treatment
                                  .quantity
                              }
                            </td>

                            <td>
                              {treatment.notes
                                ? treatment.notes
                                : "Sin notas"}
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
            onSave={
              saveTreatment
            }
          />
        )}
    </div>
  );
}