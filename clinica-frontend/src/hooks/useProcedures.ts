import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProcedure,
  getProcedures,
  toggleProcedureStatus,
  updateProcedure,
} from "../api/procedureApi";

export function useProcedures() {
  const queryClient = useQueryClient();

  const proceduresQuery = useQuery({
    queryKey: ["procedures"],
    queryFn: getProcedures,
  });

  const createMutation = useMutation({
    mutationFn: createProcedure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name: string;
        description: string;
        base_price: string;
      };
    }) => updateProcedure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleProcedureStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    },
  });

  return {
    procedures: proceduresQuery.data ?? [],
    isLoading: proceduresQuery.isLoading,
    isError: proceduresQuery.isError,
    createProcedure: createMutation.mutateAsync,
    updateProcedure: updateMutation.mutateAsync,
    toggleProcedureStatus: toggleMutation.mutateAsync,
  };
}