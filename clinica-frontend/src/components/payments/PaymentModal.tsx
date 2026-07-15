import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  Payment,
  PaymentAppointment,
  PaymentBudget,
  PaymentMethod,
  PaymentPayload,
  PaymentProcedure,
  PaymentTreatment,
} from "../../types/payment";


interface PaymentModalProps {
  patientId: number;
  initialBudgetId: number | null;
  initialAppointmentId: number | null;
  payments: Payment[];
  appointments: PaymentAppointment[];
  budgets: PaymentBudget[];
  treatments: PaymentTreatment[];
  procedures: PaymentProcedure[];
  isSaving: boolean;
  onClose: () => void;

  onSave: (
    payment: PaymentPayload,
  ) => Promise<void>;
}


type PaymentType =
  | "Budget"
  | "Appointment";


interface PaymentForm {
  payment_type: PaymentType;
  budget: string;
  appointment: string;
  amount: string;
  payment_method: PaymentMethod;
  reference_number: string;
}


interface FormErrors {
  budget?: string;
  appointment?: string;
  amount?: string;
  payment_method?: string;
  reference_number?: string;
  general?: string;
}


const emptyForm: PaymentForm = {
  payment_type: "Budget",
  budget: "",
  appointment: "",
  amount: "",
  payment_method: "Cash",
  reference_number: "",
};


function getRelationId(
  relation: unknown,
): number | null {
  if (
    relation === null ||
    relation === undefined
  ) {
    return null;
  }

  if (
    typeof relation === "number" ||
    typeof relation === "string"
  ) {
    const id = Number(relation);

    return (
      Number.isInteger(id) &&
      id > 0
        ? id
        : null
    );
  }

  if (
    typeof relation === "object" &&
    "id" in relation
  ) {
    const id = Number(
      (
        relation as {
          id: unknown;
        }
      ).id,
    );

    return (
      Number.isInteger(id) &&
      id > 0
        ? id
        : null
    );
  }

  return null;
}


function isBudgetUnavailable(
  status: string,
): boolean {
  return [
    "Rejected",
    "Completed",
    "Cancelled",
    "Closed",
  ].includes(status);
}


function getBudgetStatusText(
  status: string,
): string {
  const statuses:
    Record<string, string> = {
      Draft: "Borrador",
      Sent: "Enviado",
      Accepted: "Aceptado",
      Rejected: "Rechazado",
      Completed: "Completado",

      Approved: "Aprobado",
      Cancelled: "Cancelado",
      Closed: "Cerrado",
    };

  return (
    statuses[status] ??
    status
  );
}


function formatDate(
  dateValue: string,
): string {
  const date = new Date(
    `${dateValue}T00:00:00`,
  );

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(date);
}


