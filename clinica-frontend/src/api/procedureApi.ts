import type { Procedure, ProcedureFormData } from "../types/procedure";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getProcedures(): Promise<Procedure[]> {
  const response = await fetch(`${API_BASE_URL}/api/procedures/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener procedimientos");
  }

  return response.json();
}

export async function createProcedure(
  data: ProcedureFormData
): Promise<Procedure> {
  const response = await fetch(`${API_BASE_URL}/api/procedures/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Error al crear procedimiento");
  }

  return response.json();
}

export async function updateProcedure(
  id: number,
  data: ProcedureFormData
): Promise<Procedure> {
  const response = await fetch(`${API_BASE_URL}/api/procedures/${id}/`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar procedimiento");
  }

  return response.json();
}

export async function toggleProcedureStatus(
  id: number,
  isActive: boolean
): Promise<Procedure> {
  const response = await fetch(`${API_BASE_URL}/api/procedures/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      is_active: isActive,
    }),
  });

  if (!response.ok) {
    throw new Error("Error al cambiar estado del procedimiento");
  }

  return response.json();
}