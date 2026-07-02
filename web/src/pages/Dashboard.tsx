import { useDashboardStats } from "../hooks/useDashboardStats";
import { StatCard } from "../components/StatCard";
import { FilmsByTypeChart } from "../components/FilmsByTypeChart";

export function Dashboard() {
  const { data, isLoading, isError, error } = useDashboardStats();

  if (isLoading) {
    return <p role="status">Loading dashboard...</p>;
  }

  if (isError) {
    return (
      <p role="alert">
        Could not load dashboard stats: {(error as Error).message}
      </p>
    );
  }

  const stats = data ?? { totalFilms: 0, breakdown: [] };

  return (
    <section>
      <h1>Dashboard</h1>
      <div className="stat-cards">
        <StatCard label="Total films" value={stats.totalFilms} />
      </div>
      <h2>Films by type</h2>
      <FilmsByTypeChart data={stats.breakdown} />
    </section>
  );
}
