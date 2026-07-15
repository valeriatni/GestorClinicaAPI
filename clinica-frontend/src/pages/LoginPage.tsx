import {
  useState,
  type FormEvent,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/authContext";

import type {
  AuthUser,
} from "../types/auth";


function getHomeRoute(
  user: AuthUser
): string {
  if (user.role === "Especialista") {
    return "/my-appointments";
  }

  return "/dashboard";
}


export default function LoginPage() {
  const navigate = useNavigate();

  const {
    user,
    login,
  } = useAuth();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);


  if (user) {
    return (
      <Navigate
        to={getHomeRoute(user)}
        replace
      />
    );
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const loggedUser = await login(
        username.trim(),
        password
      );

      navigate(
        getHomeRoute(loggedUser),
        {
          replace: true,
        }
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div
      className="
        min-vh-100
        d-flex
        align-items-center
        justify-content-center
        bg-light
      "
    >
      <div
        className="card shadow-sm"
        style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <div className="card-body p-4">
          <h2 className="text-center mb-2">
            Clínica Odontológica
          </h2>

          <p className="text-muted text-center mb-4">
            Ingrese sus credenciales
          </p>

          {error && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                htmlFor="username"
                className="form-label"
              >
                Usuario
              </label>

              <input
                id="username"
                type="text"
                className="form-control"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                required
                autoComplete="username"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="form-label"
              >
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Ingresando..."
                : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}