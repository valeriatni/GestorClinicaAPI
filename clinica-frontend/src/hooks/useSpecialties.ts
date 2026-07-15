import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  changeSpecialtyStatus,
  createSpecialty,
  getSpecialties,
  updateSpecialty,
} from "../api/specialtyApi";

import type {
  SpecialtyPayload,
} from "../types/specialty";

export function useSpecialties(
  showInactive: boolean,
) {
  const queryClient = useQueryClient();

  const specialtiesQuery = useQuery({
    queryKey: [
      "specialties",
      showInactive,
    ],

    queryFn: () =>
      getSpecialties(showInactive),
  });

  const createMutation = useMutation({
    mutationFn: createSpecialty,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["specialties"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      specialty,
    }: {
      id: number;
      specialty: SpecialtyPayload;
    }) =>
      updateSpecialty(
        id,
        specialty,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["specialties"],
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: number;
      isActive: boolean;
    }) =>
      changeSpecialtyStatus(
        id,
        isActive,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["specialties"],
      });
    },
  });

  return {
    specialties:
      specialtiesQuery.data ?? [],

    isLoading:
      specialtiesQuery.isLoading,

    isError:
      specialtiesQuery.isError,

    queryError:
      specialtiesQuery.error,

    refetchSpecialties:
      specialtiesQuery.refetch,

    createMutation,
    updateMutation,
    statusMutation,
  };
}