function getProcedureForBudget(
  budget: PaymentBudget,
  treatments:
    PaymentTreatment[],
  procedures:
    PaymentProcedure[],
): PaymentProcedure | undefined {
  const treatmentRelation =
    budget.suggested_treatment;

  const treatment =
    typeof treatmentRelation ===
    "object"
      ? treatmentRelation
      : treatments.find(
          (
            currentTreatment,
          ) =>
            currentTreatment.id ===
            treatmentRelation,
        );

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


export default function PaymentModal({
  patientId,
  initialBudgetId,
  initialAppointmentId,
  payments,
  appointments,
  budgets,
  treatments,
  procedures,
  isSaving,
  onClose,
  onSave,
}: PaymentModalProps) {
  const [
    form,
    setForm,
  ] = useState<PaymentForm>(
    emptyForm,
  );

  const [
    errors,
    setErrors,
  ] = useState<FormErrors>({});


  function getBudgetPaidAmount(
    budgetId: number,
  ): number {
    return payments
      .filter(
        (payment) =>
          getRelationId(
            payment.budget,
          ) === budgetId,
      )
      .reduce(
        (total, payment) =>
          total +
          Number(payment.amount),
        0,
      );
  }


  function getAppointmentPaidAmount(
    appointmentId: number,
  ): number {
    return payments
      .filter(
        (payment) =>
          getRelationId(
            payment.appointment,
          ) === appointmentId,
      )
      .reduce(
        (total, payment) =>
          total +
          Number(payment.amount),
        0,
      );
  }


  const patientBudgets =
    useMemo(
      () =>
        budgets.filter(
          (budget) =>
            getRelationId(
              budget.patient,
            ) === patientId &&
            !isBudgetUnavailable(
              budget.budget_status,
            ) &&
            !budget.is_deleted,
        ),
      [
        budgets,
        patientId,
      ],
    );


  const patientAppointments =
    useMemo(
      () =>
        appointments.filter(
          (appointment) => {
            if (
              getRelationId(
                appointment.patient,
              ) !== patientId
            ) {
              return false;
            }

            if (
              appointment
                .appointment_status ===
                "Cancelled" ||
              appointment
                .appointment_status ===
                "No Show" ||
              appointment.is_deleted
            ) {
              return false;
            }

            return (
              getAppointmentPaidAmount(
                appointment.id,
              ) === 0
            );
          },
        ),
      [
        appointments,
        payments,
        patientId,
      ],
    );


  useEffect(() => {
    if (initialBudgetId) {
      const budget =
        patientBudgets.find(
          (currentBudget) =>
            currentBudget.id ===
            initialBudgetId,
        );

      if (!budget) {
        setForm(emptyForm);

        setErrors({
          general:
            "El presupuesto seleccionado no está disponible para este paciente.",
        });

        return;
      }

      const paidAmount =
        getBudgetPaidAmount(
          budget.id,
        );

      const balance =
        Number(
          budget.net_total,
        ) - paidAmount;

      setForm({
        ...emptyForm,

        payment_type:
          "Budget",

        budget:
          String(
            budget.id,
          ),

        amount:
          balance > 0
            ? balance.toFixed(2)
            : "",
      });

      setErrors({});
      return;
    }

    if (initialAppointmentId) {
      const appointment =
        patientAppointments.find(
          (
            currentAppointment,
          ) =>
            currentAppointment.id ===
            initialAppointmentId,
        );

      if (!appointment) {
        setForm(emptyForm);

        setErrors({
          general:
            "La cita seleccionada no está disponible para pago.",
        });

        return;
      }

      setForm({
        ...emptyForm,

        payment_type:
          "Appointment",

        appointment:
          String(
            appointment.id,
          ),
      });

      setErrors({});
      return;
    }

    setForm(emptyForm);
    setErrors({});
  }, [
    initialBudgetId,
    initialAppointmentId,
    patientBudgets,
    patientAppointments,
    payments,
  ]);


  function changeField(
    field: keyof PaymentForm,
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
        general: undefined,
      }),
    );
  }


  function changePaymentType(
    value: PaymentType,
  ) {
    setForm({
      ...emptyForm,
      payment_type: value,
    });

    setErrors({});
  }


  function selectBudget(
    budgetIdValue: string,
  ) {
    const budgetId =
      Number(
        budgetIdValue,
      );

    const budget =
      patientBudgets.find(
        (currentBudget) =>
          currentBudget.id ===
          budgetId,
      );

    const paidAmount =
      budget
        ? getBudgetPaidAmount(
            budget.id,
          )
        : 0;

    const balance =
      budget
        ? Number(
            budget.net_total,
          ) - paidAmount
        : 0;

    setForm(
      (currentForm) => ({
        ...currentForm,

        budget:
          budgetIdValue,

        appointment: "",

        amount:
          balance > 0
            ? balance.toFixed(2)
            : "",
      }),
    );

    setErrors(
      (currentErrors) => ({
        ...currentErrors,
        budget: undefined,
        amount: undefined,
        general: undefined,
      }),
    );
  }


  const selectedBudget =
    patientBudgets.find(
      (budget) =>
        budget.id ===
        Number(form.budget),
    );


  const selectedAppointment =
    patientAppointments.find(
      (appointment) =>
        appointment.id ===
        Number(
          form.appointment,
        ),
    );


  const budgetPaidAmount =
    selectedBudget
      ? getBudgetPaidAmount(
          selectedBudget.id,
        )
      : 0;


  const budgetBalance =
    selectedBudget
      ? Number(
          selectedBudget.net_total,
        ) - budgetPaidAmount
      : 0;


  function validateForm(): boolean {
    const newErrors:
      FormErrors = {};

    const amount =
      Number(form.amount);

    const reference =
      form.reference_number
        .trim();

    if (
      form.payment_type ===
      "Budget"
    ) {
      if (!form.budget) {
        newErrors.budget =
          "Debe seleccionar un presupuesto.";
      } else if (!selectedBudget) {
        newErrors.budget =
          "El presupuesto seleccionado no está disponible.";
      } else if (
        budgetBalance <= 0
      ) {
        newErrors.budget =
          "El presupuesto no tiene saldo pendiente.";
      }
    }

    if (
      form.payment_type ===
      "Appointment"
    ) {
      if (!form.appointment) {
        newErrors.appointment =
          "Debe seleccionar una cita.";
      } else if (
        !selectedAppointment
      ) {
        newErrors.appointment =
          "La cita seleccionada no está disponible.";
      }
    }

    if (!form.amount) {
      newErrors.amount =
        "Debe ingresar el monto pagado.";
    } else if (
      Number.isNaN(amount)
    ) {
      newErrors.amount =
        "El monto debe ser un número válido.";
    } else if (
      amount <= 0
    ) {
      newErrors.amount =
        "El monto debe ser mayor que cero.";
    } else if (
      form.payment_type ===
        "Budget" &&
      selectedBudget &&
      amount > budgetBalance
    ) {
      newErrors.amount =
        `El monto no puede superar el saldo pendiente de S/ ${budgetBalance.toFixed(
          2,
        )}.`;
    }

    if (
      form.payment_method !==
        "Cash" &&
      !reference
    ) {
      newErrors.reference_number =
        "Debe ingresar el número de referencia.";
    }

    if (
      reference.length > 100
    ) {
      newErrors.reference_number =
        "La referencia no puede superar 100 caracteres.";
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

    if (!validateForm()) {
      return;
    }

    const paymentData:
      PaymentPayload = {
      budget:
        form.payment_type ===
        "Budget"
          ? Number(form.budget)
          : null,

      appointment:
        form.payment_type ===
        "Appointment"
          ? Number(
              form.appointment,
            )
          : null,

      amount:
        Number(
          form.amount,
        ).toFixed(2),

      payment_method:
        form.payment_method,

      reference_number:
        form.reference_number
          .trim() ||
        null,
    };

    try {
      await onSave(
        paymentData,
      );
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el pago.",
      });
    }
  }


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
                  Registrar pago
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

                <div className="mb-3">
                  <label className="form-label">
                    Tipo de pago *
                  </label>

                  <select
                    className="form-select"
                    value={
                      form.payment_type
                    }
                    onChange={(event) =>
                      changePaymentType(
                        event.target
                          .value as PaymentType,
                      )
                    }
                    disabled={isSaving}
                  >
                    <option value="Budget">
                      Pago de presupuesto
                    </option>

                    <option value="Appointment">
                      Pago de cita
                    </option>
                  </select>
                </div>

                {form.payment_type ===
                  "Budget" && (
                  <div className="mb-3">
                    <label className="form-label">
                      Presupuesto *
                    </label>

                    <select
                      className={`form-select ${
                        errors.budget
                          ? "is-invalid"
                          : ""
                      }`}
                      value={
                        form.budget
                      }
                      onChange={(event) =>
                        selectBudget(
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    >
                      <option value="">
                        Seleccione un presupuesto
                      </option>

                      {patientBudgets.map(
                        (budget) => {
                          const procedure =
                            getProcedureForBudget(
                              budget,
                              treatments,
                              procedures,
                            );

                          const paid =
                            getBudgetPaidAmount(
                              budget.id,
                            );

                          const balance =
                            Number(
                              budget
                                .net_total,
                            ) - paid;

                          return (
                            <option
                              key={
                                budget.id
                              }
                              value={
                                budget.id
                              }
                              disabled={
                                balance <= 0
                              }
                            >
                              {procedure
                                ?.name ??
                                "Tratamiento"}
                              {" - "}
                              {getBudgetStatusText(
                                budget
                                  .budget_status,
                              )}
                              {" - Total S/ "}
                              {
                                budget
                                  .net_total
                              }
                              {" - Saldo S/ "}
                              {Math.max(
                                balance,
                                0,
                              ).toFixed(
                                2,
                              )}
                            </option>
                          );
                        },
                      )}
                    </select>

                    {errors.budget && (
                      <div className="invalid-feedback">
                        {
                          errors.budget
                        }
                      </div>
                    )}

                    {patientBudgets.length ===
                      0 && (
                      <small className="text-danger">
                        El paciente no tiene presupuestos disponibles para pagar.
                      </small>
                    )}
                  </div>
                )}

                {form.payment_type ===
                  "Appointment" && (
                  <div className="mb-3">
                    <label className="form-label">
                      Cita *
                    </label>

                    <select
                      className={`form-select ${
                        errors.appointment
                          ? "is-invalid"
                          : ""
                      }`}
                      value={
                        form.appointment
                      }
                      onChange={(event) =>
                        changeField(
                          "appointment",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    >
                      <option value="">
                        Seleccione una cita
                      </option>

                      {patientAppointments.map(
                        (appointment) => (
                          <option
                            key={
                              appointment.id
                            }
                            value={
                              appointment.id
                            }
                          >
                            {formatDate(
                              appointment
                                .appointment_date,
                            )}
                            {" - "}
                            {appointment
                              .appointment_time.slice(
                                0,
                                5,
                              )}
                            {" - "}
                            {
                              appointment.reason
                            }
                          </option>
                        ),
                      )}
                    </select>

                    {errors.appointment && (
                      <div className="invalid-feedback">
                        {
                          errors.appointment
                        }
                      </div>
                    )}

                    {patientAppointments.length ===
                      0 && (
                      <small className="text-danger">
                        El paciente no tiene citas disponibles para pagar.
                      </small>
                    )}

                    <div>
                      <small className="text-muted">
                        La cita no tiene precio automático; el monto se ingresa manualmente.
                      </small>
                    </div>
                  </div>
                )}

                {selectedBudget && (
                  <div className="alert alert-info">
                    <strong>
                      Estado:
                    </strong>{" "}
                    {getBudgetStatusText(
                      selectedBudget
                        .budget_status,
                    )}
                    <br />

                    <strong>
                      Total:
                    </strong>{" "}
                    S/{" "}
                    {
                      selectedBudget
                        .net_total
                    }
                    <br />

                    <strong>
                      Pagado:
                    </strong>{" "}
                    S/{" "}
                    {budgetPaidAmount.toFixed(
                      2,
                    )}
                    <br />

                    <strong>
                      Saldo pendiente:
                    </strong>{" "}
                    S/{" "}
                    {Math.max(
                      budgetBalance,
                      0,
                    ).toFixed(
                      2,
                    )}
                  </div>
                )}

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Monto pagado *
                    </label>

                    <input
                      type="number"
                      className={`form-control ${
                        errors.amount
                          ? "is-invalid"
                          : ""
                      }`}
                      value={
                        form.amount
                      }
                      min="0.01"
                      step="0.01"
                      onChange={(event) =>
                        changeField(
                          "amount",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    />

                    {errors.amount && (
                      <div className="invalid-feedback">
                        {
                          errors.amount
                        }
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Método de pago *
                    </label>

                    <select
                      className="form-select"
                      value={
                        form
                          .payment_method
                      }
                      onChange={(event) => {
                        const method =
                          event.target
                            .value as PaymentMethod;

                        setForm(
                          (
                            currentForm,
                          ) => ({
                            ...currentForm,

                            payment_method:
                              method,

                            reference_number:
                              method ===
                              "Cash"
                                ? ""
                                : currentForm
                                    .reference_number,
                          }),
                        );

                        setErrors(
                          (
                            currentErrors,
                          ) => ({
                            ...currentErrors,
                            reference_number:
                              undefined,
                            general:
                              undefined,
                          }),
                        );
                      }}
                      disabled={isSaving}
                    >
                      <option value="Cash">
                        Efectivo
                      </option>

                      <option value="Card">
                        Tarjeta
                      </option>

                      <option value="Transfer">
                        Transferencia
                      </option>

                      <option value="Insurance">
                        Seguro
                      </option>
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Número de referencia
                      {form.payment_method !==
                        "Cash" &&
                        " *"}
                    </label>

                    <input
                      type="text"
                      className={`form-control ${
                        errors
                          .reference_number
                          ? "is-invalid"
                          : ""
                      }`}
                      value={
                        form
                          .reference_number
                      }
                      onChange={(event) =>
                        changeField(
                          "reference_number",
                          event.target.value,
                        )
                      }
                      maxLength={100}
                      placeholder={
                        form.payment_method ===
                        "Cash"
                          ? "No necesario"
                          : "Número de operación"
                      }
                      disabled={
                        isSaving ||
                        form.payment_method ===
                          "Cash"
                      }
                    />

                    {errors
                      .reference_number && (
                      <div className="invalid-feedback">
                        {
                          errors
                            .reference_number
                        }
                      </div>
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
                  className="btn btn-success"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Registrando..."
                    : "Registrar pago"}
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
