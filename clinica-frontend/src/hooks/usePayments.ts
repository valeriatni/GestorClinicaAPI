import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createPayment,
  getPayments,
} from "../api/paymentApi";

import {
  getAppointments,
} from "../api/appointmentApi";

import {
  getBudgets,
} from "../api/budgetApi";

import {
  getPatients,
} from "../api/patientApi";

import {
  getSuggestedTreatments,
  getTreatmentProcedures,
} from "../api/suggestedTreatmentApi";

export function usePayments() {
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  const patientsQuery = useQuery({
    queryKey: [
      "patients",
      "payment-options",
    ],
    queryFn: () =>
      getPatients("", true),
  });

  const appointmentsQuery = useQuery({
    queryKey: [
      "appointments",
      "payment-options",
    ],
    queryFn: getAppointments,
  });

  const budgetsQuery = useQuery({
    queryKey: [
      "budgets",
      "payment-options",
    ],
    queryFn: getBudgets,
  });

  const treatmentsQuery = useQuery({
    queryKey: [
      "suggested-treatments",
      "payment-options",
    ],
    queryFn: getSuggestedTreatments,
  });

  const proceduresQuery = useQuery({
    queryKey: [
      "procedures",
      "payment-options",
    ],
    queryFn: getTreatmentProcedures,
  });

  const createMutation = useMutation({
    mutationFn: createPayment,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments"],
      });

      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
    },
  });

  let queryError: Error | null = null;

  if (paymentsQuery.error instanceof Error) {
    queryError = paymentsQuery.error;
  } else if (
    patientsQuery.error instanceof Error
  ) {
    queryError = patientsQuery.error;
  } else if (
    appointmentsQuery.error instanceof Error
  ) {
    queryError = appointmentsQuery.error;
  } else if (
    budgetsQuery.error instanceof Error
  ) {
    queryError = budgetsQuery.error;
  } else if (
    treatmentsQuery.error instanceof Error
  ) {
    queryError = treatmentsQuery.error;
  } else if (
    proceduresQuery.error instanceof Error
  ) {
    queryError = proceduresQuery.error;
  }

  return {
    payments: paymentsQuery.data ?? [],
    patients: patientsQuery.data ?? [],
    appointments:
      appointmentsQuery.data ?? [],
    budgets: budgetsQuery.data ?? [],
    treatments:
      treatmentsQuery.data ?? [],
    procedures:
      proceduresQuery.data ?? [],

    isLoading:
      paymentsQuery.isLoading ||
      patientsQuery.isLoading ||
      appointmentsQuery.isLoading ||
      budgetsQuery.isLoading ||
      treatmentsQuery.isLoading ||
      proceduresQuery.isLoading,

    isError:
      paymentsQuery.isError ||
      patientsQuery.isError ||
      appointmentsQuery.isError ||
      budgetsQuery.isError ||
      treatmentsQuery.isError ||
      proceduresQuery.isError,

    queryError,

    refetchPayments:
      paymentsQuery.refetch,

    createMutation,
  };
}