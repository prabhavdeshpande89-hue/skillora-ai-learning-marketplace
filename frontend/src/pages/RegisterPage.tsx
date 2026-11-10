
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register(name.trim(), email.trim(), password);
      navigate("/marketplace", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page min-h-screen bg-[#050816] text-white">
      <Navbar />

      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-8 sm:py-10">
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
              <p className="mb-4 text-sm font-semibold tracking-widest text-emerald-300">
                START SOMETHING GREAT
              </p>

              <h1 className="mb-5 text-4xl font-bold leading-tight">
                Your next skill
                <br />
                starts here.
              </h1>

              <p className="max-w-sm leading-7 text-slate-400">
                Discover resources, explore new technologies, and use
                AI-powered recommendations to guide your learning.
              </p>
            </div>

            <p className="text-sm text-slate-500">
              Learn without limits.
            </p>
          </section>

          {/* Registration form */}
          <section className="auth-form p-7 sm:p-10">
            <div className="mb-7">
              <p className="mb-2 text-sm font-semibold text-emerald-400">
                JOIN SKILLORA
              </p>

              <h2 className="text-3xl font-bold">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Create an account to unlock your learning marketplace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full name */}
              <div>
                <label
                  htmlFor="name"
                  className="auth-label mb-2 block text-sm text-slate-300"
                >
                  Full name
                </label>

                <div className="auth-field flex items-center gap-3 rounded-xl border border-white/10 bg-[#050816] px-4 focus-within:border-emerald-400">
                  <UserRound size={18} className="shrink-0 text-slate-500" />

                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className="auth-input w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="register-email"
                  className="auth-label mb-2 block text-sm text-slate-300"
                >
                  Email address
                </label>

                <div className="auth-field flex items-center gap-3 rounded-xl border border-white/10 bg-[#050816] px-4 focus-within:border-emerald-400">
                  <Mail size={18} className="shrink-0 text-slate-500" />

                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="auth-input w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="register-password"
                  className="auth-label mb-2 block text-sm text-slate-300"
                >
                  Password
                </label>

                <div className="auth-field flex items-center gap-3 rounded-xl border border-white/10 bg-[#050816] px-4 focus-within:border-emerald-400">
                  <LockKeyhole size={18} className="shrink-0 text-slate-500" />

                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="auth-input w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
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

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="auth-label mb-2 block text-sm text-slate-300"
                >
                  Confirm password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  className="auth-input auth-field w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
                />
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
                {submitting ? "Creating account..." : "Create Account"}
                {!submitting && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="auth-muted mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
