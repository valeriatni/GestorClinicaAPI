import { useEffect, useState } from "react";
import type { Procedure, ProcedureFormData } from "../types/procedure";

interface Props {
  procedure: Procedure | null;
  onClose: () => void;
  onSave: (data: ProcedureFormData) => Promise<void>;
}

export default function ProcedureModal({ procedure, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (procedure) {
      setName(procedure.name);
      setDescription(procedure.description || "");
      setBasePrice(procedure.base_price);
    } else {
      setName("");
      setDescription("");
      setBasePrice("");
    }
  }, [procedure]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }

    if (!basePrice || Number(basePrice) < 0) {
      alert("El precio debe ser mayor o igual a 0.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        name,
        description,
        base_price: basePrice,
      });

      onClose();
    } catch {
      alert("No se pudo guardar el procedimiento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">
                {procedure ? "Editar procedimiento" : "Crear procedimiento"}
              </h5>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Limpieza dental"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del procedimiento"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Precio base</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}