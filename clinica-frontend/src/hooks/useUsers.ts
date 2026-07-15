import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  activateUser,
  createUser,
  deactivateUser,
  getUsers,
  getUserSpecialists,
  updateUser,
  deleteUser,
} from "../api/userApi";

import type {
  UserPayload,
} from "../types/user";


export function useUsers() {
  const queryClient =
    useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const specialistsQuery = useQuery({
    queryKey: [
      "user-specialists",
    ],
    queryFn: getUserSpecialists,
  });


  async function refreshData() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["users"],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "user-specialists",
        ],
      }),
    ]);
  }


  const createMutation =
    useMutation({
      mutationFn: createUser,

      onSuccess: refreshData,
    });


  const updateMutation =
    useMutation({
      mutationFn: ({
        id,
        user,
      }: {
        id: number;
        user:
          Partial<UserPayload>;
      }) =>
        updateUser(
          id,
          user,
        ),

      onSuccess: refreshData,
    });


  const activateMutation =
    useMutation({
      mutationFn: activateUser,

      onSuccess: refreshData,
    });


  const deactivateMutation =
    useMutation({
      mutationFn: deactivateUser,

      onSuccess: refreshData,
    });


  async function refetchUsers() {
    await Promise.all([
      usersQuery.refetch(),
      specialistsQuery.refetch(),
    ]);
  }

  const deleteMutation = useMutation({
    mutationFn: ({
      userId,
      reason,
    }: {
      userId: number;
      reason: string;
    }) => deleteUser(userId, reason),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });


  return {
    users:
      usersQuery.data ?? [],

    specialists:
      specialistsQuery.data ?? [],

    isLoading:
      usersQuery.isLoading ||
      specialistsQuery.isLoading,

    isError:
      usersQuery.isError ||
      specialistsQuery.isError,

    queryError:
      usersQuery.error ??
      specialistsQuery.error,

    refetchUsers,

    createMutation,
    updateMutation,
    activateMutation,
    deactivateMutation,
    deleteMutation,
  };
}