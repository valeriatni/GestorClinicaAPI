import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/authContext";

import type {
  UserRole,
} from "../types/auth";


interface RoleRouteProps {
  allowedRoles: UserRole[];
}


function getHomeRoute(
  role: UserRole
): string {
  if (role === "Especialista") {
    return "/my-appointments";
  }

  return "/dashboard";
}


export default function RoleRoute({
  allowedRoles,
}: RoleRouteProps) {
  const {
    user,
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
          Comprobando permisos...
        </p>
      </div>
    );
  }


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={getHomeRoute(user.role)}
        replace
      />
    );
  }


  return <Outlet />;
}