import {
  NavLink,
} from "react-router-dom";

import {
  useAuth,
} from "../context/authContext";


function getLinkClass({
  isActive,
}: {
  isActive: boolean;
}) {
  return isActive
    ? "sidebar-link active"
    : "sidebar-link";
}


export function Sidebar() {
  const {
    user,
  } = useAuth();


  if (!user) {
    return null;
  }


  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">
          🦷
        </span>

        <div>
          <h2>Clínica</h2>
          <p>Odontológica</p>
        </div>
      </div>

      <div className="sidebar-user">
        <span className="sidebar-user-name">
          {user.full_name ||
            user.username}
        </span>

        <span className="sidebar-user-role">
          {user.role}
        </span>
      </div>

      <nav className="sidebar-nav">
        {user.role ===
          "Gerente" && (
          <>
            <p className="sidebar-section">
              Administración
            </p>

            <NavLink
              to="/dashboard"
              className={getLinkClass}
            >
              <span>▦</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/users"
              className={getLinkClass}
            >
              <span>♙</span>
              Usuarios
            </NavLink>

            <NavLink
              to="/specialties"
              className={getLinkClass}
            >
              <span>✦</span>
              Especialidades
            </NavLink>

            <NavLink
              to="/specialists"
              className={getLinkClass}
            >
              <span>♙</span>
              Especialistas
            </NavLink>

            <NavLink
              to="/procedures"
              className={getLinkClass}
            >
              <span>☷</span>
              Procedimientos
            </NavLink>
          </>
        )}

        {user.role ===
          "Recepcionista" && (
          <>
            <p className="sidebar-section">
              Recepción
            </p>

            <NavLink
              to="/dashboard"
              className={getLinkClass}
            >
              <span>▦</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/patients"
              className={getLinkClass}
            >
              <span>♙</span>
              Pacientes
            </NavLink>

            <NavLink
              to="/appointments"
              className={getLinkClass}
            >
              <span>▣</span>
              Citas
            </NavLink>

            <NavLink
              to="/budgets"
              className={getLinkClass}
            >
              <span>▤</span>
              Presupuestos
            </NavLink>

            <NavLink
              to="/payments"
              className={getLinkClass}
            >
              <span>S/</span>
              Pagos
            </NavLink>
          </>
        )}

        {user.role === "Especialista" && (
          <>
            <p className="sidebar-section">
              Atención médica
            </p>

            <NavLink
              to="/my-appointments"
              className={getLinkClass}
            >
              <span>▣</span>
              Mis citas
            </NavLink>

            <NavLink
              to="/medical-records"
              className={getLinkClass}
            >
              <span>▤</span>
              Historias clínicas
            </NavLink>

            <NavLink
              to="/suggested-treatments"
              className={getLinkClass}
            >
              <span>✚</span>
              Atención y tratamientos
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}