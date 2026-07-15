import {
  useState,
  type FormEvent,
} from "react";

import UserModal from "../components/users/UserModal";

import {
  useAuth,
} from "../context/authContext";

import {
  useUsers,
} from "../hooks/useUsers";

import type {
  ClinicUser,
  UserPayload,
  UserRole,
} from "../types/user";


function getRoleClass(
  role: UserRole | null,
): string {
  if (role === "Gerente") {
    return "text-bg-dark";
  }

  if (role === "Recepcionista") {
    return "text-bg-primary";
  }

  if (role === "Especialista") {
    return "text-bg-success";
  }

  return "text-bg-secondary";
}


function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}


export default function UsersPage() {
  const {
    user: authenticatedUser,
  } = useAuth();

  const {
    users,
    specialists,
    isLoading,
    isError,
    queryError,
    refetchUsers,
    createMutation,
    updateMutation,
    activateMutation,
    deactivateMutation,
    deleteMutation,
  } = useUsers();

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState<ClinicUser | null>(
    null,
  );

  const [
    actionUserId,
    setActionUserId,
  ] = useState<number | null>(
    null,
  );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  function clearMessages() {
    setSuccessMessage("");
    setErrorMessage("");
  }


  function handleSearch(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSearch(
      searchInput
        .trim()
        .toLowerCase(),
    );
  }


  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setRoleFilter("");
    setStatusFilter("all");
  }


  function openCreateModal() {
    clearMessages();

    setSelectedUser(null);
    setShowModal(true);
  }


  function openEditModal(
    user: ClinicUser,
  ) {
    clearMessages();

    setSelectedUser(user);
    setShowModal(true);
  }


  async function saveUser(
    userData: UserPayload,
  ) {
    clearMessages();

    if (selectedUser) {
      await updateMutation.mutateAsync({
        id: selectedUser.id,
        user: userData,
      });

      setSuccessMessage(
        "El usuario se actualizó correctamente.",
      );
    } else {
      await createMutation.mutateAsync(
        userData,
      );

      setSuccessMessage(
        "El usuario se creó correctamente.",
      );
    }

    setShowModal(false);
    setSelectedUser(null);
  }


  async function deactivate(
    user: ClinicUser,
  ) {
    clearMessages();

    if (
      user.id ===
      authenticatedUser?.id
    ) {
      setErrorMessage(
        "No puede desactivar su propio usuario.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `¿Desea desactivar al usuario ${user.username}?`,
      );

    if (!confirmed) {
      return;
    }

    setActionUserId(user.id);

    try {
      await deactivateMutation
        .mutateAsync(user.id);

      setSuccessMessage(
        "El usuario fue desactivado.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo desactivar el usuario.",
      );
    } finally {
      setActionUserId(null);
    }
  }


  async function activate(
    user: ClinicUser,
  ) {
    clearMessages();

    const confirmed =
      window.confirm(
        `¿Desea activar al usuario ${user.username}?`,
      );

    if (!confirmed) {
      return;
    }

    setActionUserId(user.id);

    try {
      await activateMutation
        .mutateAsync(user.id);

      setSuccessMessage(
        "El usuario fue activado.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo activar el usuario.",
      );
    } finally {
      setActionUserId(null);
    }
  }


  const filteredUsers =
    users
      .filter((user) => {
        if (!roleFilter) {
          return true;
        }

        return (
          user.role === roleFilter
        );
      })
      .filter((user) => {
        if (
          statusFilter === "active"
        ) {
          return user.is_active;
        }

        if (
          statusFilter === "inactive"
        ) {
          return !user.is_active;
        }

        return true;
      })
      .filter((user) => {
        if (!search) {
          return true;
        }

        const searchableText = `
          ${user.username}
          ${user.first_name}
          ${user.last_name}
          ${user.full_name}
          ${user.email}
          ${user.role ?? ""}
          ${user.specialist_name ?? ""}
        `.toLowerCase();

        return searchableText.includes(
          search,
        );
      })
      .sort(
        (firstUser, secondUser) =>
          firstUser.username.localeCompare(
            secondUser.username,
          ),
      );

  function handleDeleteUser(
    userId: number,
    username: string,
  ) {
    const confirmed = window.confirm(
      `¿Desea eliminar lógicamente al usuario ${username}?`,
    );

    if (!confirmed) {
      return;
    }

    const reason = window.prompt(
      "Ingrese el motivo de eliminación:",
    );

    if (!reason?.trim()) {
      window.alert(
        "Debe ingresar un motivo de eliminación.",
      );

      return;
    }

    deleteMutation.mutate({
      userId,
      reason: reason.trim(),
    });
  }


  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Usuarios</h2>

          <p className="text-muted mb-0">
            Cree cuentas y asigne los roles
            del personal de la clínica.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          Nuevo usuario
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success alert-dismissible">
          {successMessage}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setSuccessMessage("")
            }
          />
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger alert-dismissible">
          {errorMessage}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setErrorMessage("")
            }
          />
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <form
            className="row g-3 align-items-end"
            onSubmit={handleSearch}
          >
            <div className="col-md-4">
              <label className="form-label">
                Buscar
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Usuario, nombre, correo o especialista"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                Rol
              </label>

              <select
                className="form-select"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Todos
                </option>

                <option value="Gerente">
                  Gerente
                </option>

                <option value="Recepcionista">
                  Recepcionista
                </option>

                <option value="Especialista">
                  Especialista
                </option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                Estado
              </label>

              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
              >
                <option value="all">
                  Todos
                </option>

                <option value="active">
                  Activos
                </option>

                <option value="inactive">
                  Inactivos
                </option>
              </select>
            </div>

            <div className="col-md-2">
              <button
                type="submit"
                className="btn btn-outline-primary w-100"
              >
                Buscar
              </button>
            </div>

            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            Personal registrado
          </h5>
        </div>

        <div className="card-body">
          {isLoading && (
            <div className="text-center py-4">
              <div className="spinner-border" />

              <p className="mt-2">
                Cargando usuarios...
              </p>
            </div>
          )}

          {isError && (
            <div className="alert alert-danger">
              <p className="mb-3">
                {queryError instanceof Error
                  ? queryError.message
                  : "No se pudieron cargar los usuarios."}
              </p>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() =>
                  refetchUsers()
                }
              >
                Intentar nuevamente
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            filteredUsers.length ===
              0 && (
              <div className="alert alert-info">
                No existen usuarios que
                coincidan con los filtros.
              </div>
            )}

          {!isLoading &&
            !isError &&
            filteredUsers.length >
              0 && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Usuario</th>
                      <th>Personal</th>
                      <th>Rol</th>
                      <th>Especialista</th>
                      <th>Estado</th>
                      <th>Registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map(
                      (user) => {
                        const isOwnUser =
                          user.id ===
                          authenticatedUser?.id;

                        const actionPending =
                          actionUserId ===
                          user.id;

                        return (
                          <tr key={user.id}>
                            <td>
                              <strong>
                                {user.username}
                              </strong>

                              {isOwnUser && (
                                <div>
                                  <small className="text-primary">
                                    Tu usuario
                                  </small>
                                </div>
                              )}
                            </td>

                            <td>
                              <strong>
                                {user.full_name}
                              </strong>

                              {user.email && (
                                <div>
                                  <small className="text-muted">
                                    {user.email}
                                  </small>
                                </div>
                              )}
                            </td>

                            <td>
                              <span
                                className={
                                  `badge ${getRoleClass(
                                    user.role,
                                  )}`
                                }
                              >
                                {user.role ??
                                  "Sin rol"}
                              </span>
                            </td>

                            <td>
                              {user.specialist_name
                                ? `Dr(a). ${user.specialist_name}`
                                : "No corresponde"}
                            </td>

                            <td>
                              <span
                                className={
                                  user.is_active
                                    ? "badge text-bg-success"
                                    : "badge text-bg-secondary"
                                }
                              >
                                {user.is_active
                                  ? "Activo"
                                  : "Inactivo"}
                              </span>
                            </td>

                            <td>
                              {formatDate(
                                user.date_joined,
                              )}
                            </td>

                            <td>
                              <div className="d-flex gap-2 flex-wrap">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() =>
                                    openEditModal(
                                      user,
                                    )
                                  }
                                  disabled={
                                    actionPending
                                  }
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() =>
                                    handleDeleteUser(
                                      user.id,
                                      user.username,
                                    )
                                  }
                                  disabled={
                                    deleteMutation.isPending
                                  }
                                >
                                  Eliminar
                                </button>

                                {user.is_active ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() =>
                                      deactivate(
                                        user,
                                      )
                                    }
                                    disabled={
                                      actionPending ||
                                      isOwnUser
                                    }
                                    title={
                                      isOwnUser
                                        ? "No puede desactivar su propio usuario"
                                        : undefined
                                    }
                                  >
                                    Desactivar
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() =>
                                      activate(
                                        user,
                                      )
                                    }
                                    disabled={
                                      actionPending
                                    }
                                  >
                                    Activar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>

      {showModal && (
        <UserModal
          selectedUser={selectedUser}
          authenticatedUserId={
            authenticatedUser?.id
          }
          users={users}
          specialists={specialists}
          isSaving={
            createMutation.isPending ||
            updateMutation.isPending
          }
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onSave={saveUser}
        />
      )}
    </div>
  );
}