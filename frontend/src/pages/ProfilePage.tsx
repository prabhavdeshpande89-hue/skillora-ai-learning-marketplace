import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Mail, UserRound } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  }

  if (!user) {
    return null;
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-emerald-400"
        >
          <ArrowLeft size={16} /> Back to marketplace
        </Link>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0b1022]">
          <div className="h-36 bg-gradient-to-r from-emerald-400/30 via-emerald-400/5 to-indigo-500/20" />

          <div className="px-6 pb-8 sm:px-10">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-[#0b1022] bg-emerald-400 text-4xl font-bold text-slate-950">
              {initial}
            </div>

            <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                  Your account
                </p>
                <h1 className="mt-2 text-3xl font-bold">{user.name}</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Manage your Skillora account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-60"
              >
                <LogOut size={17} />
                {loggingOut ? "Signing out..." : "Logout"}
              </button>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#050816] p-5">
                <div className="flex items-center gap-3 text-emerald-400">
                  <UserRound size={20} />
                  <span className="text-sm font-medium">Full name</span>
                </div>
                <p className="mt-3 break-words text-white">{user.name}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#050816] p-5">
                <div className="flex items-center gap-3 text-emerald-400">
                  <Mail size={20} />
                  <span className="text-sm font-medium">Email address</span>
                </div>
                <p className="mt-3 break-words text-white">{user.email}</p>
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Account ID: {user.id}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}