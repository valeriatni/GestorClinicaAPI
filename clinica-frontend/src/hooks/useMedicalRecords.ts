import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
} from "../api/medicalRecordApi";

import { getPatients } from "../api/patientApi";

import type {
  MedicalRecordPayload,
} from "../types/medicalRecord";

export function useMedicalRecords() {
  const queryClient = useQueryClient();

  const medicalRecordsQuery = useQuery({
    queryKey: ["medical-records"],
    queryFn: getMedicalRecords,
  });

  const patientsQuery = useQuery({
    queryKey: ["patients", "medical-record-options"],
    queryFn: () => getPatients("", false),
  });

  const createMutation = useMutation({
    mutationFn: createMedicalRecord,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medical-records"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      medicalRecord,
    }: {
      id: number;
      medicalRecord: MedicalRecordPayload;
    }) =>
      updateMedicalRecord(id, medicalRecord),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medical-records"],
      });
    },
  });

  let queryError: Error | null = null;

  if (medicalRecordsQuery.error instanceof Error) {
    queryError = medicalRecordsQuery.error;
  } else if (patientsQuery.error instanceof Error) {
    queryError = patientsQuery.error;
  }

  return {
    medicalRecords:
      medicalRecordsQuery.data ?? [],

    patients:
      patientsQuery.data ?? [],

    isLoading:
      medicalRecordsQuery.isLoading ||
      patientsQuery.isLoading,

    isError:
      medicalRecordsQuery.isError ||
      patientsQuery.isError,

    queryError,

    refetchMedicalRecords:
      medicalRecordsQuery.refetch,

    createMutation,
    updateMutation,
  };
}