import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createPayment,
  getPaymentAppointments,
  getPaymentBudgets,
  getPaymentPatients,
  getPaymentProcedures,
  getPayments,
  getPaymentTreatments,
} from "../api/paymentApi";


export function usePayments() {
  const queryClient =
    useQueryClient();

  const paymentsQuery =
    useQuery({
      queryKey: ["payments"],
      queryFn: getPayments,
    });

  const patientsQuery =
    useQuery({
      queryKey: [
        "payment-patients",
      ],

      queryFn:
        getPaymentPatients,
    });

  const appointmentsQuery =
    useQuery({
      queryKey: [
        "payment-appointments",
      ],

      queryFn:
        getPaymentAppointments,
    });

  const budgetsQuery =
    useQuery({
      queryKey: [
        "payment-budgets",
      ],

      queryFn:
        getPaymentBudgets,
    });

  const treatmentsQuery =
    useQuery({
      queryKey: [
        "payment-treatments",
      ],

      queryFn:
        getPaymentTreatments,
    });

  const proceduresQuery =
    useQuery({
      queryKey: [
        "payment-procedures",
      ],

      queryFn:
        getPaymentProcedures,
    });


  const createMutation =
    useMutation({
      mutationFn:
        createPayment,

      onSuccess:
        async () => {
          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  "payments",
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  "payment-budgets",
                ],
              }),
          ]);
        },
    });


  const queries = [
    paymentsQuery,
    patientsQuery,
    appointmentsQuery,
    budgetsQuery,
    treatmentsQuery,
    proceduresQuery,
  ];


  return {
    payments:
      paymentsQuery.data ?? [],

    patients:
      patientsQuery.data ?? [],

    appointments:
      appointmentsQuery.data ??
      [],

    budgets:
      budgetsQuery.data ?? [],

    treatments:
      treatmentsQuery.data ?? [],

    procedures:
      proceduresQuery.data ?? [],

    isLoading:
      queries.some(
        (query) =>
          query.isLoading,
      ),

    isError:
      queries.some(
        (query) =>
          query.isError,
      ),

    queryError:
      queries.find(
        (query) =>
          query.error,
      )?.error ?? null,

    refetchPayments:
      async () => {
        await Promise.all([
          paymentsQuery.refetch(),
          budgetsQuery.refetch(),
          appointmentsQuery.refetch(),
        ]);
      },

    createMutation,
  };
}
