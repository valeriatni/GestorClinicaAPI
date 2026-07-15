import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSuggestedTreatment,
  getSuggestedTreatments,
  getTreatmentProcedures,
  getTreatmentSpecialists,
  updateSuggestedTreatment,
} from "../api/suggestedTreatmentApi";

import type {
  SuggestedTreatmentPayload,
} from "../types/suggestedTreatment";


export function useSuggestedTreatments() {
  const queryClient =
    useQueryClient();


  const treatmentsQuery = useQuery({
    queryKey: [
      "suggested-treatments",
    ],

    queryFn:
      getSuggestedTreatments,
  });


  const proceduresQuery = useQuery({
    queryKey: [
      "procedures",
      "treatment-options",
    ],

    queryFn:
      getTreatmentProcedures,
  });


  const specialistsQuery = useQuery({
    queryKey: [
      "specialists",
      "treatment-options",
    ],

    queryFn:
      getTreatmentSpecialists,
  });


  async function refreshTreatments() {
    await queryClient.invalidateQueries({
      queryKey: [
        "suggested-treatments",
      ],
    });
  }


  const createMutation =
    useMutation({
      mutationFn:
        createSuggestedTreatment,

      onSuccess:
        refreshTreatments,
    });


  const updateMutation =
    useMutation({
      mutationFn: ({
        id,
        treatment,
      }: {
        id: number;
        treatment:
          Partial<SuggestedTreatmentPayload>;
      }) =>
        updateSuggestedTreatment(
          id,
          treatment,
        ),

      onSuccess:
        refreshTreatments,
    });


  let queryError:
    Error | null = null;

  if (
    treatmentsQuery.error
    instanceof Error
  ) {
    queryError =
      treatmentsQuery.error;
  } else if (
    proceduresQuery.error
    instanceof Error
  ) {
    queryError =
      proceduresQuery.error;
  } else if (
    specialistsQuery.error
    instanceof Error
  ) {
    queryError =
      specialistsQuery.error;
  }


  async function refetchTreatments() {
    await Promise.all([
      treatmentsQuery.refetch(),
      proceduresQuery.refetch(),
      specialistsQuery.refetch(),
    ]);
  }


  return {
    treatments:
      treatmentsQuery.data ?? [],

    procedures:
      proceduresQuery.data ?? [],

    specialists:
      specialistsQuery.data ?? [],

    isLoading:
      treatmentsQuery.isLoading ||
      proceduresQuery.isLoading ||
      specialistsQuery.isLoading,

    isError:
      treatmentsQuery.isError ||
      proceduresQuery.isError ||
      specialistsQuery.isError,

    queryError,

    refetchTreatments,

    createMutation,
    updateMutation,
  };
}