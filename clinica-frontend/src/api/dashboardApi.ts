import type { DashboardSummary } from "../types/dashboard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const token = localStorage.getItem("access_token");

  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("TOKEN:", token);

  const response = await fetch(`${API_BASE_URL}/api/dashboard/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("STATUS DASHBOARD:", response.status);

  const data = await response.json();
  console.log("DATA DASHBOARD:", data);

  if (!response.ok) {
    throw new Error("Error al obtener resumen del dashboard");
  }

  return data;
}