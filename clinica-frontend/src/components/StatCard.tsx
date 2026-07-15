interface StatCardProps {
  title: string;
  value: number | undefined;
  description: string;
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="stat-card">
      <h3>{value ?? 0}</h3>
      <p>{title}</p>
      <span>{description}</span>
    </div>
  );
}