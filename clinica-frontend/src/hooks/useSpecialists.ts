import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  changeSpecialistStatus,
  createSpecialist,
  deleteSpecialist,
  getSpecialists,
  restoreSpecialist,
  updateSpecialist,
} from "../api/specialistApi";

import {
  getSpecialties,
} from "../api/specialtyApi";

import type {
  SpecialistPayload,
} from "../types/specialist";


export function useSpecialists(
  showInactive: boolean,
  showDeleted: boolean,
) {
  const queryClient =
    useQueryClient();


  const specialistsQuery =
    useQuery({
      queryKey: [
        "specialists",
        showInactive,
        showDeleted,
      ],

      queryFn: () =>
        getSpecialists(
          showInactive,
          showDeleted,
        ),
    });


  const specialtiesQuery =
    useQuery({
      queryKey: [
        "specialties",
        "specialist-options",
      ],

      queryFn: () =>
        getSpecialties(true),
    });


  async function refreshSpecialists() {
    await queryClient.invalidateQueries({
      queryKey: ["specialists"],
    });
  }


  const createMutation =
    useMutation({
      mutationFn:
        createSpecialist,

      onSuccess:
        refreshSpecialists,
    });


  const updateMutation =
    useMutation({
      mutationFn: ({
        id,
        specialist,
      }: {
        id: number;
        specialist:
          SpecialistPayload;
      }) =>
        updateSpecialist(
          id,
          specialist,
        ),

      onSuccess:
        refreshSpecialists,
    });


  const statusMutation =
    useMutation({
      mutationFn: ({
        id,
        isActive,
      }: {
        id: number;
        isActive: boolean;
      }) =>
        changeSpecialistStatus(
          id,
          isActive,
        ),

      onSuccess:
        refreshSpecialists,
    });


  const deleteMutation =
    useMutation({
      mutationFn:
        deleteSpecialist,

      onSuccess:
        refreshSpecialists,
    });


  const restoreMutation =
    useMutation({
      mutationFn:
        restoreSpecialist,

      onSuccess:
        refreshSpecialists,
    });


  let queryError:
    Error | null = null;

  if (
    specialistsQuery.error
    instanceof Error
  ) {
    queryError =
      specialistsQuery.error;
  } else if (
    specialtiesQuery.error
    instanceof Error
  ) {
    queryError =
      specialtiesQuery.error;
  }


  async function refetchSpecialists() {
    await Promise.all([
      specialistsQuery.refetch(),
      specialtiesQuery.refetch(),
    ]);
  }


  return {
    specialists:
      specialistsQuery.data ?? [],

    specialties:
      specialtiesQuery.data ?? [],

    isLoading:
      specialistsQuery.isLoading ||
      specialtiesQuery.isLoading,

    isError:
      specialistsQuery.isError ||
      specialtiesQuery.isError,

    queryError,

    refetchSpecialists,

    createMutation,
    updateMutation,
    statusMutation,
    deleteMutation,
    restoreMutation,
  };
}