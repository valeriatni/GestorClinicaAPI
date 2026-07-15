import {
  useState,
} from "react";

import SpecialistModal from "../components/specialists/SpecialistModal";

import {
  useSpecialists,
} from "../hooks/useSpecialists";

import type {
  Specialist,
  SpecialistPayload,
} from "../types/specialist";


export default function SpecialistsPage() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    selectedSpecialty,
    setSelectedSpecialty,
  ] = useState("");

  const [
    showInactive,
    setShowInactive,
  ] = useState(false);

  const [
    showDeleted,
    setShowDeleted,
  ] = useState(false);

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    selectedSpecialist,
    setSelectedSpecialist,
  ] = useState<
    Specialist | null
  >(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    actionSpecialistId,
    setActionSpecialistId,
  ] = useState<number | null>(
    null,
  );

  const {
    specialists,
    specialties,
    isLoading,
    isError,
    queryError,
    refetchSpecialists,
    createMutation,
    updateMutation,
    statusMutation,
    deleteMutation,
    restoreMutation,
  } = useSpecialists(
    showInactive,
    showDeleted,
  );


  function clearMessages() {
    setSuccessMessage("");
    setErrorMessage("");
  }


  function findSpecialtyName(
    specialtyId: number,
  ): string {
    const specialty =
      specialties.find(
        (currentSpecialty) =>
          currentSpecialty.id ===
          specialtyId,
      );

    return (
      specialty?.name ||
      "Especialidad no encontrada"
    );
  }


  const visibleSpecialists =
    specialists
      .filter(
        (specialist) =>
          showDeleted
            ? specialist.is_deleted
            : !specialist.is_deleted,
      )
      .filter(
        (specialist) => {
          const searchText =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            !searchText ||
            `
              ${specialist.first_name}
              ${specialist.last_name}
              ${specialist.license_number}
              ${specialist.phone ?? ""}
              ${specialist.email ?? ""}
              ${findSpecialtyName(
                specialist.specialty,
              )}
            `
              .toLowerCase()
              .includes(
                searchText,
              );

          const matchesSpecialty =
            !selectedSpecialty ||
            specialist.specialty ===
              Number(
                selectedSpecialty,
              );

          return (
            matchesSearch &&
            matchesSpecialty
          );
        },
      );


  function handleDeletedFilter(
    checked: boolean,
  ) {
    setShowDeleted(checked);

    if (checked) {
      setShowInactive(true);
    }

    clearMessages();
  }


  function openCreateModal() {
    clearMessages();

    const activeSpecialties =
      specialties.filter(
        (specialty) =>
          specialty.is_active,
      );

    if (
      activeSpecialties.length === 0
    ) {
      setErrorMessage(
        "Primero debe registrar o activar una especialidad.",
      );

      return;
    }

    setSelectedSpecialist(
      null,
    );

    setShowModal(true);
  }


  function openEditModal(
    specialist: Specialist,
  ) {
    clearMessages();

    if (specialist.is_deleted) {
      setErrorMessage(
        "Debe restaurar al especialista antes de editarlo.",
      );

      return;
    }

    setSelectedSpecialist(
      specialist,
    );

    setShowModal(true);
  }


  async function saveSpecialist(
    specialistData:
      SpecialistPayload,
  ) {
    clearMessages();

    if (selectedSpecialist) {
      await updateMutation
        .mutateAsync({
          id:
            selectedSpecialist.id,

          specialist:
            specialistData,
        });

      setSuccessMessage(
        "Los datos del especialista se actualizaron correctamente.",
      );
    } else {
      await createMutation
        .mutateAsync(
          specialistData,
        );

      setSuccessMessage(
        "El especialista se registró correctamente. Ya puede ser seleccionado al agendar citas.",
      );
    }

    setShowModal(false);

    setSelectedSpecialist(
      null,
    );
  }


  async function deactivateSpecialist(
    specialist: Specialist,
  ) {
    clearMessages();

    const confirmed =
      window.confirm(
        `¿Desea desactivar al especialista Dr(a). ${specialist.first_name} ${specialist.last_name}?`,
      );

    if (!confirmed) {
      return;
    }

    setActionSpecialistId(
      specialist.id,
    );

    try {
      await statusMutation
        .mutateAsync({
          id: specialist.id,
          isActive: false,
        });

      setSuccessMessage(
        "El especialista fue desactivado. Ya no podrá seleccionarse para nuevas citas.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo desactivar al especialista.",
      );
    } finally {
      setActionSpecialistId(
        null,
      );
    }
  }


  async function reactivateSpecialist(
    specialist: Specialist,
  ) {
    clearMessages();

    const specialty =
      specialties.find(
        (currentSpecialty) =>
          currentSpecialty.id ===
          specialist.specialty,
      );

    if (!specialty) {
      setErrorMessage(
        "No se encontró la especialidad del especialista.",
      );

      return;
    }

    if (!specialty.is_active) {
      setErrorMessage(
        `No puede reactivar al especialista porque la especialidad ${specialty.name} está inactiva.`,
      );

      return;
    }

    const confirmed =
      window.confirm(
        `¿Desea reactivar al especialista Dr(a). ${specialist.first_name} ${specialist.last_name}?`,
      );

    if (!confirmed) {
      return;
    }

    setActionSpecialistId(
      specialist.id,
    );

    try {
      await statusMutation
        .mutateAsync({
          id: specialist.id,
          isActive: true,
        });

      setSuccessMessage(
        "El especialista fue reactivado correctamente.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo reactivar al especialista.",
      );
    } finally {
      setActionSpecialistId(
        null,
      );
    }
  }


  async function handleDelete(
    specialist: Specialist,
  ) {
    clearMessages();

    const confirmed =
      window.confirm(
        `¿Desea eliminar al especialista Dr(a). ${specialist.first_name} ${specialist.last_name}?\n\nDesaparecerá de la lista normal, pero permanecerá guardado en la base de datos.`,
      );

    if (!confirmed) {
      return;
    }

    setActionSpecialistId(
      specialist.id,
    );

    try {
      await deleteMutation
        .mutateAsync(
          specialist.id,
        );

      setSuccessMessage(
        "El especialista fue eliminado lógicamente.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar al especialista.",
      );
    } finally {
      setActionSpecialistId(
        null,
      );
    }
  }


  async function handleRestore(
    specialist: Specialist,
  ) {
    clearMessages();

    const confirmed =
      window.confirm(
        `¿Desea restaurar al especialista Dr(a). ${specialist.first_name} ${specialist.last_name}?`,
      );

    if (!confirmed) {
      return;
    }

    setActionSpecialistId(
      specialist.id,
    );

    try {
      await restoreMutation
        .mutateAsync(
          specialist.id,
        );

      setSuccessMessage(
        "El especialista fue restaurado correctamente. Puede verlo nuevamente en la lista normal.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo restaurar al especialista.",
      );
    } finally {
      setActionSpecialistId(
        null,
      );
    }
  }


  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            {showDeleted
              ? "Especialistas eliminados"
              : "Especialistas"}
          </h2>

          <p className="text-muted mb-0">
            {showDeleted
              ? "Restaure especialistas eliminados lógicamente."
              : "Administre los especialistas que atenderán las citas de la clínica."}
          </p>
        </div>

        {!showDeleted && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={
              openCreateModal
            }
          >
            Registrar especialista
          </button>
        )}
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
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">
                Buscar especialista
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Nombre, colegiatura, celular, correo o especialidad"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                Filtrar por especialidad
              </label>

              <select
                className="form-select"
                value={
                  selectedSpecialty
                }
                onChange={(event) =>
                  setSelectedSpecialty(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Todas las especialidades
                </option>

                {specialties.map(
                  (specialty) => (
                    <option
                      key={specialty.id}
                      value={specialty.id}
                    >
                      {specialty.name}

                      {!specialty.is_active
                        ? " - Inactiva"
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="col-md-2">
              <div className="form-check form-switch mb-2">
                <input
                  id="showInactiveSpecialists"
                  type="checkbox"
                  className="form-check-input"
                  checked={
                    showInactive
                  }
                  disabled={
                    showDeleted
                  }
                  onChange={(event) =>
                    setShowInactive(
                      event.target.checked,
                    )
                  }
                />

                <label
                  className="form-check-label"
                  htmlFor="showInactiveSpecialists"
                >
                  Mostrar inactivos
                </label>
              </div>
            </div>

            <div className="col-md-3">
              <div className="form-check form-switch mb-2">
                <input
                  id="showDeletedSpecialists"
                  type="checkbox"
                  className="form-check-input"
                  checked={
                    showDeleted
                  }
                  onChange={(event) =>
                    handleDeletedFilter(
                      event.target.checked,
                    )
                  }
                />

                <label
                  className="form-check-label"
                  htmlFor="showDeletedSpecialists"
                >
                  Ver eliminados
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            {showDeleted
              ? "Especialistas eliminados"
              : "Especialistas registrados"}
          </h5>
        </div>

        <div className="card-body">
          {isLoading && (
            <div className="text-center py-4">
              <div className="spinner-border" />

              <p className="mt-2">
                Cargando especialistas...
              </p>
            </div>
          )}

          {isError && (
            <div className="alert alert-danger">
              <p>
                {queryError
                  ? queryError.message
                  : "No se pudieron cargar los especialistas."}
              </p>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() =>
                  refetchSpecialists()
                }
              >
                Intentar nuevamente
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            visibleSpecialists.length ===
              0 && (
              <div className="alert alert-info">
                {showDeleted
                  ? "No existen especialistas eliminados."
                  : "No se encontraron especialistas."}
              </div>
            )}

          {!isLoading &&
            !isError &&
            visibleSpecialists.length >
              0 && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>
                        Especialista
                      </th>

                      <th>
                        Especialidad
                      </th>

                      <th>
                        Colegiatura
                      </th>

                      <th>
                        Contacto
                      </th>

                      <th>
                        Estado
                      </th>

                      <th>
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleSpecialists.map(
                      (specialist) => {
                        const actionPending =
                          actionSpecialistId ===
                          specialist.id;

                        return (
                          <tr
                            key={
                              specialist.id
                            }
                          >
                            <td>
                              <strong>
                                Dr(a).{" "}
                                {
                                  specialist.first_name
                                }{" "}
                                {
                                  specialist.last_name
                                }
                              </strong>
                            </td>

                            <td>
                              {findSpecialtyName(
                                specialist.specialty,
                              )}
                            </td>

                            <td>
                              {
                                specialist.license_number
                              }
                            </td>

                            <td>
                              <div>
                                {specialist.phone ||
                                  "Sin celular"}
                              </div>

                              <small className="text-muted">
                                {specialist.email ||
                                  "Sin correo"}
                              </small>
                            </td>

                            <td>
                              {specialist.is_deleted ? (
                                <span className="badge text-bg-danger">
                                  Eliminado
                                </span>
                              ) : specialist.is_active ? (
                                <span className="badge text-bg-success">
                                  Activo
                                </span>
                              ) : (
                                <span className="badge text-bg-secondary">
                                  Inactivo
                                </span>
                              )}
                            </td>

                            <td>
                              {specialist.is_deleted ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() =>
                                    handleRestore(
                                      specialist,
                                    )
                                  }
                                  disabled={
                                    actionPending
                                  }
                                >
                                  Restaurar
                                </button>
                              ) : (
                                <div className="d-flex gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() =>
                                      openEditModal(
                                        specialist,
                                      )
                                    }
                                  >
                                    Editar
                                  </button>

                                  {specialist.is_active ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() =>
                                        deactivateSpecialist(
                                          specialist,
                                        )
                                      }
                                      disabled={
                                        actionPending
                                      }
                                    >
                                      Desactivar
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() =>
                                        reactivateSpecialist(
                                          specialist,
                                        )
                                      }
                                      disabled={
                                        actionPending
                                      }
                                    >
                                      Reactivar
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() =>
                                      handleDelete(
                                        specialist,
                                      )
                                    }
                                    disabled={
                                      actionPending
                                    }
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              )}
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
        <SpecialistModal
          specialist={
            selectedSpecialist
          }
          specialists={
            specialists.filter(
              (specialist) =>
                !specialist.is_deleted,
            )
          }
          specialties={
            specialties
          }
          isSaving={
            createMutation.isPending ||
            updateMutation.isPending
          }
          onClose={() => {
            setShowModal(false);

            setSelectedSpecialist(
              null,
            );
          }}
          onSave={
            saveSpecialist
          }
        />
      )}
    </div>
  );
}