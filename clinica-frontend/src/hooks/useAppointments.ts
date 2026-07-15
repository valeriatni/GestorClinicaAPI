import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createAppointment,
  getAppointments,
  getAppointmentSpecialists,
  updateAppointment,
} from "../api/appointmentApi";

import { getPatients } from "../api/patientApi";

import type {
  AppointmentPayload,
} from "../types/appointment";

export function useAppointments() {
  const queryClient = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  const patientsQuery = useQuery({
    queryKey: ["patients", "appointment-options"],
    queryFn: () => getPatients("", true),
  });

  const specialistsQuery = useQuery({
    queryKey: ["specialists", "appointment-options"],
    queryFn: getAppointmentSpecialists,
  });

  const createMutation = useMutation({
    mutationFn: createAppointment,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      appointment,
    }: {
      id: number;
      appointment: Partial<AppointmentPayload>;
    }) => updateAppointment(id, appointment),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });

  let queryError: Error | null = null;

  if (appointmentsQuery.error instanceof Error) {
    queryError = appointmentsQuery.error;
  } else if (patientsQuery.error instanceof Error) {
    queryError = patientsQuery.error;
  } else if (
    specialistsQuery.error instanceof Error
  ) {
    queryError = specialistsQuery.error;
  }

  return {
    appointments: appointmentsQuery.data ?? [],
    patients: patientsQuery.data ?? [],
    specialists: specialistsQuery.data ?? [],

    isLoading:
      appointmentsQuery.isLoading ||
      patientsQuery.isLoading ||
      specialistsQuery.isLoading,

    isError:
      appointmentsQuery.isError ||
      patientsQuery.isError ||
      specialistsQuery.isError,

    queryError,

    refetchAppointments:
      appointmentsQuery.refetch,

    createMutation,
    updateMutation,
  };
}