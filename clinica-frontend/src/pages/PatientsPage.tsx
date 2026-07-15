import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import PatientModal from "../components/PatientModal";

import {
  usePatients,
} from "../hooks/usePatients";

import type {
  Patient,
  PatientPayload,
} from "../types/patient";


export default function PatientsPage() {
  const navigate =
    useNavigate();

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
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
    selectedPatient,
    setSelectedPatient,
  ] = useState<Patient | null>(
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

  const [
    actionPatientId,
    setActionPatientId,
  ] = useState<number | null>(
    null,
  );

  const {
    patients,
    isLoading,
    isError,
    queryError,
    refetch,
    createMutation,
    updateMutation,
    deactivateMutation,
    reactivateMutation,
    deleteMutation,
    restoreMutation,
  } = usePatients(
    search,
    showInactive,
    showDeleted,
  );


  /*
   * Algunos backends utilizan show_deleted
   * para incluir eliminados junto con los
   * demás registros.
   *
   * Este filtro garantiza que la vista
   * "Ver eliminados" muestre solo eliminados.
   */
  const visiblePatients =
    patients.filter(
      (patient) =>
        showDeleted
          ? patient.is_deleted
          : !patient.is_deleted,
    );


  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }


  function handleSearch(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSearch(
      searchInput.trim(),
    );

    clearMessages();
  }


  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }


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

    setSelectedPatient(null);
    setShowModal(true);
  }


  function openEditModal(
    patient: Patient,
  ) {
    clearMessages();

    if (patient.is_deleted) {
      setErrorMessage(
        "Debe restaurar al paciente antes de editarlo.",
      );

      return;
    }

    setSelectedPatient(
      patient,
    );

    setShowModal(true);
  }


  async function savePatient(
    patientData:
      PatientPayload,
  ) {
    clearMessages();

    if (selectedPatient) {
      await updateMutation
        .mutateAsync({
          id:
            selectedPatient.id,

          patient:
            patientData,
        });

      setSuccessMessage(
        "Los datos del paciente se actualizaron correctamente.",
      );
    } else {
      await createMutation
        .mutateAsync(
          patientData,
        );

      setSuccessMessage(
        "El paciente se registró correctamente. Ya puede agendar una cita.",
      );
    }

    setShowModal(false);

    setSelectedPatient(
      null,
    );
  }


  async function handleDeactivate(
    patient: Patient,
  ) {
    clearMessages();

    const reason =
      window.prompt(
        `Ingrese el motivo para desactivar a ${patient.first_name} ${patient.last_name}:`,
      );

    if (reason === null) {
      return;
    }

    const cleanReason =
      reason.trim();

    if (!cleanReason) {
      setErrorMessage(
        "Debe ingresar un motivo de desactivación.",
      );

      return;
    }

    if (
      cleanReason.length < 5
    ) {
      setErrorMessage(
        "El motivo debe tener al menos 5 caracteres.",
      );

      return;
    }

    setActionPatientId(
      patient.id,
    );

    try {
      await deactivateMutation
        .mutateAsync({
          id: patient.id,
          reason: cleanReason,
        });

      setSuccessMessage(
        "El paciente fue desactivado. Sus datos no fueron eliminados.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo desactivar al paciente.",
      );
    } finally {
      setActionPatientId(
        null,
      );
    }
  }


  async function handleReactivate(
    patient: Patient,
  ) {
    clearMessages();

    const confirmed =
      window.confirm(
        `¿Desea reactivar a ${patient.first_name} ${patient.last_name}?`,
      );

    if (!confirmed) {
      return;
    }

    setActionPatientId(
      patient.id,
    );

    try {
      await reactivateMutation
        .mutateAsync(
          patient.id,
        );

      setSuccessMessage(
        "El paciente fue reactivado correctamente.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo reactivar al paciente.",
      );
    } finally {
      setActionPatientId(
        null,
      );
    }
  }


  async function handleDelete(
    patient: Patient,
  ) {
    clearMessages();

    const confirmed =
      window.confirm(
        `¿Desea eliminar a ${patient.first_name} ${patient.last_name}?\n\nEl paciente desaparecerá de la lista normal, pero permanecerá guardado en la base de datos.`,
      );

    if (!confirmed) {
      return;
    }

    setActionPatientId(
      patient.id,
    );

    try {
      await deleteMutation
        .mutateAsync(
          patient.id,
        );

      setSuccessMessage(
        "El paciente fue eliminado lógicamente.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar al paciente.",
      );
    } finally {
      setActionPatientId(
        null,
      );
    }
  }


  async function handleRestore(
    patient: Patient,
  ) {
    clearMessages();

    const confirmed =
      window.confirm(
        `¿Desea restaurar a ${patient.first_name} ${patient.last_name}?`,
      );

    if (!confirmed) {
      return;
    }

    setActionPatientId(
      patient.id,
    );

    try {
      await restoreMutation
        .mutateAsync(
          patient.id,
        );

      setSuccessMessage(
        "El paciente fue restaurado correctamente. Puede verlo nuevamente en la lista normal.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo restaurar al paciente.",
      );
    } finally {
      setActionPatientId(
        null,
      );
    }
  }


  function scheduleAppointment(
    patient: Patient,
  ) {
    clearMessages();

    if (patient.is_deleted) {
      setErrorMessage(
        "El paciente está eliminado y no puede recibir citas.",
      );

      return;
    }

    if (!patient.is_active) {
      setErrorMessage(
        "El paciente está inactivo y no puede recibir nuevas citas.",
      );

      return;
    }

    navigate(
      `/appointments?patient=${patient.id}`,
    );
  }


  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            {showDeleted
              ? "Pacientes eliminados"
              : "Pacientes"}
          </h2>

          <p className="text-muted mb-0">
            {showDeleted
              ? "Restaure pacientes eliminados lógicamente."
              : "Busque al paciente antes de registrarlo para evitar duplicados."}
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
            Registrar paciente
          </button>
        )}
      </div>

      {successMessage && (
        <div
          className="alert alert-success alert-dismissible"
          role="alert"
        >
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
        <div
          className="alert alert-danger alert-dismissible"
          role="alert"
        >
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
            <div className="col-md-5">
              <label className="form-label">
                Buscar paciente
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Nombre, apellido, DNI, celular o correo"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
              />
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
                onClick={clearSearch}
              >
                Limpiar
              </button>
            </div>

            <div className="col-md-1">
              <div className="form-check form-switch">
                <input
                  id="showInactive"
                  type="checkbox"
                  className="form-check-input"
                  checked={showInactive}
                  disabled={showDeleted}
                  onChange={(event) =>
                    setShowInactive(
                      event.target.checked,
                    )
                  }
                />

                <label
                  className="form-check-label"
                  htmlFor="showInactive"
                >
                  Inactivos
                </label>
              </div>
            </div>

            <div className="col-md-2">
              <div className="form-check form-switch">
                <input
                  id="showDeletedPatients"
                  type="checkbox"
                  className="form-check-input"
                  checked={showDeleted}
                  onChange={(event) =>
                    handleDeletedFilter(
                      event.target.checked,
                    )
                  }
                />

                <label
                  className="form-check-label"
                  htmlFor="showDeletedPatients"
                >
                  Ver eliminados
                </label>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            {showDeleted
              ? "Pacientes eliminados"
              : "Pacientes registrados"}
          </h5>
        </div>

        <div className="card-body">
          {isLoading && (
            <div className="text-center py-4">
              <div className="spinner-border" />

              <p className="mt-2">
                Cargando pacientes...
              </p>
            </div>
          )}

          {isError && (
            <div className="alert alert-danger">
              <p>
                {queryError instanceof Error
                  ? queryError.message
                  : "No se pudieron cargar los pacientes."}
              </p>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() =>
                  refetch()
                }
              >
                Intentar nuevamente
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            visiblePatients.length ===
              0 && (
              <div className="alert alert-info">
                {showDeleted
                  ? "No existen pacientes eliminados."
                  : "No se encontraron pacientes."}
              </div>
            )}

          {!isLoading &&
            !isError &&
            visiblePatients.length >
              0 && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Paciente</th>
                      <th>DNI</th>
                      <th>Celular</th>
                      <th>Correo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visiblePatients.map(
                      (patient) => {
                        const actionPending =
                          actionPatientId ===
                          patient.id;

                        return (
                          <tr
                            key={
                              patient.id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  patient.first_name
                                }{" "}
                                {
                                  patient.last_name
                                }
                              </strong>

                              {!patient.is_active &&
                                !patient.is_deleted &&
                                patient.inactive_reason && (
                                  <div>
                                    <small className="text-muted">
                                      Motivo:{" "}
                                      {
                                        patient.inactive_reason
                                      }
                                    </small>
                                  </div>
                                )}
                            </td>

                            <td>
                              {patient.dni}
                            </td>

                            <td>
                              {patient.phone ||
                                "—"}
                            </td>

                            <td>
                              {patient.email ||
                                "—"}
                            </td>

                            <td>
                              {patient.is_deleted ? (
                                <span className="badge text-bg-danger">
                                  Eliminado
                                </span>
                              ) : patient.is_active ? (
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
                              {patient.is_deleted ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() =>
                                    handleRestore(
                                      patient,
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
                                  {patient.is_active && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary"
                                      onClick={() =>
                                        scheduleAppointment(
                                          patient,
                                        )
                                      }
                                    >
                                      Agendar cita
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() =>
                                      openEditModal(
                                        patient,
                                      )
                                    }
                                  >
                                    Editar
                                  </button>

                                  {patient.is_active ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() =>
                                        handleDeactivate(
                                          patient,
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
                                        handleReactivate(
                                          patient,
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
                                        patient,
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
        <PatientModal
          patient={
            selectedPatient
          }
          isSaving={
            createMutation.isPending ||
            updateMutation.isPending
          }
          onClose={() => {
            setShowModal(false);

            setSelectedPatient(
              null,
            );
          }}
          onSave={
            savePatient
          }
        />
      )}
    </div>
  );
}