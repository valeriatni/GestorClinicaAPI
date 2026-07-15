import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  updateSuggestedTreatment,
} from "../api/suggestedTreatmentApi";

import BudgetModal from "../components/budgets/BudgetModal";

import {
  useBudgets,
} from "../hooks/useBudgets";

import type {
  Budget,
  BudgetPayload,
  BudgetStatus,
} from "../types/budget";

function getStatusText(
  status: BudgetStatus,
): string {
  const statuses: Record<
    BudgetStatus,
    string
  > = {
    Draft: "Borrador",
    Approved: "Aprobado",
    Closed: "Cerrado",
    Cancelled: "Cancelado",
  };

  return statuses[status];
}

function getStatusClass(
  status: BudgetStatus,
): string {
  const classes: Record<
    BudgetStatus,
    string
  > = {
    Draft: "text-bg-warning",
    Approved: "text-bg-primary",
    Closed: "text-bg-success",
    Cancelled: "text-bg-danger",
  };

  return classes[status];
}

export default function BudgetsPage() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const patientFromUrl =
    searchParams.get("patient");

  const treatmentFromUrl =
    searchParams.get("treatment");

  const [
    selectedPatientId,
    setSelectedPatientId,
  ] = useState("");

  const [
    initialTreatmentId,
    setInitialTreatmentId,
  ] = useState<number | null>(null);

  const [showModal, setShowModal] =
    useState(false);

  const [
    selectedBudget,
    setSelectedBudget,
  ] = useState<Budget | null>(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const {
    budgets,
    patients,
    medicalRecords,
    treatments,
    procedures,
    isLoading,
    isError,
    queryError,
    refetchBudgets,
    createMutation,
    updateMutation,
  } = useBudgets();

  useEffect(() => {
    if (
      patients.length === 0 ||
      medicalRecords.length === 0
    ) {
      return;
    }

    if (treatmentFromUrl) {
      const treatmentId = Number(
        treatmentFromUrl,
      );

      const treatment =
        treatments.find(
          (currentTreatment) =>
            currentTreatment.id ===
            treatmentId,
        );

      const medicalRecord =
        medicalRecords.find(
          (record) =>
            record.id ===
            treatment?.medical_record,
        );

      const patient =
        patients.find(
          (currentPatient) =>
            currentPatient.id ===
            medicalRecord?.patient,
        );

      if (
        treatment &&
        medicalRecord &&
        patient &&
        patient.is_active
      ) {
        setSelectedPatientId(
          String(patient.id),
        );

        setInitialTreatmentId(
          treatment.id,
        );

        setSelectedBudget(null);
        setShowModal(true);
      } else {
        setErrorMessage(
          "No se encontró el tratamiento o el paciente seleccionado.",
        );
      }

      setSearchParams(
        {},
        { replace: true },
      );

      return;
    }

    if (patientFromUrl) {
      const patientId = Number(
        patientFromUrl,
      );

      const patient =
        patients.find(
          (currentPatient) =>
            currentPatient.id ===
            patientId,
        );

      if (patient?.is_active) {
        setSelectedPatientId(
          String(patientId),
        );
      } else {
        setErrorMessage(
          "El paciente seleccionado no existe o está inactivo.",
        );
      }

      setSearchParams(
        {},
        { replace: true },
      );
    }
  }, [
    patientFromUrl,
    treatmentFromUrl,
    patients,
    medicalRecords,
    treatments,
    setSearchParams,
  ]);

  const selectedPatient =
    patients.find(
      (patient) =>
        patient.id ===
        Number(selectedPatientId),
    );

  const patientBudgets =
    budgets.filter(
      (budget) =>
        budget.patient ===
        Number(selectedPatientId),
    );

  const patientMedicalRecordIds =
    medicalRecords
      .filter(
        (record) =>
          record.patient ===
          Number(selectedPatientId),
      )
      .map((record) => record.id);

  const availableTreatments =
    treatments.filter(
      (treatment) =>
        patientMedicalRecordIds.includes(
          treatment.medical_record,
        ) &&
        treatment.treatment_status ===
          "Suggested",
    );

  function findTreatment(
    treatmentId: number,
  ) {
    return treatments.find(
      (treatment) =>
        treatment.id === treatmentId,
    );
  }

  function findProcedure(
    treatmentId: number,
  ) {
    const treatment =
      findTreatment(treatmentId);

    return procedures.find(
      (procedure) =>
        procedure.id ===
        treatment?.procedure,
    );
  }

  function openCreateModal() {
    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedPatient) {
      setErrorMessage(
        "Debe seleccionar un paciente antes de crear el presupuesto.",
      );

      return;
    }

    if (!selectedPatient.is_active) {
      setErrorMessage(
        "El paciente está inactivo y no puede recibir nuevos presupuestos.",
      );

      return;
    }

    if (
      availableTreatments.length === 0
    ) {
      setErrorMessage(
        "El paciente no tiene tratamientos sugeridos pendientes de presupuesto.",
      );

      return;
    }

    setSelectedBudget(null);
    setInitialTreatmentId(null);
    setShowModal(true);
  }

  function openEditModal(
    budget: Budget,
  ) {
    if (
      budget.budget_status === "Closed"
    ) {
      setErrorMessage(
        "Un presupuesto cerrado ya no puede editarse.",
      );

      return;
    }

    setSelectedBudget(budget);
    setInitialTreatmentId(
      budget.suggested_treatment,
    );
    setShowModal(true);
    setSuccessMessage("");
    setErrorMessage("");
  }

  async function saveBudget(
    budgetData: BudgetPayload,
  ) {
    if (!selectedPatient) {
      throw new Error(
        "Debe seleccionar un paciente.",
      );
    }

    if (
      budgetData.patient !==
      selectedPatient.id
    ) {
      throw new Error(
        "El presupuesto no pertenece al paciente seleccionado.",
      );
    }

    if (selectedBudget) {
      await updateMutation.mutateAsync({
        id: selectedBudget.id,
        budget: budgetData,
      });

      setSuccessMessage(
        "El presupuesto se actualizó correctamente.",
      );
    } else {
      await createMutation.mutateAsync(
        budgetData,
      );

      await updateSuggestedTreatment(
        budgetData.suggested_treatment,
        {
          treatment_status: "Budgeted",
        },
      );

      setSuccessMessage(
        "El presupuesto se creó correctamente. El tratamiento ahora está presupuestado.",
      );
    }

    setShowModal(false);
    setSelectedBudget(null);
    setInitialTreatmentId(null);
  }

  async function changeBudgetStatus(
    budget: Budget,
    newStatus: BudgetStatus,
  ) {
    setSuccessMessage("");
    setErrorMessage("");

    if (
      budget.budget_status === "Closed"
    ) {
      setErrorMessage(
        "El presupuesto está cerrado y ya no puede cambiarse.",
      );

      return;
    }

    if (newStatus === "Cancelled") {
      const confirmed =
        window.confirm(
          "¿Desea cancelar este presupuesto?",
        );

      if (!confirmed) {
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        id: budget.id,
        budget: {
          budget_status: newStatus,
        },
      });

      if (newStatus === "Cancelled") {
        await updateSuggestedTreatment(
          budget.suggested_treatment,
          {
            treatment_status:
              "Suggested",
          },
        );
      }

      setSuccessMessage(
        `El presupuesto ahora está: ${getStatusText(
          newStatus,
        )}.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el presupuesto.",
      );
    }
  }

  function goToPayments(
    budget: Budget,
  ) {
    if (
      budget.budget_status ===
      "Cancelled"
    ) {
      setErrorMessage(
        "No se pueden registrar pagos para un presupuesto cancelado.",
      );

      return;
    }

    navigate(
      `/payments?patient=${budget.patient}&budget=${budget.id}`,
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Presupuestos</h2>

          <p className="text-muted mb-0">
            Cree presupuestos a partir de los
            tratamientos sugeridos.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          Nuevo presupuesto
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
              Seleccione el paciente para
              consultar sus presupuestos.
            </small>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border" />

          <p className="mt-2">
            Cargando presupuestos...
          </p>
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">
          <p>
            {queryError
              ? queryError.message
              : "No se pudieron cargar los presupuestos."}
          </p>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() =>
              refetchBudgets()
            }
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {!isLoading &&
        !isError &&
        !selectedPatient && (
          <div className="alert alert-info">
            Seleccione un paciente para ver
            sus tratamientos y presupuestos.
          </div>
        )}

      {!isLoading &&
        !isError &&
        selectedPatient && (
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-1">
                {selectedPatient.first_name}{" "}
                {selectedPatient.last_name}
              </h5>

              <small className="text-muted">
                DNI: {selectedPatient.dni}
              </small>
            </div>

            <div className="card-body">
              {patientBudgets.length ===
                0 && (
                <div className="alert alert-info">
                  Este paciente todavía no
                  tiene presupuestos registrados.
                </div>
              )}

              {patientBudgets.length >
                0 && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Tratamiento</th>
                        <th>Precio bruto</th>
                        <th>Descuento</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {patientBudgets.map(
                        (budget) => {
                          const procedure =
                            findProcedure(
                              budget.suggested_treatment,
                            );

                          return (
                            <tr
                              key={budget.id}
                            >
                              <td>
                                {procedure?.name ??
                                  "Tratamiento no encontrado"}
                              </td>

                              <td>
                                S/{" "}
                                {
                                  budget.gross_total
                                }
                              </td>

                              <td>
                                S/{" "}
                                {
                                  budget.discount
                                }
                              </td>

                              <td>
                                <strong>
                                  S/{" "}
                                  {
                                    budget.net_total
                                  }
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={`badge ${getStatusClass(
                                    budget.budget_status,
                                  )}`}
                                >
                                  {getStatusText(
                                    budget.budget_status,
                                  )}
                                </span>
                              </td>

                              <td>
                                <div className="d-flex gap-2 flex-wrap">
                                  {budget.budget_status ===
                                    "Draft" && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() =>
                                        changeBudgetStatus(
                                          budget,
                                          "Approved",
                                        )
                                      }
                                      disabled={
                                        updateMutation.isPending
                                      }
                                    >
                                      Aprobar
                                    </button>
                                  )}

                                  {budget.budget_status !==
                                    "Closed" &&
                                    budget.budget_status !==
                                      "Cancelled" && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() =>
                                          openEditModal(
                                            budget,
                                          )
                                        }
                                      >
                                        Editar
                                      </button>
                                    )}

                                  {(budget.budget_status ===
                                    "Draft" ||
                                    budget.budget_status ===
                                      "Approved") && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success"
                                      onClick={() =>
                                        goToPayments(
                                          budget,
                                        )
                                      }
                                    >
                                      Registrar pago
                                    </button>
                                  )}

                                  {budget.budget_status !==
                                    "Closed" &&
                                    budget.budget_status !==
                                      "Cancelled" && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() =>
                                          changeBudgetStatus(
                                            budget,
                                            "Cancelled",
                                          )
                                        }
                                        disabled={
                                          updateMutation.isPending
                                        }
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                </div>
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
        )}

      {showModal &&
        selectedPatient && (
          <BudgetModal
            patientId={
              selectedPatient.id
            }
            initialTreatmentId={
              initialTreatmentId
            }
            budget={selectedBudget}
            budgets={budgets}
            medicalRecords={
              medicalRecords
            }
            treatments={treatments}
            procedures={procedures}
            isSaving={
              createMutation.isPending ||
              updateMutation.isPending
            }
            onClose={() => {
              setShowModal(false);
              setSelectedBudget(null);
              setInitialTreatmentId(null);
            }}
            onSave={saveBudget}
          />
        )}
    </div>
  );
}