
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem("skillora-theme");
  return savedTheme === "dark" ? "dark" : "light";
}

export default function AdminLoginPage() {
  const { login, logout, user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@skillora.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("skillora-theme", nextTheme);
  }

  if (isLoading) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <p className="admin-muted">Checking your session...</p>
      </div>
    );
  }

  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email.trim(), password);

      if (loggedInUser.role !== "admin") {
        await logout();
        setError(
          "Access denied. This account does not have administrator privileges."
        );
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-page relative flex min-h-screen items-center justify-center px-4 py-10">

      {/* Theme switch */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text)] transition hover:scale-105"
      >
        {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
      </button>

      <div className="admin-card grid w-full max-w-5xl overflow-hidden shadow-2xl md:grid-cols-2">

        {/* Branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-[#050816] p-10 text-white md:flex">

          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

          <Link to="/" className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M12 5v14M3 8h18" />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Skill<span className="text-emerald-400">ora</span>
              </h1>
              <p className="text-xs tracking-[0.25em] text-slate-400">
                ADMINISTRATION
              </p>
            </div>
          </Link>

          <div className="relative">
            <div className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Secure Admin Portal
            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Manage learning.
              <br />
              Empower growth.
            </h2>

            <p className="mt-5 max-w-sm leading-7 text-slate-400">
              Manage your learning marketplace, monitor activity, and keep
              your Skillora platform running smoothly.
            </p>
          </div>

          <p className="relative text-sm text-slate-500">
            Skillora Administration · Authorized access only
          </p>
        </section>

        {/* Login form */}
        <section className="flex items-center justify-center p-6 sm:p-10 md:p-12">
          <div className="w-full max-w-md">

            <Link
              to="/"
              className="admin-muted mb-10 inline-flex items-center gap-2 text-sm transition hover:text-emerald-500"
            >
              <span aria-hidden="true">←</span>
              Back to website
            </Link>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-500">
                Administrator access
              </p>

              <h2 className="admin-heading text-3xl font-bold tracking-tight">
                Admin sign in
              </h2>

              <p className="admin-muted mt-3 text-sm leading-6">
                Sign in with your authorized administrator account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label
                  htmlFor="admin-email"
                  className="admin-heading mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@skillora.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-inset)] px-4 py-3.5 text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-subtle)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="admin-password"
                    className="admin-heading text-sm font-medium"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="text-xs text-emerald-500 hover:text-emerald-400"
                  >
                    {showPassword ? "Hide password" : "Show password"}
                  </button>
                </div>

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-inset)] px-4 py-3.5 text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-subtle)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-500"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Verifying access..." : "Sign in to Admin"}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <div className="admin-card admin-inset mt-7 p-4">
              <p className="admin-muted text-xs leading-5">
                <span className="font-semibold text-emerald-500">
                  Security notice:
                </span>{" "}
                This portal is restricted to authorized administrators.
                Regular user accounts cannot access the admin dashboard.
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
