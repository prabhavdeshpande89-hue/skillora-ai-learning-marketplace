
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  administrators: number;
  totalResources: number;
  totalPayments: number;
  successfulPayments: number;
  platformRevenue: number;
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const navigation = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "User Management", path: "/admin/users" },
    { name: "Resource Management", path: "/admin/resources" },
    { name: "Payments", path: "/admin/payments" },
  ];

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("skillora_access_token");

      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Administrator authentication failed. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          `Unable to load dashboard statistics (HTTP ${response.status}).`
        );
      }

      const data = await response.json();

      setStats({
        totalUsers: Number(data.totalUsers ?? 0),
        activeUsers: Number(data.activeUsers ?? 0),
        blockedUsers: Number(data.blockedUsers ?? 0),
        administrators: Number(data.administrators ?? 0),
        totalResources: Number(data.totalResources ?? 0),
        totalPayments: Number(data.totalPayments ?? 0),
        successfulPayments: Number(data.successfulPayments ?? 0),
        platformRevenue: Number(data.platformRevenue ?? 0),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading statistics."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  async function handleLogout() {
    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } catch (err) {
      console.error("Admin logout failed:", err);
    }
  }

  const cards = [
    {
      title: "Total Users",
      value: stats ? formatNumber(stats.totalUsers) : "—",
      description: stats
        ? `${formatNumber(stats.activeUsers)} active · ${formatNumber(stats.blockedUsers)} blocked`
        : "Registered platform accounts",
    },
    {
      title: "Learning Resources",
      value: stats ? formatNumber(stats.totalResources) : "—",
      description: "Resources in the database",
    },
    {
      title: "Total Payments",
      value: stats ? formatNumber(stats.totalPayments) : "—",
      description: stats
        ? `${formatNumber(stats.successfulPayments)} successful`
        : "Payment transaction records",
    },
    {
      title: "Platform Revenue",
      value: stats ? formatCurrency(stats.platformRevenue) : "—",
      description: "Revenue reported by the backend",
    },
  ];

  return (
    <div className="admin-page flex">
      {/* Sidebar */}
      <aside className="admin-sidebar fixed left-0 top-0 z-10 flex h-screen w-64 flex-col border-r p-6">
        <h1 className="text-2xl font-bold text-emerald-500">
          Skillora Admin
        </h1>

        <p className="admin-muted mt-2 text-sm">
          Administration Panel
        </p>

        <nav className="mt-10 space-y-3">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin/dashboard"}
              className={({ isActive }) =>
                `admin-nav-link block w-full rounded-lg px-4 py-3 ${
                  isActive ? "admin-nav-link-active font-semibold" : ""
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto rounded-lg bg-red-500/10 px-4 py-3 text-red-500 transition hover:bg-red-500/20"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen min-w-0 flex-1 p-6 sm:p-10">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="admin-heading text-3xl font-bold">
              Admin Dashboard
            </h2>

            <p className="admin-muted mt-2">
              Manage your Skillora learning platform.
            </p>
          </div>

          <div className="admin-card px-5 py-3">
            <p className="admin-heading font-medium">
              {user?.name ?? "Administrator"}
            </p>

            <p className="text-sm font-medium text-emerald-500">
              Administrator
            </p>
          </div>
        </header>

        {/* API error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500"
          >
            <p className="font-medium">
              Could not load dashboard statistics
            </p>

            <p className="mt-1 text-sm">{error}</p>

            <button
              type="button"
              onClick={() => void loadStats()}
              className="mt-3 rounded-lg bg-red-500/20 px-4 py-2 text-sm hover:bg-red-500/30"
            >
              Try again
            </button>
          </div>
        )}

        {/* Statistics */}
        <section
          aria-label="Platform statistics"
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
        >
          {cards.map((card) => (
            <div
              key={card.title}
              className="admin-card p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="admin-muted text-sm">{card.title}</p>

              <p className="admin-heading mt-4 break-words text-2xl font-bold">
                {isLoading ? (
                  <span className="admin-subtle animate-pulse">
                    Loading...
                  </span>
                ) : (
                  card.value
                )}
              </p>

              <p className="admin-subtle mt-2 text-xs">
                {card.description}
              </p>
            </div>
          ))}
        </section>

        {/* Platform overview */}
        <section className="admin-card mt-8 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="admin-heading text-xl font-semibold">
              Platform Overview
            </h3>

            <button
              type="button"
              onClick={() => void loadStats()}
              disabled={isLoading}
              className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Refreshing..." : "Refresh statistics"}
            </button>
          </div>

          {isLoading ? (
            <p className="admin-muted mt-4">
              Loading platform statistics...
            </p>
          ) : error ? (
            <p className="admin-muted mt-4">
              Dashboard data is temporarily unavailable. Use the retry button
              above to try again.
            </p>
          ) : stats ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="admin-inset rounded-xl p-4">
                <p className="admin-muted text-sm">
                  Administrators
                </p>

                <p className="admin-heading mt-2 text-xl font-semibold">
                  {formatNumber(stats.administrators)}
                </p>
              </div>

              <div className="admin-inset rounded-xl p-4">
                <p className="admin-muted text-sm">
                  Successful payments
                </p>

                <p className="admin-heading mt-2 text-xl font-semibold">
                  {formatNumber(stats.successfulPayments)}
                </p>
              </div>
            </div>
          ) : null}

          <p className="admin-subtle mt-5 text-sm">
            Statistics are retrieved from the authenticated admin API.
            Resource and payment values depend on what the backend currently
            records.
          </p>
        </section>
      </main>
    </div>
  );
}
