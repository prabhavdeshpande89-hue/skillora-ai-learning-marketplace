
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Users,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronLeft,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "User Management", path: "/admin/users", icon: Users },
  { name: "Resource Management", path: "/admin/resources", icon: BookOpen },
  { name: "Payments", path: "/admin/payments", icon: CreditCard },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return localStorage.getItem("skillora-theme") === "dark"
      ? "dark"
      : "light";
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Keep sidebar theme synchronized with the global theme.
  useEffect(() => {
    const root = document.documentElement;

    const syncTheme = () => {
      setTheme(
        root.getAttribute("data-theme") === "dark" ? "dark" : "light"
      );
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("skillora-theme", nextTheme);

    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } catch (error) {
      console.error("Admin logout failed:", error);
    }
  };

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-3 text-[var(--admin-text)] shadow-lg lg:hidden"
        aria-label="Open admin navigation"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen flex-col
          border-r border-[var(--admin-border)]
          bg-[var(--admin-card)] text-[var(--admin-text)]
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[88px]" : "w-[260px]"}
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Brand */}
        <div className="flex h-[84px] shrink-0 items-center justify-between border-b border-[var(--admin-border)] px-5">
          <NavLink
            to="/admin/dashboard"
            onClick={closeMobileMenu}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
              <GraduationCap size={25} className="text-white" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-[var(--admin-text)]">
                  Skillora<span className="text-violet-500">.</span>
                </h1>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
                  Admin Console
                </p>
              </div>
            )}
          </NavLink>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-lg p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)] lg:hidden"
            aria-label="Close admin navigation"
          >
            <X size={19} />
          </button>
        </div>

        {/* Workspace label */}
        {!collapsed && (
          <div className="px-6 pb-3 pt-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
              Workspace
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 pt-4 lg:pt-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                title={collapsed ? item.name : undefined}
                className={({ isActive }) => `
                  group relative flex items-center gap-3 rounded-xl px-3.5 py-3
                  text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-300"
                      : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-violet-500" />
                    )}

                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.3 : 1.8}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? "text-violet-500"
                          : "text-[var(--admin-muted)] group-hover:text-[var(--admin-text)]"
                      }`}
                    />

                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>

                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-[var(--admin-border)] p-3">
          {/* User profile */}
          <div
            className={`mb-3 flex items-center gap-3 rounded-xl bg-[var(--admin-hover)] p-3 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-sm font-bold text-violet-600 ring-1 ring-violet-400/20 dark:text-violet-300">
              {(user?.name || user?.email || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                  {user?.name || "Administrator"}
                </p>

                <p className="truncate text-xs text-[var(--admin-muted)]">
                  {user?.email || "Admin account"}
                </p>

                <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Admin
                </span>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={collapsed ? (theme === "light" ? "Dark Mode" : "Light Mode") : undefined}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            {theme === "light" ? (
              <Moon size={19} className="shrink-0" />
            ) : (
              <Sun size={19} className="shrink-0" />
            )}

            {!collapsed && (
              <span>
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </span>
            )}
          </button>

          {/* View website */}
          <NavLink
            to="/"
            title={collapsed ? "View Website" : undefined}
            onClick={closeMobileMenu}
            className="mb-1 flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <ExternalLink size={19} className="shrink-0" />
            {!collapsed && <span>View Website</span>}
          </NavLink>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-rose-500 transition hover:bg-rose-500/10 hover:text-rose-600"
          >
            <LogOut size={19} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Collapse sidebar */}
          <button
            type="button"
            onClick={() => setCollapsed((previous) => !previous)}
            className="mt-2 hidden w-full items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] py-2.5 text-xs font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)] lg:flex"
          >
            <ChevronLeft
              size={16}
              className={`transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />

            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
