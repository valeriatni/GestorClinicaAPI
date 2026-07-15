import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  Appointment,
} from "../../types/appointment";

import type {
  Budget,
} from "../../types/budget";

import type {
  Payment,
  PaymentMethod,
  PaymentPayload,
} from "../../types/payment";

import type {
  ProcedureOption,
  SuggestedTreatment,
} from "../../types/suggestedTreatment";

interface PaymentModalProps {
  patientId: number;
  initialBudgetId: number | null;
  initialAppointmentId: number | null;
  payments: Payment[];
  appointments: Appointment[];
  budgets: Budget[];
  treatments: SuggestedTreatment[];
  procedures: ProcedureOption[];
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
  payment_type?: string;
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
  const [form, setForm] =
    useState<PaymentForm>(emptyForm);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const patientBudgets = budgets.filter(
    (budget) =>
      budget.patient === patientId &&
      budget.budget_status !==
        "Cancelled",
  );

  const patientAppointments =
    appointments.filter(
      (appointment) =>
        appointment.patient ===
          patientId &&
        appointment.appointment_status !==
          "Cancelled" &&
        appointment.appointment_status !==
          "No Show",
    );

  useEffect(() => {
    if (initialBudgetId) {
      const budget = budgets.find(
        (currentBudget) =>
          currentBudget.id ===
          initialBudgetId,
      );

      const paidAmount = payments
        .filter(
          (payment) =>
            payment.budget ===
            initialBudgetId,
        )
        .reduce(
          (total, payment) =>
            total +
            Number(payment.amount),
          0,
        );

      const balance = budget
        ? Number(budget.net_total) -
          paidAmount
        : 0;

      setForm({
        ...emptyForm,
        payment_type: "Budget",
        budget: String(
          initialBudgetId,
        ),
        amount:
          balance > 0
            ? balance.toFixed(2)
            : "",
      });
    } else if (initialAppointmentId) {
      setForm({
        ...emptyForm,
        payment_type: "Appointment",
        appointment: String(
          initialAppointmentId,
        ),
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [
    initialBudgetId,
    initialAppointmentId,
    budgets,
    payments,
  ]);

  function changeField(
    field: keyof PaymentForm,
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
    const budgetId = Number(
      budgetIdValue,
    );

    const budget = budgets.find(
      (currentBudget) =>
        currentBudget.id === budgetId,
    );

    const paidAmount = payments
      .filter(
        (payment) =>
          payment.budget === budgetId,
      )
      .reduce(
        (total, payment) =>
          total + Number(payment.amount),
        0,
      );

    const balance = budget
      ? Number(budget.net_total) -
        paidAmount
      : 0;

    setForm({
      ...form,
      budget: budgetIdValue,
      appointment: "",
      amount:
        balance > 0
          ? balance.toFixed(2)
          : "",
    });

    setErrors({
      ...errors,
      budget: undefined,
      appointment: undefined,
      amount: undefined,
      general: undefined,
    });
  }

  function getBudgetPaidAmount(
    budgetId: number,
  ): number {
    return payments
      .filter(
        (payment) =>
          payment.budget === budgetId,
      )
      .reduce(
        (total, payment) =>
          total + Number(payment.amount),
        0,
      );
  }

  function getAppointmentPaidAmount(
    appointmentId: number,
  ): number {
    return payments
      .filter(
        (payment) =>
          payment.appointment ===
          appointmentId,
      )
      .reduce(
        (total, payment) =>
          total + Number(payment.amount),
        0,
      );
  }

  function findProcedureForBudget(
    budget: Budget,
  ) {
    const treatment =
      treatments.find(
        (currentTreatment) =>
          currentTreatment.id ===
          budget.suggested_treatment,
      );

    return procedures.find(
      (procedure) =>
        procedure.id ===
        treatment?.procedure,
    );
  }

  const selectedBudget = budgets.find(
    (budget) =>
      budget.id === Number(form.budget),
  );

  const selectedAppointment =
    appointments.find(
      (appointment) =>
        appointment.id ===
        Number(form.appointment),
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
    const newErrors: FormErrors = {};

    const amount = Number(form.amount);
    const reference =
      form.reference_number.trim();

    if (!patientId) {
      newErrors.general =
        "Debe seleccionar un paciente.";
    }

    if (
      form.payment_type === "Budget"
    ) {
      if (!form.budget) {
        newErrors.budget =
          "Debe seleccionar un presupuesto.";
      } else if (!selectedBudget) {
        newErrors.budget =
          "El presupuesto seleccionado no existe.";
      } else if (
        selectedBudget.patient !==
        patientId
      ) {
        newErrors.budget =
          "El presupuesto no pertenece al paciente seleccionado.";
      } else if (
        selectedBudget.budget_status ===
        "Cancelled"
      ) {
        newErrors.budget =
          "No se puede pagar un presupuesto cancelado.";
      } else if (
        selectedBudget.budget_status ===
        "Closed"
      ) {
        newErrors.budget =
          "Este presupuesto ya está completamente pagado y cerrado.";
      } else if (budgetBalance <= 0) {
        newErrors.budget =
          "Este presupuesto no tiene saldo pendiente.";
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
          "La cita seleccionada no existe.";
      } else if (
        selectedAppointment.patient !==
        patientId
      ) {
        newErrors.appointment =
          "La cita no pertenece al paciente seleccionado.";
      } else if (
        selectedAppointment
          .appointment_status ===
          "Cancelled"
      ) {
        newErrors.appointment =
          "No se puede registrar un pago para una cita cancelada.";
      } else if (
        selectedAppointment
          .appointment_status ===
          "No Show"
      ) {
        newErrors.appointment =
          "No se puede registrar un pago para una cita a la que el paciente no asistió.";
      }
    }

    if (!form.amount) {
      newErrors.amount =
        "Debe ingresar el monto pagado.";
    } else if (Number.isNaN(amount)) {
      newErrors.amount =
        "El monto debe ser un número válido.";
    } else if (amount <= 0) {
      newErrors.amount =
        "El monto debe ser mayor que cero.";
    } else if (amount > 99999999) {
      newErrors.amount =
        "El monto ingresado es demasiado alto.";
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

    if (!form.payment_method) {
      newErrors.payment_method =
        "Debe seleccionar un método de pago.";
    }

    if (
      form.payment_method !== "Cash" &&
      !reference
    ) {
      newErrors.reference_number =
        "Debe ingresar el número de operación o referencia.";
    }

    if (reference.length > 100) {
      newErrors.reference_number =
        "El número de referencia no puede superar los 100 caracteres.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length ===
      0
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrors({});

    if (!validateForm()) {
      return;
    }

    const paymentData: PaymentPayload =
      {
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

        amount: Number(
          form.amount,
        ).toFixed(2),

        payment_method:
          form.payment_method,

        reference_number:
          form.reference_number.trim() ||
          null,
      };

    try {
      await onSave(paymentData);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el pago.",
      });
    }
  }

  function getInputClass(
    field: keyof FormErrors,
  ) {
    return `form-control ${
      errors[field]
        ? "is-invalid"
        : ""
    }`;
  }

  function getSelectClass(
    field: keyof FormErrors,
  ) {
    return `form-select ${
      errors[field]
        ? "is-invalid"
        : ""
    }`;
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form
              onSubmit={handleSubmit}
              noValidate
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
                />
              </div>

              <div className="modal-body">
                {errors.general && (
                  <div className="alert alert-danger">
                    {errors.general}
                  </div>
                )}

                <p className="text-muted">
                  Seleccione qué está pagando el
                  paciente.
                </p>

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
                      className={getSelectClass(
                        "budget",
                      )}
                      value={form.budget}
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
                            findProcedureForBudget(
                              budget,
                            );

                          const paid =
                            getBudgetPaidAmount(
                              budget.id,
                            );

                          const balance =
                            Number(
                              budget.net_total,
                            ) - paid;

                          return (
                            <option
                              key={budget.id}
                              value={budget.id}
                              disabled={
                                balance <= 0 ||
                                budget.budget_status ===
                                  "Closed"
                              }
                            >
                              {procedure?.name ??
                                "Tratamiento"}{" "}
                              - Total S/{" "}
                              {
                                budget.net_total
                              }{" "}
                              - Saldo S/{" "}
                              {Math.max(
                                balance,
                                0,
                              ).toFixed(2)}
                            </option>
                          );
                        },
                      )}
                    </select>

                    {errors.budget && (
                      <div className="invalid-feedback">
                        {errors.budget}
                      </div>
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
                      className={getSelectClass(
                        "appointment",
                      )}
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
                              appointment.appointment_date,
                            )}{" "}
                            -{" "}
                            {appointment.appointment_time.slice(
                              0,
                              5,
                            )}{" "}
                            -{" "}
                            {
                              appointment.reason
                            }{" "}
                            - Pagado S/{" "}
                            {getAppointmentPaidAmount(
                              appointment.id,
                            ).toFixed(2)}
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

                    <small className="text-muted">
                      Como la cita no tiene precio
                      registrado, el monto se
                      ingresará manualmente.
                    </small>
                  </div>
                )}

