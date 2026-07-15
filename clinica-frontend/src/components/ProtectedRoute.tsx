import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/authContext";


export default function ProtectedRoute() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth();


  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border"
          role="status"
        />

        <p className="mt-3">
          Verificando sesión...
        </p>
      </div>
    );
  }


  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return <Outlet />;
}