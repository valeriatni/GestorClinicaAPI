import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  Budget,
  BudgetPayload,
  BudgetStatus,
} from "../../types/budget";

import type {
  MedicalRecord,
} from "../../types/medicalRecord";

import type {
  ProcedureOption,
  SuggestedTreatment,
} from "../../types/suggestedTreatment";


interface BudgetModalProps {
  patientId: number;
  initialTreatmentId: number | null;
  budget: Budget | null;
  budgets: Budget[];
  medicalRecords: MedicalRecord[];
  treatments: SuggestedTreatment[];
  procedures: ProcedureOption[];
  isSaving: boolean;
  onClose: () => void;

  onSave: (
    budget: BudgetPayload,
  ) => Promise<void>;
}


interface BudgetForm {
  suggested_treatment: string;
  gross_total: string;
  discount: string;
  budget_status: BudgetStatus;
}


interface FormErrors {
  suggested_treatment?: string;
  gross_total?: string;
  discount?: string;
  net_total?: string;
  general?: string;
}


const emptyForm: BudgetForm = {
  suggested_treatment: "",
  gross_total: "",
  discount: "0.00",
  budget_status: "Draft",
};


function getRelationId(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  ) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "id" in value
  ) {
    const id = Number(
      (value as {
        id: unknown;
      }).id,
    );

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      return id;
    }
  }

  return null;
}


function calculateNetTotal(
  grossTotal: string,
  discount: string,
): number {
  const gross = Number(grossTotal);
  const discountValue =
    Number(discount);

  if (
    Number.isNaN(gross) ||
    Number.isNaN(
      discountValue,
    )
  ) {
    return 0;
  }

  return gross - discountValue;
}


function getProcedureFromTreatment(
  treatment:
    | SuggestedTreatment
    | undefined,
  procedures: ProcedureOption[],
): ProcedureOption | undefined {
  if (!treatment?.procedure) {
    return undefined;
  }

  if (
    typeof treatment.procedure ===
    "object"
  ) {
    return treatment.procedure;
  }

  return procedures.find(
    (procedure) =>
      procedure.id ===
      treatment.procedure,
  );
}


function getProcedurePrice(
  procedure:
    | ProcedureOption
    | undefined,
): number | null {
  if (!procedure) {
    return null;
  }

  const rawPrice =
    procedure.base_price ??
    procedure.price;

  if (
    rawPrice === undefined ||
    rawPrice === null ||
    rawPrice === ""
  ) {
    return null;
  }

  const price = Number(rawPrice);

  return Number.isNaN(price)
    ? null
    : price;
}


