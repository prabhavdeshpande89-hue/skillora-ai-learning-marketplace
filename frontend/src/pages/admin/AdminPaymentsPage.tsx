
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  adminService,
  type AdminPayment,
  type AdminPaymentStatus,
} from "../../services/adminService";

type PaymentStatus = AdminPaymentStatus;

const statusStyles: Record<PaymentStatus, string> = {
  Completed: "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20",
  Pending: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
  Failed: "bg-red-400/10 text-red-400 ring-red-400/20",
  Refunded: "bg-sky-400/10 text-sky-400 ring-sky-400/20",
};

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function formatDate(date: string | null) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-emerald-400/30">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-xl text-emerald-400">
          {icon}
        </div>
      </div>

      <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">
        {value}
      </h3>

      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PaymentStatus>(
    "All"
  );
  const [dateFilter, setDateFilter] = useState("all");

  const [selectedPayment, setSelectedPayment] =
    useState<AdminPayment | null>(null);

  // LOAD REAL PAYMENTS FROM BACKEND

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminService.getPayments();

      setPayments(response.payments || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payment records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  // PAYMENT STATISTICS

  const statistics = useMemo(() => {
    const completed = payments.filter(
      (payment) => payment.status === "Completed"
    );

    const pending = payments.filter(
      (payment) => payment.status === "Pending"
    );

    const failed = payments.filter(
      (payment) => payment.status === "Failed"
    );

    const refunded = payments.filter(
      (payment) => payment.status === "Refunded"
    );

    return {
      total: payments.length,

      revenue: completed.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      ),

      pending: pending.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      ),

      refunded: refunded.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      ),

      failed: failed.length,
    };
  }, [payments]);

  // SEARCH AND FILTER

  const filteredPayments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return payments.filter((payment) => {
      const matchesSearch =
        !normalizedSearch ||
        payment.id?.toLowerCase().includes(normalizedSearch) ||
        payment.paypalOrderId?.toLowerCase().includes(normalizedSearch) ||
        payment.captureId?.toLowerCase().includes(normalizedSearch) ||
        payment.customer?.toLowerCase().includes(normalizedSearch) ||
        payment.email?.toLowerCase().includes(normalizedSearch) ||
        payment.resource?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" || payment.status === statusFilter;

      let matchesDate = true;

      if (dateFilter !== "all" && payment.date) {
        const paymentDate = new Date(payment.date);

        if (!Number.isNaN(paymentDate.getTime())) {
          paymentDate.setHours(0, 0, 0, 0);

          const start = new Date(today);

          if (dateFilter === "7days") {
            start.setDate(start.getDate() - 6);
          } else if (dateFilter === "30days") {
            start.setDate(start.getDate() - 29);
          }

          matchesDate =
            paymentDate >= start && paymentDate <= today;
        } else {
          matchesDate = false;
        }
      } else if (dateFilter !== "all" && !payment.date) {
        matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [payments, search, statusFilter, dateFilter]);

  // CSV EXPORT

  function exportCSV() {
    const headers = [
      "Payment ID",
      "PayPal Order ID",
      "Capture ID",
      "Customer",
      "Email",
      "Resource",
      "Amount INR",
      "PayPal Amount",
      "PayPal Currency",
      "Payment Method",
      "Date",
      "Status",
    ];

    const rows = filteredPayments.map((payment) => [
      payment.id || "",
      payment.paypalOrderId || "",
      payment.captureId || "",
      payment.customer || "",
      payment.email || "",
      payment.resource || "",
      String(payment.amount ?? 0),
      String(payment.paypalAmount ?? 0),
      payment.paypalCurrency || "",
      payment.method || "PayPal",
      payment.date || "",
      payment.status || "",
    ]);

    const escapeCSV = (value: string) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "skillora-payments.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-theme min-h-screen bg-[#050816] text-white">
      <AdminSidebar />

      <main className="min-h-screen px-5 py-8 sm:px-8 lg:ml-64 lg:px-10">

        {/* HEADER */}

        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Financial overview
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Payments
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Monitor real transactions, revenue, and payment statuses.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void loadPayments()}
              disabled={loading}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-400 disabled:opacity-50"
            >
              ↻ Refresh
            </button>

            <button
              onClick={exportCSV}
              disabled={filteredPayments.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↓ Export CSV
            </button>
          </div>
        </header>

        {/* API ERROR */}

        {error && (
          <div className="mb-7 flex flex-col justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-4 text-sm text-red-300 sm:flex-row sm:items-center">
            <p>{error}</p>

            <button
              onClick={() => void loadPayments()}
              className="font-semibold text-red-200 hover:text-white"
            >
              Try again
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Transactions"
            value={loading ? "..." : statistics.total.toString()}
            subtitle="Real database transactions"
            icon="↗"
          />

          <StatCard
            title="Completed Revenue"
            value={loading ? "..." : formatCurrency(statistics.revenue)}
            subtitle="Completed transactions only"
            icon="₹"
          />

          <StatCard
            title="Pending Amount"
            value={loading ? "..." : formatCurrency(statistics.pending)}
            subtitle="Awaiting payment confirmation"
            icon="◷"
          />

          <StatCard
            title="Refunded Amount"
            value={loading ? "..." : formatCurrency(statistics.refunded)}
            subtitle={`${statistics.failed} failed transactions`}
            icon="↩"
          />
        </section>

        {/* FILTERS */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                ⌕
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search payment ID, customer, email, or resource..."
                className="w-full rounded-xl border border-slate-700 bg-[#050816] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "All" | PaymentStatus)
                }
                className="rounded-xl border border-slate-700 bg-[#050816] px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-400"
                aria-label="Filter by payment status"
              >
                <option value="All">All statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="rounded-xl border border-slate-700 bg-[#050816] px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-400"
                aria-label="Filter by date"
              >
                <option value="all">All dates</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
              </select>
            </div>
          </div>
        </section>

        {/* TRANSACTIONS TABLE */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">
                Recent transactions
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {loading
                  ? "Loading transactions..."
                  : `${filteredPayments.length} transaction${
                      filteredPayments.length === 1 ? "" : "s"
                    } found`}
              </p>
            </div>

            <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
              INR · ₹
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Transaction</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Resource</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Method</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">

                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center text-slate-400"
                    >
                      Loading real payment records...
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-5 font-semibold text-emerald-400">
                        {payment.id}
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-medium text-white">
                          {payment.customer || "Unknown customer"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {payment.email || "—"}
                        </p>
                      </td>

                      <td className="max-w-xs px-6 py-5 text-slate-300">
                        <span className="line-clamp-2">
                          {payment.resource || "Unknown resource"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 font-semibold text-white">
                        {formatCurrency(payment.amount, payment.currency || "INR")}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {payment.method || "PayPal"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-slate-400">
                        {formatDate(payment.date)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            statusStyles[payment.status]
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-emerald-400 hover:text-emerald-400"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                {!loading &&
                  !error &&
                  filteredPayments.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center text-slate-400"
                      >
                        <p className="text-lg font-medium text-white">
                          No transactions found
                        </p>

                        <p className="mt-2 text-sm">
                          Real payment records will appear here after
                          transactions are saved in MongoDB.
                        </p>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500">
            Displaying {loading ? "..." : filteredPayments.length} of{" "}
            {loading ? "..." : payments.length} real transactions.
          </div>
        </section>
      </main>

      {/* PAYMENT DETAILS MODAL */}

      {selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPayment(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            className="my-6 w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0b1020] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Transaction details
                </p>

                <h2
                  id="payment-modal-title"
                  className="mt-2 text-2xl font-bold"
                >
                  {selectedPayment.id}
                </h2>
              </div>

              <button
                onClick={() => setSelectedPayment(null)}
                aria-label="Close payment details"
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="my-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">
                Transaction amount
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-400">
                {formatCurrency(
                  selectedPayment.amount,
                  selectedPayment.currency || "INR"
                )}
              </p>

              <span
                className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  statusStyles[selectedPayment.status]
                }`}
              >
                {selectedPayment.status}
              </span>
            </div>

            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Customer</dt>
                <dd className="text-right font-medium">
                  {selectedPayment.customer || "—"}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Email</dt>
                <dd className="break-all text-right">
                  {selectedPayment.email || "—"}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Resource</dt>
                <dd className="max-w-[65%] text-right">
                  {selectedPayment.resource || "—"}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Payment method</dt>
                <dd>{selectedPayment.method || "PayPal"}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Payment date</dt>
                <dd>{formatDate(selectedPayment.date)}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">PayPal Order ID</dt>
                <dd className="max-w-[65%] break-all text-right">
                  {selectedPayment.paypalOrderId || "—"}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Capture ID</dt>
                <dd className="max-w-[65%] break-all text-right">
                  {selectedPayment.captureId || "—"}
                </dd>
              </div>

              {selectedPayment.paypalAmount > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">PayPal amount</dt>
                  <dd>
                    {formatCurrency(
                      selectedPayment.paypalAmount,
                      selectedPayment.paypalCurrency || "USD"
                    )}
                  </dd>
                </div>
              )}
            </dl>

            <button
              onClick={() => setSelectedPayment(null)}
              className="mt-7 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Close details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
