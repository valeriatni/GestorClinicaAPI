import { useDashboard } from "../hooks/useDashboard";


interface DashboardCardProps {
  title: string;
  value: number | undefined;
  description: string;
  icon: string;
}


function DashboardCard({
  title,
  value,
  description,
  icon,
}: DashboardCardProps) {
  return (
    <div className="col-sm-6 col-xl-4">
      <div className="dashboard-card">
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between">
            <div>
              <p className="text-muted mb-2">
                {title}
              </p>

              <h3>
                {value ?? 0}
              </h3>

              <p>
                {description}
              </p>
            </div>

            <div
              className="d-flex align-items-center justify-content-center rounded-circle bg-light"
              style={{
                width: "48px",
                height: "48px",
                fontSize: "22px",
              }}
            >
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export function DashboardPage() {
  const {
    data,
    isLoading,
    isError,
  } = useDashboard();


  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border"
          role="status"
        />

        <p className="mt-3 mb-0">
          Cargando dashboard...
        </p>
      </div>
    );
  }


  if (isError) {
    return (
      <div className="alert alert-danger">
        No se pudo cargar la información del dashboard.
      </div>
    );
  }


  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Resumen general de la clínica odontológica.
          </p>
        </div>
      </div>

      <div className="row g-4">
        <DashboardCard
          title="Pacientes"
          value={data?.patients}
          description="Pacientes activos registrados"
          icon="👥"
        />

        <DashboardCard
          title="Especialistas"
          value={data?.specialists}
          description="Profesionales disponibles"
          icon="🦷"
        />

        <DashboardCard
          title="Citas"
          value={data?.appointments}
          description="Citas no canceladas"
          icon="📅"
        />

        <DashboardCard
          title="Historias clínicas"
          value={data?.medical_records}
          description="Registros clínicos activos"
          icon="📋"
        />

        <DashboardCard
          title="Presupuestos"
          value={data?.budgets}
          description="Presupuestos registrados"
          icon="🧾"
        />

        <DashboardCard
          title="Pagos"
          value={data?.payments}
          description="Pagos registrados"
          icon="S/"
        />
      </div>
    </div>
  );
}


export default DashboardPage;