export default function BudgetModal({
  patientId,
  initialTreatmentId,
  budget,
  budgets,
  medicalRecords,
  treatments,
  procedures,
  isSaving,
  onClose,
  onSave,
}: BudgetModalProps) {
  const [
    form,
    setForm,
  ] = useState<BudgetForm>(
    emptyForm,
  );

  const [
    errors,
    setErrors,
  ] = useState<FormErrors>({});


  const patientRecordIds =
    useMemo(
      () =>
        medicalRecords
          .filter(
            (record) =>
              getRelationId(
                record.patient,
              ) === patientId,
          )
          .map(
            (record) =>
              record.id,
          ),
      [
        medicalRecords,
        patientId,
      ],
    );


  const budgetTreatmentId =
    getRelationId(
      budget
        ?.suggested_treatment,
    );


  const patientTreatments =
    useMemo(
      () =>
        treatments.filter(
          (treatment) => {
            const medicalRecordId =
              getRelationId(
                treatment
                  .medical_record,
              );

            if (
              !medicalRecordId ||
              !patientRecordIds.includes(
                medicalRecordId,
              )
            ) {
              return false;
            }

            /*
             * Para crear:
             * solo tratamientos Suggested.
             *
             * Para editar:
             * conserva visible el tratamiento
             * ya asociado al presupuesto,
             * aunque ahora esté Budgeted.
             */
            if (budget) {
              return (
                treatment.id ===
                  budgetTreatmentId ||
                treatment
                  .treatment_status ===
                  "Suggested"
              );
            }

            return (
              treatment
                .treatment_status ===
              "Suggested"
            );
          },
        ),
      [
        treatments,
        patientRecordIds,
        budget,
        budgetTreatmentId,
      ],
    );


  useEffect(() => {
    if (budget) {
      const treatmentId =
        getRelationId(
          budget
            .suggested_treatment,
        );

      setForm({
        suggested_treatment:
          treatmentId
            ? String(
                treatmentId,
              )
            : "",

        gross_total:
          budget.gross_total,

        discount:
          budget.discount,

        budget_status:
          budget.budget_status,
      });

      setErrors({});
      return;
    }

    let initialGrossTotal = "";

    if (initialTreatmentId) {
      const initialTreatment =
        treatments.find(
          (treatment) =>
            treatment.id ===
            initialTreatmentId,
        );

      const procedure =
        getProcedureFromTreatment(
          initialTreatment,
          procedures,
        );

      const price =
        getProcedurePrice(
          procedure,
        );

      if (
        price !== null &&
        price > 0
      ) {
        initialGrossTotal =
          price.toFixed(2);
      }
    }

    setForm({
      ...emptyForm,

      suggested_treatment:
        initialTreatmentId
          ? String(
              initialTreatmentId,
            )
          : "",

      gross_total:
        initialGrossTotal,
    });

    setErrors({});
  }, [
    budget,
    initialTreatmentId,
    treatments,
    procedures,
  ]);


  function changeField(
    field: keyof BudgetForm,
    value: string,
  ) {
    setForm(
      (currentForm) => ({
        ...currentForm,
        [field]: value,
      }),
    );

    setErrors(
      (currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
        net_total: undefined,
        general: undefined,
      }),
    );
  }


  function changeTreatment(
    treatmentIdValue: string,
  ) {
    const treatmentId =
      Number(
        treatmentIdValue,
      );

    const treatment =
      treatments.find(
        (currentTreatment) =>
          currentTreatment.id ===
          treatmentId,
      );

    const procedure =
      getProcedureFromTreatment(
        treatment,
        procedures,
      );

    const price =
      getProcedurePrice(
        procedure,
      );

    const calculatedGross =
      price !== null &&
      price > 0
        ? price.toFixed(2)
        : "";

    setForm(
      (currentForm) => ({
        ...currentForm,

        suggested_treatment:
          treatmentIdValue,

        gross_total:
          calculatedGross,
      }),
    );

    setErrors(
      (currentErrors) => ({
        ...currentErrors,
        suggested_treatment:
          undefined,
        gross_total:
          undefined,
        net_total: undefined,
        general: undefined,
      }),
    );
  }


  function validateForm(): boolean {
    const newErrors:
      FormErrors = {};

    const treatmentId =
      Number(
        form
          .suggested_treatment,
      );

    const grossTotal =
      Number(
        form.gross_total,
      );

    const discount =
      Number(
        form.discount,
      );

    const netTotal =
      calculateNetTotal(
        form.gross_total,
        form.discount,
      );

    if (
      !form
        .suggested_treatment
    ) {
      newErrors
        .suggested_treatment =
        "Debe seleccionar un tratamiento sugerido.";
    } else {
      const selectedTreatment =
        patientTreatments.find(
          (treatment) =>
            treatment.id ===
            treatmentId,
        );

      if (!selectedTreatment) {
        newErrors
          .suggested_treatment =
          "El tratamiento no pertenece al paciente o ya no está disponible para presupuesto.";
      } else if (
        selectedTreatment
          .treatment_status ===
        "Cancelled"
      ) {
        newErrors
          .suggested_treatment =
          "El tratamiento está cancelado y no puede presupuestarse.";
      }
    }

    if (!form.gross_total) {
      newErrors.gross_total =
        "Debe ingresar el precio bruto.";
    } else if (
      Number.isNaN(
        grossTotal,
      )
    ) {
      newErrors.gross_total =
        "El precio bruto debe ser un número válido.";
    } else if (
      grossTotal <= 0
    ) {
      newErrors.gross_total =
        "El precio bruto debe ser mayor que cero.";
    } else if (
      grossTotal > 99999999
    ) {
      newErrors.gross_total =
        "El precio bruto es demasiado alto.";
    }

    if (!form.discount) {
      newErrors.discount =
        "Ingrese el descuento. Si no existe, coloque 0.";
    } else if (
      Number.isNaN(discount)
    ) {
      newErrors.discount =
        "El descuento debe ser un número válido.";
    } else if (
      discount < 0
    ) {
      newErrors.discount =
        "El descuento no puede ser negativo.";
    } else if (
      !Number.isNaN(
        grossTotal,
      ) &&
      discount > grossTotal
    ) {
      newErrors.discount =
        "El descuento no puede superar el precio bruto.";
    }

    if (netTotal <= 0) {
      newErrors.net_total =
        "El total final debe ser mayor que cero.";
    }

    const duplicateBudget =
      budgets.some(
        (currentBudget) =>
          currentBudget.id !==
            budget?.id &&
          getRelationId(
            currentBudget
              .suggested_treatment,
          ) === treatmentId &&
          currentBudget
            .budget_status !==
            "Cancelled",
      );

    if (duplicateBudget) {
      newErrors.general =
        "Este tratamiento sugerido ya tiene un presupuesto activo.";
    }

    setErrors(newErrors);

    return (
      Object.keys(
        newErrors,
      ).length === 0
    );
  }


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
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

    const grossTotal =
      Number(
        form.gross_total,
      );

    const discount =
      Number(
        form.discount,
      );

    const netTotal =
      grossTotal - discount;

    const budgetData:
      BudgetPayload = {
      patient:
        patientId,

      suggested_treatment:
        Number(
          form
            .suggested_treatment,
        ),

      gross_total:
        grossTotal.toFixed(2),

      discount:
        discount.toFixed(2),

      net_total:
        netTotal.toFixed(2),

      budget_status:
        form.budget_status,

      is_active:
        true,
    };

    try {
      await onSave(
        budgetData,
      );
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el presupuesto.",
      });
    }
  }


  const netTotal =
    calculateNetTotal(
      form.gross_total,
      form.discount,
    );


  const selectedTreatment =
    treatments.find(
      (treatment) =>
        treatment.id ===
        Number(
          form
            .suggested_treatment,
        ),
    );


  const selectedProcedure =
    getProcedureFromTreatment(
      selectedTreatment,
      procedures,
    );


  const selectedProcedurePrice =
    getProcedurePrice(
      selectedProcedure,
    );


  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{
          overflowY: "auto",
        }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="d-flex flex-column"
              style={{
                minHeight: 0,
              }}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  {budget
                    ? "Editar presupuesto"
                    : "Crear presupuesto"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  disabled={isSaving}
                  aria-label="Cerrar"
                />
              </div>

              <div
                className="modal-body"
                style={{
                  overflowY:
                    "auto",
                }}
              >
                {errors.general && (
                  <div className="alert alert-danger">
                    {
                      errors.general
                    }
                  </div>
                )}

                <p className="text-muted">
                  Los campos con * son
                  obligatorios.
                </p>

                <div className="row">
                  <div className="col-12 mb-3">
                    <label className="form-label">
                      Tratamiento sugerido *
                    </label>

                    <select
                      className={`form-select ${
                        errors
                          .suggested_treatment
                          ? "is-invalid"
                          : ""
                      }`}
                      value={
                        form
                          .suggested_treatment
                      }
                      onChange={(event) =>
                        changeTreatment(
                          event.target.value,
                        )
                      }
                      disabled={
                        isSaving ||
                        budget !== null
                      }
                    >
                      <option value="">
                        Seleccione un tratamiento
                      </option>

                      {patientTreatments.map(
                        (treatment) => {
                          const procedure =
                            getProcedureFromTreatment(
                              treatment,
                              procedures,
                            );

                          return (
                            <option
                              key={
                                treatment.id
                              }
                              value={
                                treatment.id
                              }
                            >
                              {procedure
                                ?.name ??
                                "Procedimiento"}
                              {" - "}
                              {
                                treatment
                                  .diagnosis
                              }
                              {" - "}
                              {
                                treatment
                                  .diagnosis_date
                              }
                            </option>
                          );
                        },
                      )}
                    </select>

                    {errors
                      .suggested_treatment && (
                      <div className="invalid-feedback">
                        {
                          errors
                            .suggested_treatment
                        }
                      </div>
                    )}
                  </div>

                  {selectedTreatment && (
                    <div className="col-12 mb-3">
                      <div className="alert alert-info">
                        <p className="mb-1">
                          <strong>
                            Diagnóstico:
                          </strong>{" "}
                          {
                            selectedTreatment
                              .diagnosis
                          }
                        </p>

                        <p className="mb-1">
                          <strong>
                            Procedimiento:
                          </strong>{" "}
                          {selectedProcedure
                            ?.name ??
                            "Sin procedimiento"}
                        </p>

                        <p className="mb-1">
                          <strong>
                            Precio base:
                          </strong>{" "}
                          {selectedProcedurePrice !==
                          null
                            ? `S/ ${selectedProcedurePrice.toFixed(
                                2,
                              )}`
                            : "No disponible"}
                        </p>

                        <p className="mb-0">
                          <strong>
                            Observaciones:
                          </strong>{" "}
                          {selectedTreatment
                            .clinical_observations ||
                            "Sin observaciones"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Precio bruto *
                    </label>

                    <input
                      type="number"
                      className={`form-control ${
                        errors.gross_total
                          ? "is-invalid"
                          : ""
                      }`}
                      value={
                        form.gross_total
                      }
                      min="0.01"
                      step="0.01"
                      onChange={(event) =>
                        changeField(
                          "gross_total",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    />

                    {errors.gross_total && (
                      <div className="invalid-feedback">
                        {
                          errors.gross_total
                        }
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Descuento *
                    </label>

                    <input
                      type="number"
                      className={`form-control ${
                        errors.discount
                          ? "is-invalid"
                          : ""
                      }`}
                      value={
                        form.discount
                      }
                      min="0"
                      step="0.01"
                      onChange={(event) =>
                        changeField(
                          "discount",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    />

                    {errors.discount && (
                      <div className="invalid-feedback">
                        {
                          errors.discount
                        }
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Total final
                    </label>

                    <input
                      type="text"
                      className={`form-control ${
                        errors.net_total
                          ? "is-invalid"
                          : ""
                      }`}
                      value={`S/ ${Math.max(
                        netTotal,
                        0,
                      ).toFixed(2)}`}
                      readOnly
                    />

                    {errors.net_total && (
                      <div className="invalid-feedback">
                        {
                          errors.net_total
                        }
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Estado
                    </label>

                    <select
                      className="form-select"
                      value={
                        form
                          .budget_status
                      }
                      onChange={(event) =>
                        changeField(
                          "budget_status",
                          event.target
                            .value as BudgetStatus,
                        )
                      }
                      disabled={isSaving}
                    >
                      <option value="Draft">
                        Borrador
                      </option>

                      <option value="Approved">
                        Aprobado
                      </option>

                      <option value="Closed">
                        Cerrado
                      </option>

                      <option value="Cancelled">
                        Cancelado
                      </option>
                    </select>
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
                    : budget
                      ? "Guardar cambios"
                      : "Crear presupuesto"}
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