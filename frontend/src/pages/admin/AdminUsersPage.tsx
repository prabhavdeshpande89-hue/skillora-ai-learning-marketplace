
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { adminService } from "../../services/adminService";

import {
  Search,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Download,
  Eye,
  X,
  Mail,
  CalendarDays,
  MoreHorizontal,
  ChevronDown,
  RefreshCw,
  Filter,
  CheckCircle2,
  Ban,
  GraduationCap,
} from "lucide-react";

type UserRole = "Admin" | "Student";
type UserStatus = "Active" | "Blocked";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  coursesEnrolled: number;
}

function formatDate(date: string | null) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function exportUsers(users: ManagedUser[]) {
  const headers = [
    "User ID",
    "Name",
    "Email",
    "Role",
    "Status",
    "Joined Date",
    "Courses Enrolled",
  ];

  const rows = users.map((user) => [
    user.id,
    user.name,
    user.email,
    user.role,
    user.status,
    user.joinedAt,
    String(user.coursesEnrolled),
  ]);

  const escapeCsv = (value: string) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "skillora-users.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedUser, setSelectedUser] =
    useState<ManagedUser | null>(null);

  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");

  // Fetch real users from MongoDB through the admin API
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminService.getUsers();

      const mappedUsers: ManagedUser[] = response.users.map((user) => ({
        id: user.id,
        name: user.name || "Unknown User",
        email: user.email || "",
        role: user.role === "admin" ? "Admin" : "Student",
        status: user.status,
        joinedAt: user.joinedAt || "",
        coursesEnrolled: user.coursesEnrolled ?? 0,
      }));

      setUsers(mappedUsers);

      setSelectedUser((current) => {
        if (!current) return null;
        return mappedUsers.find((user) => user.id === current.id) || null;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load registered users."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Block or unblock a student through the protected admin API
  const handleStatusAction = async (user: ManagedUser) => {
    if (user.role === "Admin") {
      window.alert("Administrator accounts cannot be blocked here.");
      return;
    }

    if (updatingUserId) return;

    const isActive = user.status !== "Active";
    const action = isActive ? "unblock" : "block";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user.id);
      setSuccessMessage("");
      setActionError("");
      setMenuUserId(null);

      const response = await adminService.updateUserStatus(
        user.id,
        isActive
      );

      const updatedStatus: UserStatus = response.is_active
        ? "Active"
        : "Blocked";

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === user.id
            ? { ...item, status: updatedStatus }
            : item
        )
      );

      setSelectedUser((current) =>
        current?.id === user.id
          ? { ...current, status: updatedStatus }
          : current
      );

      setSuccessMessage(
        response.message || `User ${action}ed successfully.`
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Unable to ${action} user.`
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Dashboard statistics
  const stats = useMemo(
    () => [
      {
        title: "Total Users",
        value: users.length,
        icon: Users,
        color: "violet",
        description: "All registered accounts",
      },
      {
        title: "Administrators",
        value: users.filter((user) => user.role === "Admin").length,
        icon: ShieldCheck,
        color: "blue",
        description: "Accounts with admin role",
      },
      {
        title: "Active Users",
        value: users.filter((user) => user.status === "Active").length,
        icon: UserCheck,
        color: "emerald",
        description: "Currently marked active",
      },
      {
        title: "Blocked Users",
        value: users.filter((user) => user.status === "Blocked").length,
        icon: UserX,
        color: "rose",
        description: "Currently marked blocked",
      },
    ],
    [users]
  );

  // Search and filtering
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
  };

  const colorClasses: Record<string, string> = {
    violet: "bg-violet-500/10 text-violet-500 ring-violet-500/20",
    blue: "bg-blue-500/10 text-blue-500 ring-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-500 ring-rose-500/20",
  };

  const neutralInput =
    "w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted)] focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10";

  const secondaryButton =
    "inline-flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-3 text-sm font-medium text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="admin-page min-h-screen bg-[var(--admin-page-bg)] text-[var(--admin-text)] transition-colors duration-300">
      <AdminSidebar />

      <main className="min-h-screen transition-all duration-300 lg:ml-[260px]">
        <div className="mx-auto max-w-[1600px] px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pt-10">

          {/* Header */}
          <header className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[var(--admin-muted)]">
                <NavLink
                  to="/admin/dashboard"
                  className="transition hover:text-violet-500"
                >
                  Admin
                </NavLink>

                <span>/</span>

                <span className="text-violet-500">Users</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[var(--admin-text)] sm:text-4xl">
                User Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
                Manage registered accounts, monitor user activity,
                and review account information.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadUsers}
                disabled={loading}
                className={secondaryButton}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh users
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className={secondaryButton}
              >
                <RefreshCw size={16} />
                Reset filters
              </button>

              <button
                type="button"
                onClick={() => exportUsers(filteredUsers)}
                disabled={loading || filteredUsers.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={17} />
                Export CSV
              </button>
            </div>
          </header>

          {/* Database connection notice */}
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-emerald-500"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Live database connection
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                User information is loaded directly from your MongoDB database.
              </p>
            </div>
          </div>

          {/* Block/unblock feedback */}
          {successMessage && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 size={18} />
                {successMessage}
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                aria-label="Dismiss success message"
                className="rounded-lg p-1 transition hover:bg-emerald-500/10"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {actionError && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <p className="text-sm font-medium text-rose-500">
                {actionError}
              </p>
              <button
                type="button"
                onClick={() => setActionError("")}
                aria-label="Dismiss error message"
                className="rounded-lg p-1 transition hover:bg-rose-500/10"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="mb-7 flex items-center justify-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] py-12 text-sm text-[var(--admin-muted)]">
              <RefreshCw
                size={19}
                className="animate-spin text-violet-500"
              />
              Loading registered users...
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="mb-7 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
              <p className="font-semibold text-rose-500">
                Failed to load users
              </p>

              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                {error}
              </p>

              <button
                type="button"
                onClick={loadUsers}
                className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Statistics */}
              <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article
                      key={stat.title}
                      className="group rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-xl hover:shadow-black/5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-[var(--admin-muted)]">
                            {stat.title}
                          </p>

                          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--admin-text)]">
                            {stat.value}
                          </h2>
                        </div>

                        <div
                          className={`rounded-xl p-3 ring-1 ${colorClasses[stat.color]}`}
                        >
                          <Icon size={22} />
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-[var(--admin-muted)]">
                        {stat.description}
                      </p>
                    </article>
                  );
                })}
              </section>

              {/* Users table */}
              <section className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">

                {/* Table header */}
                <div className="flex flex-col justify-between gap-4 border-b border-[var(--admin-border)] p-5 xl:flex-row xl:items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                      All Users
                    </h2>

                    <p className="mt-1 text-xs text-[var(--admin-muted)]">
                      Showing {filteredUsers.length} of {users.length} accounts
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 sm:w-72">
                      <Search
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
                      />

                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name, email or ID..."
                        className={`${neutralInput} pl-10`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFilters(!showFilters)}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        showFilters
                          ? "border-violet-500/40 bg-violet-500/10 text-violet-600"
                          : "border-[var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
                      }`}
                    >
                      <Filter size={16} />
                      Filters

                      <ChevronDown
                        size={15}
                        className={`transition-transform ${
                          showFilters ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-hover)] p-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="role-filter"
                        className="mb-2 block text-xs font-medium text-[var(--admin-muted)]"
                      >
                        Account role
                      </label>

                      <select
                        id="role-filter"
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value)}
                        className={neutralInput}
                      >
                        <option value="All">All roles</option>
                        <option value="Admin">Administrator</option>
                        <option value="Student">Student</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="status-filter"
                        className="mb-2 block text-xs font-medium text-[var(--admin-muted)]"
                      >
                        Account status
                      </label>

                      <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(event.target.value)
                        }
                        className={neutralInput}
                      >
                        <option value="All">All statuses</option>
                        <option value="Active">Active</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Responsive table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left">
                    <thead>
                      <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-table-head)]">
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                          User
                        </th>

                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                          User ID
                        </th>

                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                          Role
                        </th>

                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                          Status
                        </th>

                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                          Joined
                        </th>

                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--admin-border)]">
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="group transition hover:bg-[var(--admin-hover)]"
                        >
                          {/* User information */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-bold text-violet-500 ring-1 ring-violet-500/10">
                                {user.name.charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="font-medium text-[var(--admin-text)]">
                                  {user.name}
                                </p>

                                <p className="mt-1 text-xs text-[var(--admin-muted)]">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-mono text-xs text-[var(--admin-muted)]">
                              {user.id}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                user.role === "Admin"
                                  ? "bg-violet-500/10 text-violet-600"
                                  : "bg-blue-500/10 text-blue-600"
                              }`}
                            >
                              {user.role === "Admin" ? (
                                <ShieldCheck size={13} />
                              ) : (
                                <GraduationCap size={13} />
                              )}

                              {user.role}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                user.status === "Active"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-rose-500/10 text-rose-600"
                              }`}
                            >
                              {user.status === "Active" ? (
                                <CheckCircle2 size={13} />
                              ) : (
                                <Ban size={13} />
                              )}

                              {user.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-[var(--admin-muted)]">
                            {formatDate(user.joinedAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="relative flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setMenuUserId(
                                    menuUserId === user.id ? null : user.id
                                  )
                                }
                                className="rounded-lg p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
                                aria-label={`Actions for ${user.name}`}
                              >
                                <MoreHorizontal size={19} />
                              </button>

                              {menuUserId === user.id && (
                                <>
                                  <button
                                    type="button"
                                    aria-label="Close actions menu"
                                    onClick={() => setMenuUserId(null)}
                                    className="fixed inset-0 z-10 cursor-default"
                                  />

                                  <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-1.5 shadow-2xl">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setMenuUserId(null);
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)]"
                                    >
                                      <Eye size={15} />
                                      View details
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleStatusAction(user)}
                                      disabled={
                                        user.role === "Admin" ||
                                        updatingUserId === user.id
                                      }
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {updatingUserId === user.id ? (
                                        <RefreshCw size={15} className="animate-spin" />
                                      ) : user.status === "Active" ? (
                                        <Ban size={15} />
                                      ) : (
                                        <CheckCircle2 size={15} />
                                      )}

                                      {updatingUserId === user.id
                                        ? "Updating..."
                                        : user.status === "Active"
                                          ? "Block user"
                                          : "Unblock user"}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Empty state */}
                  {filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                      <div className="mb-4 rounded-2xl bg-[var(--admin-hover)] p-4">
                        <Search
                          size={26}
                          className="text-[var(--admin-muted)]"
                        />
                      </div>

                      <h3 className="font-semibold text-[var(--admin-text)]">
                        No users found
                      </h3>

                      <p className="mt-2 max-w-sm text-sm text-[var(--admin-muted)]">
                        {users.length === 0
                          ? "No registered accounts were found in your database."
                          : "Try a different search term or change your filters."}
                      </p>

                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-5 text-sm font-medium text-violet-500 hover:text-violet-600"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-3 border-t border-[var(--admin-border)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[var(--admin-muted)]">
                    {filteredUsers.length} result
                    {filteredUsers.length === 1 ? "" : "s"} displayed
                  </p>

                  <p className="text-xs text-[var(--admin-muted)]">
                    Skillora Admin Console
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* User details modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] p-6">
              <div>
                <h2
                  id="user-details-title"
                  className="text-xl font-bold text-[var(--admin-text)]"
                >
                  User Details
                </h2>

                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  Account information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-xl border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
                aria-label="Close user details"
              >
                <X size={18} />
              </button>
            </div>

            {/* User identity */}
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl font-bold text-violet-500 ring-1 ring-violet-500/20">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-[var(--admin-text)]">
                    {selectedUser.name}
                  </h3>

                  <p className="mt-1 break-all text-sm text-[var(--admin-muted)]">
                    {selectedUser.email}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-600">
                      {selectedUser.role}
                    </span>

                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        selectedUser.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="mt-7 space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-inset)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[var(--admin-hover)] p-2">
                      <Users
                        size={17}
                        className="text-[var(--admin-muted)]"
                      />
                    </div>

                    <span className="text-sm text-[var(--admin-muted)]">
                      User ID
                    </span>
                  </div>

                  <span className="break-all text-right font-mono text-xs text-[var(--admin-text)]">
                    {selectedUser.id}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-inset)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[var(--admin-hover)] p-2">
                      <CalendarDays
                        size={17}
                        className="text-[var(--admin-muted)]"
                      />
                    </div>

                    <span className="text-sm text-[var(--admin-muted)]">
                      Joined date
                    </span>
                  </div>

                  <span className="text-sm text-[var(--admin-text)]">
                    {formatDate(selectedUser.joinedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-inset)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[var(--admin-hover)] p-2">
                      <GraduationCap
                        size={17}
                        className="text-[var(--admin-muted)]"
                      />
                    </div>

                    <span className="text-sm text-[var(--admin-muted)]">
                      Courses enrolled
                    </span>
                  </div>

                  <span className="text-sm font-semibold text-[var(--admin-text)]">
                    {selectedUser.coursesEnrolled}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-inset)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[var(--admin-hover)] p-2">
                      <Mail
                        size={17}
                        className="text-[var(--admin-muted)]"
                      />
                    </div>

                    <span className="text-sm text-[var(--admin-muted)]">
                      Email address
                    </span>
                  </div>

                  <span className="max-w-[60%] break-all text-right text-xs text-[var(--admin-text)]">
                    {selectedUser.email}
                  </span>
                </div>
              </div>

              {/* Modal footer */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 rounded-xl border border-[var(--admin-border)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)]"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={
                    selectedUser.role === "Admin" ||
                    updatingUserId === selectedUser.id
                  }
                  onClick={() => handleStatusAction(selectedUser)}
                  className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {updatingUserId === selectedUser.id
                    ? "Updating..."
                    : selectedUser.status === "Active"
                      ? "Block User"
                      : "Unblock User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
