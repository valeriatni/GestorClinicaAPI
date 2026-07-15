import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "../context/authContext";


export default function UnauthorizedPage() {
  const {
    user,
  } = useAuth();

  const returnRoute =
    user?.role === "Especialista"
      ? "/my-appointments"
      : "/dashboard";


  return (
    <div className="container py-5 text-center">
      <h1 className="display-5">
        Acceso denegado
      </h1>

      <p className="text-muted">
        Su usuario no tiene permisos para
        ingresar a este módulo.
      </p>

      <Link
        to={returnRoute}
        className="btn btn-primary"
      >
        Regresar
      </Link>
    </div>
  );
}