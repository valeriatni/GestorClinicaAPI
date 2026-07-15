import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import MainLayout from "./components/MainLayout";

import LoginPage from "./pages/LoginPage";
import {DashboardPage} from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";
import SuggestedTreatmentsPage from "./pages/SuggestedTreatmentsPage";
import BudgetsPage from "./pages/BudgetsPage";
import PaymentsPage from "./pages/PaymentsPage";
import SpecialtiesPage from "./pages/SpecialtiesPage";
import SpecialistsPage from "./pages/SpecialistsPage";
import ProceduresPage from "./pages/ProceduresPage";
import UsersPage from "./pages/UsersPage";

import { useAuth } from "./context/authContext";


function HomeRedirect() {
  const {
    user,
  } = useAuth();


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (user.role === "Especialista") {
    return (
      <Navigate
        to="/my-appointments"
        replace
      />
    );
  }


  return (
    <Navigate
      to="/dashboard"
      replace
    />
  );
}


export default function App() {
  return (
    <Routes>
      {/* RUTA PÚBLICA */}
      <Route
        path="/login"
        element={<LoginPage />}
      />

      {/* RUTAS CON SESIÓN */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route
            index
            element={<HomeRedirect />}
          />

          {/* DASHBOARD */}
          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "Gerente",
                  "Recepcionista",
                ]}
              />
            }
          >
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />
          </Route>

          {/* RECEPCIÓN Y GERENTE */}
          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "Recepcionista",
                  "Gerente",
                ]}
              />
            }
          >
            <Route
              path="/patients"
              element={<PatientsPage />}
            />

            <Route
              path="/appointments"
              element={<AppointmentsPage />}
            />

            <Route
              path="/budgets"
              element={<BudgetsPage />}
            />

            <Route
              path="/payments"
              element={<PaymentsPage />}
            />
          </Route>

          {/* SOLO ESPECIALISTA */}
          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "Especialista",
                ]}
              />
            }
          >
            <Route
              path="/my-appointments"
              element={<MyAppointmentsPage />}
            />
          </Route>

          {/* ATENCIÓN MÉDICA */}
          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "Especialista",
                  "Gerente",
                ]}
              />
            }
          >
            <Route
              path="/medical-records"
              element={<MedicalRecordsPage />}
            />

            <Route
              path="/suggested-treatments"
              element={
                <SuggestedTreatmentsPage />
              }
            />
          </Route>

          {/* SOLO GERENTE */}
          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "Gerente",
                ]}
              />
            }
          >
            <Route
              path="users"
              element={<UsersPage />}
            />
            <Route
              path="/specialties"
              element={<SpecialtiesPage />}
            />

            <Route
              path="/specialists"
              element={<SpecialistsPage />}
            />

            <Route
              path="/procedures"
              element={<ProceduresPage />}
            />
          </Route>

          {/* RUTA DESCONOCIDA */}
          <Route
            path="*"
            element={<HomeRedirect />}
          />
        </Route>
      </Route>
    </Routes>
  );
}