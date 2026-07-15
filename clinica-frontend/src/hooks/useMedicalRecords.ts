import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createMedicalRecord,
  getMedicalRecordPatients,
  getMedicalRecords,
  reactivateMedicalRecord,
  updateMedicalRecord,
} from "../api/medicalRecordApi";

import type {
  MedicalRecordPayload,
} from "../types/medicalRecord";


export function useMedicalRecords() {
  const queryClient =
    useQueryClient();

  const patientsQuery =
    useQuery({
      queryKey: [
        "medical-record-patients",
      ],

      queryFn:
        getMedicalRecordPatients,
    });

  const medicalRecordsQuery =
    useQuery({
      queryKey: [
        "medical-records",
      ],

      queryFn:
        getMedicalRecords,
    });


  const refreshMedicalRecords =
    async () => {
      await queryClient
        .invalidateQueries({
          queryKey: [
            "medical-records",
          ],
        });
    };


  const createMutation =
    useMutation({
      mutationFn:
        createMedicalRecord,

      onSuccess:
        refreshMedicalRecords,
    });


  const updateMutation =
    useMutation({
      mutationFn: ({
        id,
        medicalRecord,
      }: {
        id: number;

        medicalRecord:
          MedicalRecordPayload;
      }) =>
        updateMedicalRecord(
          id,
          medicalRecord,
        ),

      onSuccess:
        refreshMedicalRecords,
    });


  const reactivateMutation =
    useMutation({
      mutationFn:
        reactivateMedicalRecord,

      onSuccess:
        refreshMedicalRecords,
    });


  return {
    medicalRecords:
      medicalRecordsQuery.data ??
      [],

    patients:
      patientsQuery.data ?? [],

    isLoading:
      patientsQuery.isLoading ||
      medicalRecordsQuery.isLoading,

    isError:
      patientsQuery.isError ||
      medicalRecordsQuery.isError,

    queryError:
      patientsQuery.error ??
      medicalRecordsQuery.error,

    refetchMedicalRecords:
      async () => {
        await Promise.all([
          patientsQuery.refetch(),
          medicalRecordsQuery.refetch(),
        ]);
      },

    createMutation,
    updateMutation,
    reactivateMutation,
  };
}
