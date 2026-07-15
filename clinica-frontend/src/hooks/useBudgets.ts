import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createBudget,
  getBudgets,
  updateBudget,
} from "../api/budgetApi";

import {
  getMedicalRecords,
} from "../api/medicalRecordApi";

import {
  getPatients,
} from "../api/patientApi";

import {
  getSuggestedTreatments,
  getTreatmentProcedures,
} from "../api/suggestedTreatmentApi";

import type {
  BudgetPayload,
} from "../types/budget";

export function useBudgets() {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: getBudgets,
  });

  const patientsQuery = useQuery({
    queryKey: [
      "patients",
      "budget-options",
    ],
    queryFn: () =>
      getPatients("", false),
  });

  const medicalRecordsQuery = useQuery({
    queryKey: [
      "medical-records",
      "budget-options",
    ],
    queryFn: getMedicalRecords,
  });

  const treatmentsQuery = useQuery({
    queryKey: [
      "suggested-treatments",
      "budget-options",
    ],
    queryFn: getSuggestedTreatments,
  });

  const proceduresQuery = useQuery({
    queryKey: [
      "procedures",
      "budget-options",
    ],
    queryFn: getTreatmentProcedures,
  });

  const createMutation = useMutation({
    mutationFn: createBudget,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      budget,
    }: {
      id: number;
      budget: Partial<BudgetPayload>;
    }) => updateBudget(id, budget),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
    },
  });

  let queryError: Error | null = null;

  if (budgetsQuery.error instanceof Error) {
    queryError = budgetsQuery.error;
  } else if (
    patientsQuery.error instanceof Error
  ) {
    queryError = patientsQuery.error;
  } else if (
    medicalRecordsQuery.error instanceof Error
  ) {
    queryError =
      medicalRecordsQuery.error;
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
    budgets: budgetsQuery.data ?? [],

    patients:
      patientsQuery.data ?? [],

    medicalRecords:
      medicalRecordsQuery.data ?? [],

    treatments:
      treatmentsQuery.data ?? [],

    procedures:
      proceduresQuery.data ?? [],

    isLoading:
      budgetsQuery.isLoading ||
      patientsQuery.isLoading ||
      medicalRecordsQuery.isLoading ||
      treatmentsQuery.isLoading ||
      proceduresQuery.isLoading,

    isError:
      budgetsQuery.isError ||
      patientsQuery.isError ||
      medicalRecordsQuery.isError ||
      treatmentsQuery.isError ||
      proceduresQuery.isError,

    queryError,

    refetchBudgets:
      budgetsQuery.refetch,

    createMutation,
    updateMutation,
  };
}