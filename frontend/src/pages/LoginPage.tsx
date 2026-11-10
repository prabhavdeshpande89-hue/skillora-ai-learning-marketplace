
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);

      const from = location.state?.from;
      const destination =
        from?.pathname && from.pathname !== "/login"
          ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
          : "/marketplace";

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page min-h-screen bg-[#050816] text-white">
      <Navbar />

      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-10 sm:py-12">
        <div className="auth-card grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1022] shadow-2xl md:grid-cols-2">

          {/* Branding panel */}
          <section className="auth-brand hidden flex-col justify-between bg-gradient-to-br from-emerald-400/20 via-[#111a32] to-[#050816] p-10 md:flex">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
                <BookOpen size={26} />
              </span>

              <span className="text-2xl font-bold">
                Skill<span className="text-emerald-400">ora</span>
              </span>
            </Link>

            <div>
              <span className="mb-4 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                YOUR LEARNING JOURNEY
              </span>

              <h1 className="mb-5 text-4xl font-bold leading-tight">
                Learn smarter.
                <br />
                Build your future.
              </h1>

              <p className="max-w-sm leading-7 text-slate-400">
                Explore learning resources, discover new skills, and get
                personalized recommendations with Skillora.
              </p>
            </div>

            <p className="text-sm text-slate-500">
              Learn without limits.
            </p>
          </section>

          {/* Login form panel */}
          <section className="auth-form p-7 sm:p-10">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-emerald-400">
                WELCOME BACK
              </p>

              <h2 className="text-3xl font-bold">
                Sign in to Skillora
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Continue where your learning journey left off.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="auth-label mb-2 block text-sm text-slate-300"
                >
                  Email address
                </label>

                <div className="auth-field flex items-center gap-3 rounded-xl border border-white/10 bg-[#050816] px-4 focus-within:border-emerald-400">
                  <Mail size={18} className="shrink-0 text-slate-500" />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="auth-input w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="auth-label mb-2 block text-sm text-slate-300"
                >
                  Password
                </label>

                <div className="auth-field flex items-center gap-3 rounded-xl border border-white/10 bg-[#050816] px-4 focus-within:border-emerald-400">
                  <LockKeyhole size={18} className="shrink-0 text-slate-500" />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="auth-input w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="auth-password-toggle text-slate-500 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Sign In"}
                {!submitting && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="auth-muted mt-7 text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Create account
              </Link>
            </p>

            <p className="auth-muted mt-5 text-center text-xs text-slate-600">
              <Link to="/" className="hover:text-slate-300">
                Back to homepage
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
