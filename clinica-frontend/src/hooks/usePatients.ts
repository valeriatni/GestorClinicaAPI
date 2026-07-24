import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createPatient,
  deactivatePatient,
  deletePatient,
  getPatients,
  reactivatePatient,
  restorePatient,
  updatePatient,
} from "../api/patientApi";

import type {
  PatientPayload,
} from "../types/patient";


export function usePatients(
  search: string,
  showInactive: boolean,
  showDeleted: boolean,
) {
  const queryClient =
    useQueryClient();

/*two */
  const patientsQuery = useQuery({
    queryKey: [
      "patients",
      search,
      showInactive,
      showDeleted,
    ],

    queryFn: () =>
      getPatients(
        search,
        showInactive,
        showDeleted,
      ),
  });


  async function refreshPatients() {
    await queryClient.invalidateQueries({
      queryKey: ["patients"],
    });
  }


  const createMutation =
    useMutation({
      mutationFn:
        createPatient,

      onSuccess:
        refreshPatients,
    });

/*one */
  const updateMutation =
    useMutation({
      mutationFn: ({
        id,
        patient,
      }: {
        id: number;
        patient:
          PatientPayload;
      }) =>
        updatePatient(
          id,
          patient,
        ),

      onSuccess:
        refreshPatients,
    });


  const deactivateMutation =
    useMutation({
      mutationFn: ({
        id,
        reason,
      }: {
        id: number;
        reason: string;
      }) =>
        deactivatePatient(
          id,
          reason,
        ),

      onSuccess:
        refreshPatients,
    });


  const reactivateMutation =
    useMutation({
      mutationFn:
        reactivatePatient,

      onSuccess:
        refreshPatients,
    });


  const deleteMutation =
    useMutation({
      mutationFn:
        deletePatient,

      onSuccess:
        refreshPatients,
    });


  const restoreMutation =
    useMutation({
      mutationFn:
        restorePatient,

      onSuccess:
        refreshPatients,
    });


  return {
    patients:
      patientsQuery.data ?? [],

    isLoading:
      patientsQuery.isLoading,

    isError:
      patientsQuery.isError,

    queryError:
      patientsQuery.error,

    refetch:
      patientsQuery.refetch,

    createMutation,
    updateMutation,
    deactivateMutation,
    reactivateMutation,
    deleteMutation,
    restoreMutation,
  };
}