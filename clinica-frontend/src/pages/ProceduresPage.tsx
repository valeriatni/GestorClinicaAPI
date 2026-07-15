import { useMemo, useState } from "react";
import ProcedureModal from "../components/ProcedureModal";
import { useProcedures } from "../hooks/useProcedures";
import type { Procedure, ProcedureFormData } from "../types/procedure";

export default function ProceduresPage() {
  const {
    procedures,
    isLoading,
    isError,
    createProcedure,
    updateProcedure,
    toggleProcedureStatus,
  } = useProcedures();

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(
    null
  );

  const filteredProcedures = useMemo(() => {
    const text = search.toLowerCase().trim();

    return procedures.filter((procedure) => {
      const matchesSearch =
        procedure.name.toLowerCase().includes(text) ||
        procedure.description?.toLowerCase().includes(text);

      const matchesStatus = showInactive ? true : procedure.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [procedures, search, showInactive]);

  function handleCreate() {
    setSelectedProcedure(null);
    setShowModal(true);
  }

  function handleEdit(procedure: Procedure) {
    setSelectedProcedure(procedure);
    setShowModal(true);
  }

  async function handleSave(data: ProcedureFormData) {
    if (selectedProcedure) {
      await updateProcedure({
        id: selectedProcedure.id,
        data,
      });
    } else {
      await createProcedure(data);
    }
  }

  async function handleToggle(procedure: Procedure) {
    const message = procedure.is_active
      ? "¿Deseas desactivar este procedimiento?"
      : "¿Deseas activar este procedimiento?";

    if (!confirm(message)) return;

    await toggleProcedureStatus({
      id: procedure.id,
      isActive: !procedure.is_active,
    });
  }

  if (isLoading) {
    return <div className="container mt-4">Cargando procedimientos...</div>;
  }

  if (isError) {
    return (
      <div className="container mt-4 alert alert-danger">
        Error al cargar procedimientos.
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Procedimientos</h2>

        <button className="btn btn-primary" onClick={handleCreate}>
          Crear procedimiento
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body row g-3">
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-4 d-flex align-items-center">
            <div className="form-check">
              <input
                id="showInactiveProcedures"
                className="form-check-input"
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />

              <label
                className="form-check-label"
                htmlFor="showInactiveProcedures"
              >
                Mostrar inactivos
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header fw-bold">Lista de procedimientos</div>

        <div className="card-body">
          {filteredProcedures.length === 0 ? (
            <p className="text-muted mb-0">No hay procedimientos registrados.</p>
          ) : (
            <table className="table table-bordered table-hover align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio base</th>
                  <th>Estado</th>
                  <th style={{ width: "210px" }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredProcedures.map((procedure) => (
                  <tr key={procedure.id}>
                    <td>{procedure.name}</td>
                    <td>{procedure.description || "-"}</td>
                    <td>S/ {procedure.base_price}</td>
                    <td>
                      <span
                        className={`badge ${
                          procedure.is_active
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {procedure.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(procedure)}
                      >
                        Editar
                      </button>

                      <button
                        className={`btn btn-sm ${
                          procedure.is_active
                            ? "btn-outline-danger"
                            : "btn-outline-success"
                        }`}
                        onClick={() => handleToggle(procedure)}
                      >
                        {procedure.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <ProcedureModal
          procedure={selectedProcedure}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            await handleSave(data);
          }}
        />
      )}
    </div>
  );
}