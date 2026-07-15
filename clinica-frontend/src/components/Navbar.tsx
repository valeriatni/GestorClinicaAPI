import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/authContext";


export default function Navbar() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();


  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }


  if (!user) {
    return null;
  }


  return (
    <header className="top-navbar">
      <div className="navbar-title">
        Sistema de Clínica Odontológica
      </div>

      <div className="navbar-user">
        <div className="navbar-user-info">
          <span className="navbar-user-name">
            {user.full_name || user.username}
          </span>

          <span className="navbar-user-role">
            {user.role}

            {user.specialist_name
              ? ` · ${user.specialist_name}`
              : ""}
          </span>
        </div>

        <button
          type="button"
          className="btn-logout"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}