                {selectedBudget && (
                  <div className="alert alert-info">
                    <strong>
                      Total del presupuesto:
                    </strong>{" "}
                    S/{" "}
                    {selectedBudget.net_total}
                    <br />

                    <strong>
                      Pagado anteriormente:
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
                    ).toFixed(2)}
                  </div>
                )}

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Monto pagado *
                    </label>

                    <input
                      type="number"
                      className={getInputClass(
                        "amount",
                      )}
                      value={form.amount}
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
                        {errors.amount}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Método de pago *
                    </label>

                    <select
                      className={getSelectClass(
                        "payment_method",
                      )}
                      value={
                        form.payment_method
                      }
                      onChange={(event) => {
                        const method =
                          event.target
                            .value as PaymentMethod;

                        setForm({
                          ...form,
                          payment_method:
                            method,

                          reference_number:
                            method === "Cash"
                              ? ""
                              : form.reference_number,
                        });

                        setErrors({
                          ...errors,
                          payment_method:
                            undefined,
                          reference_number:
                            undefined,
                          general: undefined,
                        });
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

                    {errors.payment_method && (
                      <div className="invalid-feedback">
                        {
                          errors.payment_method
                        }
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Número de referencia
                      {form.payment_method !==
                        "Cash" && " *"}
                    </label>

                    <input
                      type="text"
                      className={getInputClass(
                        "reference_number",
                      )}
                      value={
                        form.reference_number
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

                    {errors.reference_number && (
                      <div className="invalid-feedback">
                        {
                          errors.reference_number
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