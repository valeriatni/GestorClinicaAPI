import {
  useState,
} from "react";

import SpecialtyModal from "../components/specialties/SpecialtyModal";

import {
  useSpecialties,
} from "../hooks/useSpecialties";

import type {
  Specialty,
  SpecialtyPayload,
} from "../types/specialty";

export default function SpecialtiesPage() {
  const [search, setSearch] =
    useState("");

  const [
    showInactive,
    setShowInactive,
  ] = useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [
    selectedSpecialty,
    setSelectedSpecialty,
  ] = useState<Specialty | null>(
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

  const {
    specialties,
    isLoading,
    isError,
    queryError,
    refetchSpecialties,
    createMutation,
    updateMutation,
    statusMutation,
  } = useSpecialties(showInactive);

  const filteredSpecialties =
    specialties.filter((specialty) => {
      const searchText =
        search.trim().toLowerCase();

      if (!searchText) {
        return true;
      }

      const specialtyText = `
        ${specialty.name}
        ${specialty.description ?? ""}
      `.toLowerCase();

      return specialtyText.includes(
        searchText,
      );
    });

  function openCreateModal() {
    setSelectedSpecialty(null);
    setShowModal(true);
    setSuccessMessage("");
    setErrorMessage("");
  }

  function openEditModal(
    specialty: Specialty,
  ) {
    setSelectedSpecialty(specialty);
    setShowModal(true);
    setSuccessMessage("");
    setErrorMessage("");
  }

  async function saveSpecialty(
    specialtyData: SpecialtyPayload,
  ) {
    if (selectedSpecialty) {
      await updateMutation.mutateAsync({
        id: selectedSpecialty.id,
        specialty: specialtyData,
      });

      setSuccessMessage(
        "La especialidad se actualizó correctamente.",
      );
    } else {
      await createMutation.mutateAsync(
        specialtyData,
      );

      setSuccessMessage(
        "La especialidad se registró correctamente. Ya puede asignarla a un especialista.",
      );
    }

    setShowModal(false);
    setSelectedSpecialty(null);
  }

  async function deactivateSpecialty(
    specialty: Specialty,
  ) {
    setSuccessMessage("");
    setErrorMessage("");

    const confirmed = window.confirm(
      `¿Desea desactivar la especialidad ${specialty.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await statusMutation.mutateAsync({
        id: specialty.id,
        isActive: false,
      });

      setSuccessMessage(
        "La especialidad fue desactivada. No aparecerá para nuevos especialistas.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo desactivar la especialidad.",
      );
    }
  }

  async function reactivateSpecialty(
    specialty: Specialty,
  ) {
    setSuccessMessage("");
    setErrorMessage("");

    const confirmed = window.confirm(
      `¿Desea reactivar la especialidad ${specialty.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await statusMutation.mutateAsync({
        id: specialty.id,
        isActive: true,
      });

      setSuccessMessage(
        "La especialidad fue reactivada correctamente.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo reactivar la especialidad.",
      );
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Especialidades</h2>

          <p className="text-muted mb-0">
            Administre las especialidades
            odontológicas de la clínica.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          Registrar especialidad
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
          <div className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="form-label">
                Buscar especialidad
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Nombre o descripción"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="col-md-4">
              <div className="form-check form-switch mb-2">
                <input
                  id="showInactiveSpecialties"
                  type="checkbox"
                  className="form-check-input"
                  checked={showInactive}
                  onChange={(event) =>
                    setShowInactive(
                      event.target.checked,
                    )
                  }
                />

                <label
                  className="form-check-label"
                  htmlFor="showInactiveSpecialties"
                >
                  Mostrar especialidades
                  inactivas
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            Especialidades registradas
          </h5>
        </div>

        <div className="card-body">
          {isLoading && (
            <div className="text-center py-4">
              <div className="spinner-border" />

              <p className="mt-2">
                Cargando especialidades...
              </p>
            </div>
          )}

          {isError && (
            <div className="alert alert-danger">
              <p>
                {queryError instanceof Error
                  ? queryError.message
                  : "No se pudieron cargar las especialidades."}
              </p>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() =>
                  refetchSpecialties()
                }
              >
                Intentar nuevamente
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            filteredSpecialties.length ===
              0 && (
              <div className="alert alert-info">
                No se encontraron
                especialidades.
              </div>
            )}

          {!isLoading &&
            !isError &&
            filteredSpecialties.length >
              0 && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Especialidad</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSpecialties.map(
                      (specialty) => (
                        <tr
                          key={specialty.id}
                        >
                          <td>
                            <strong>
                              {
                                specialty.name
                              }
                            </strong>
                          </td>

                          <td>
                            {specialty.description ||
                              "Sin descripción"}
                          </td>

                          <td>
                            {specialty.is_active ? (
                              <span className="badge text-bg-success">
                                Activa
                              </span>
                            ) : (
                              <span className="badge text-bg-secondary">
                                Inactiva
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  openEditModal(
                                    specialty,
                                  )
                                }
                              >
                                Editar
                              </button>

                              {specialty.is_active ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    deactivateSpecialty(
                                      specialty,
                                    )
                                  }
                                  disabled={
                                    statusMutation.isPending
                                  }
                                >
                                  Desactivar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() =>
                                    reactivateSpecialty(
                                      specialty,
                                    )
                                  }
                                  disabled={
                                    statusMutation.isPending
                                  }
                                >
                                  Reactivar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>

      {showModal && (
        <SpecialtyModal
          specialty={
            selectedSpecialty
          }
          specialties={specialties}
          isSaving={
            createMutation.isPending ||
            updateMutation.isPending
          }
          onClose={() => {
            setShowModal(false);
            setSelectedSpecialty(null);
          }}
          onSave={saveSpecialty}
        />
      )}
    </div>
  );
}