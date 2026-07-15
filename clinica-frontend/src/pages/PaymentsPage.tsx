import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import {
  updateBudget,
} from "../api/budgetApi";

import PaymentModal from "../components/payments/PaymentModal";

import {
  usePayments,
} from "../hooks/usePayments";

import type {
  Payment,
  PaymentMethod,
  PaymentPayload,
} from "../types/payment";

function getMethodText(
  method: PaymentMethod,
): string {
  const methods: Record<
    PaymentMethod,
    string
  > = {
    Cash: "Efectivo",
    Card: "Tarjeta",
    Transfer: "Transferencia",
    Insurance: "Seguro",
  };

  return methods[method];
}

function formatDateTime(
  dateValue: string,
): string {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
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

export default function PaymentsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const patientFromUrl =
    searchParams.get("patient");

  const budgetFromUrl =
    searchParams.get("budget");

  const appointmentFromUrl =
    searchParams.get("appointment");

  const [
    selectedPatientId,
    setSelectedPatientId,
  ] = useState("");

  const [
    initialBudgetId,
    setInitialBudgetId,
  ] = useState<number | null>(null);

  const [
    initialAppointmentId,
    setInitialAppointmentId,
  ] = useState<number | null>(null);

  const [showModal, setShowModal] =
    useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const {
    payments,
    patients,
    appointments,
    budgets,
    treatments,
    procedures,
    isLoading,
    isError,
    queryError,
    refetchPayments,
    createMutation,
  } = usePayments();

  useEffect(() => {
    if (patients.length === 0) {
      return;
    }

    if (!patientFromUrl) {
      return;
    }

    const patientId = Number(
      patientFromUrl,
    );

    const patient = patients.find(
      (currentPatient) =>
        currentPatient.id === patientId,
    );

    if (!patient) {
      setErrorMessage(
        "No se encontró el paciente seleccionado.",
      );

      setSearchParams(
        {},
        { replace: true },
      );

      return;
    }

    setSelectedPatientId(
      String(patient.id),
    );

    if (budgetFromUrl) {
      const budgetId = Number(
        budgetFromUrl,
      );

      const budget = budgets.find(
        (currentBudget) =>
          currentBudget.id ===
          budgetId,
      );

      if (
        !budget ||
        budget.patient !== patient.id
      ) {
        setErrorMessage(
          "El presupuesto no pertenece al paciente seleccionado.",
        );
      } else {
        setInitialBudgetId(
          budget.id,
        );

        setInitialAppointmentId(
          null,
        );

        setShowModal(true);
      }
    } else if (
      appointmentFromUrl
    ) {
      const appointmentId = Number(
        appointmentFromUrl,
      );

      const appointment =
        appointments.find(
          (currentAppointment) =>
            currentAppointment.id ===
            appointmentId,
        );

      if (
        !appointment ||
        appointment.patient !==
          patient.id
      ) {
        setErrorMessage(
          "La cita no pertenece al paciente seleccionado.",
        );
      } else {
        setInitialAppointmentId(
          appointment.id,
        );

        setInitialBudgetId(null);
        setShowModal(true);
      }
    }

    setSearchParams(
      {},
      { replace: true },
    );
  }, [
    patientFromUrl,
    budgetFromUrl,
    appointmentFromUrl,
    patients,
    appointments,
    budgets,
    setSearchParams,
  ]);

  const selectedPatient =
    patients.find(
      (patient) =>
        patient.id ===
        Number(selectedPatientId),
    );

  function getPaymentPatientId(
    payment: Payment,
  ): number | null {
    if (payment.budget) {
      const budget = budgets.find(
        (currentBudget) =>
          currentBudget.id ===
          payment.budget,
      );

      return budget?.patient ?? null;
    }

    if (payment.appointment) {
      const appointment =
        appointments.find(
          (currentAppointment) =>
            currentAppointment.id ===
            payment.appointment,
        );

      return appointment?.patient ?? null;
    }

    return null;
  }

  const patientPayments =
    payments.filter(
      (payment) =>
        getPaymentPatientId(payment) ===
        Number(selectedPatientId),
    );

  const totalPatientPayments =
    patientPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0,
    );

  function findProcedureByBudget(
    budgetId: number,
  ) {
    const budget = budgets.find(
      (currentBudget) =>
        currentBudget.id === budgetId,
    );

    const treatment =
      treatments.find(
        (currentTreatment) =>
          currentTreatment.id ===
          budget?.suggested_treatment,
      );

    return procedures.find(
      (procedure) =>
        procedure.id ===
        treatment?.procedure,
    );
  }

  function getPaymentConcept(
    payment: Payment,
  ): string {
    if (payment.budget) {
      const procedure =
        findProcedureByBudget(
          payment.budget,
        );

      return `Presupuesto - ${
        procedure?.name ??
        "Tratamiento odontológico"
      }`;
    }

    if (payment.appointment) {
      const appointment =
        appointments.find(
          (currentAppointment) =>
            currentAppointment.id ===
            payment.appointment,
        );

      if (!appointment) {
        return "Pago de cita";
      }

      return `Cita ${formatDate(
        appointment.appointment_date,
      )} ${appointment.appointment_time.slice(
        0,
        5,
      )} - ${appointment.reason}`;
    }

    return "Concepto no identificado";
  }

  function openPaymentModal() {
    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedPatient) {
      setErrorMessage(
        "Debe seleccionar un paciente antes de registrar el pago.",
      );

      return;
    }

    if (!selectedPatient.is_active) {
      setErrorMessage(
        "El paciente está inactivo. Revise su estado antes de registrar nuevos pagos.",
      );

      return;
    }

    const hasBudgets = budgets.some(
      (budget) =>
        budget.patient ===
          selectedPatient.id &&
        budget.budget_status !==
          "Cancelled" &&
        budget.budget_status !==
          "Closed",
    );

    const hasAppointments =
      appointments.some(
        (appointment) =>
          appointment.patient ===
            selectedPatient.id &&
          appointment
            .appointment_status !==
            "Cancelled" &&
          appointment
            .appointment_status !==
            "No Show",
      );

    if (
      !hasBudgets &&
      !hasAppointments
    ) {
      setErrorMessage(
        "El paciente no tiene citas ni presupuestos disponibles para registrar un pago.",
      );

      return;
    }

    setInitialBudgetId(null);
    setInitialAppointmentId(null);
    setShowModal(true);
  }

  async function savePayment(
    paymentData: PaymentPayload,
  ) {
    if (!selectedPatient) {
      throw new Error(
        "Debe seleccionar un paciente.",
      );
    }

    if (
      paymentData.budget &&
      paymentData.appointment
    ) {
      throw new Error(
        "Debe seleccionar una cita o un presupuesto, pero no ambos.",
      );
    }

    if (
      !paymentData.budget &&
      !paymentData.appointment
    ) {
      throw new Error(
        "Debe seleccionar qué está pagando el paciente.",
      );
    }

    await createMutation.mutateAsync(
      paymentData,
    );

    if (paymentData.budget) {
      const budget = budgets.find(
        (currentBudget) =>
          currentBudget.id ===
          paymentData.budget,
      );

      if (!budget) {
        throw new Error(
          "El pago se registró, pero no se encontró el presupuesto para actualizar su estado.",
        );
      }

      const previousPayments =
        payments
          .filter(
            (payment) =>
              payment.budget ===
              budget.id,
          )
          .reduce(
            (total, payment) =>
              total +
              Number(payment.amount),
            0,
          );

      const newPaidTotal =
        previousPayments +
        Number(paymentData.amount);

      const budgetTotal = Number(
        budget.net_total,
      );

      if (
        newPaidTotal >= budgetTotal
      ) {
        await updateBudget(
          budget.id,
          {
            budget_status: "Closed",
          },
        );

        setSuccessMessage(
          "El pago se registró correctamente. El presupuesto quedó completamente pagado y cerrado.",
        );
      } else {
        if (
          budget.budget_status ===
          "Draft"
        ) {
          await updateBudget(
            budget.id,
            {
              budget_status:
                "Approved",
            },
          );
        }

        const balance =
          budgetTotal -
          newPaidTotal;

        setSuccessMessage(
          `El pago se registró correctamente. Saldo pendiente: S/ ${balance.toFixed(
            2,
          )}.`,
        );
      }
    } else {
      setSuccessMessage(
        "El pago de la cita se registró correctamente.",
      );
    }

    setShowModal(false);
    setInitialBudgetId(null);
    setInitialAppointmentId(null);
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Pagos</h2>

          <p className="text-muted mb-0">
            Registre pagos de citas o
            presupuestos y consulte el
            historial del paciente.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-success"
          onClick={openPaymentModal}
        >
          Registrar pago
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
              >
                {patient.first_name}{" "}
                {patient.last_name} - DNI{" "}
                {patient.dni}
                {!patient.is_active
                  ? " - Inactivo"
                  : ""}
              </option>
            ))}
          </select>

          <small className="text-muted">
            Busque siempre al paciente por
            nombre completo o DNI.
          </small>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border" />

          <p className="mt-2">
            Cargando pagos...
          </p>
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">
          <p>
            {queryError
              ? queryError.message
              : "No se pudo cargar la información de pagos."}
          </p>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() =>
              refetchPayments()
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
            Seleccione un paciente para
            consultar sus pagos.
          </div>
        )}

      {!isLoading &&
        !isError &&
        selectedPatient && (
          <>
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="mb-1">
                  {selectedPatient.first_name}{" "}
                  {selectedPatient.last_name}
                </h5>

                <p className="text-muted mb-2">
                  DNI: {selectedPatient.dni}
                </p>

                <strong>
                  Total de pagos registrados:
                </strong>{" "}
                S/{" "}
                {totalPatientPayments.toFixed(
                  2,
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header bg-white">
                <h5 className="mb-0">
                  Historial de pagos
                </h5>
              </div>

              <div className="card-body">
                {patientPayments.length ===
                  0 && (
                  <div className="alert alert-info">
                    El paciente todavía no
                    tiene pagos registrados.
                  </div>
                )}

                {patientPayments.length >
                  0 && (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Concepto</th>
                          <th>Monto</th>
                          <th>Método</th>
                          <th>Referencia</th>
                        </tr>
                      </thead>

                      <tbody>
                        {patientPayments.map(
                          (payment) => (
                            <tr
                              key={payment.id}
                            >
                              <td>
                                {formatDateTime(
                                  payment.payment_date,
                                )}
                              </td>

                              <td>
                                {getPaymentConcept(
                                  payment,
                                )}
                              </td>

                              <td>
                                <strong>
                                  S/{" "}
                                  {Number(
                                    payment.amount,
                                  ).toFixed(2)}
                                </strong>
                              </td>

                              <td>
                                {getMethodText(
                                  payment.payment_method,
                                )}
                              </td>

                              <td>
                                {payment.reference_number ||
                                  "Sin referencia"}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      {showModal &&
        selectedPatient && (
          <PaymentModal
            patientId={
              selectedPatient.id
            }
            initialBudgetId={
              initialBudgetId
            }
            initialAppointmentId={
              initialAppointmentId
            }
            payments={payments}
            appointments={
              appointments
            }
            budgets={budgets}
            treatments={treatments}
            procedures={procedures}
            isSaving={
              createMutation.isPending
            }
            onClose={() => {
              setShowModal(false);
              setInitialBudgetId(null);
              setInitialAppointmentId(
                null,
              );
            }}
            onSave={savePayment}
          />
        )}
    </div>
  );
}