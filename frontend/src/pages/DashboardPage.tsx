
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BrainCircuit,
  GraduationCap,
  ShoppingBag,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  LoaderCircle,
  CheckCircle2,
  CreditCard,
  Package,
  UserCircle,
  AlertCircle,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  getMyPurchases,
  type Purchase,
  type PurchaseHistoryResponse,
} from "../services/paymentService";
import { getProducts } from "../services/productService";
import type { Resource } from "../components/products/ResourceCard";

function formatDate(date: string | null) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function DashboardPage() {
  const { user } = useAuth();

  const [dashboard, setDashboard] =
    useState<PurchaseHistoryResponse | null>(null);

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [purchaseData, productData] = await Promise.all([
        getMyPurchases(),
        getProducts(),
      ]);

      setDashboard(purchaseData);
      setResources(productData);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const purchasedResources = useMemo(() => {
    if (!dashboard) return [];

    const resourceMap = new Map(
      resources.map((resource) => [
        String(resource.id),
        resource,
      ])
    );

    const purchasedMap = new Map<
      string,
      {
        resource: Resource | null;
        title: string;
        price: number;
        purchaseDate: string | null;
        orderId: string;
      }
    >();

    dashboard.purchases.forEach((purchase: Purchase) => {
      purchase.products.forEach((product) => {
        const id = String(product.id);

        if (!purchasedMap.has(id)) {
          purchasedMap.set(id, {
            resource: resourceMap.get(id) || null,
            title: product.title,
            price: product.price,
            purchaseDate: purchase.captured_at ?? null,
            orderId: purchase.paypal_order_id,
          });
        }
      });
    });

    return Array.from(purchasedMap.values());
  }, [dashboard, resources]);

  const displayName =
    dashboard?.user.name || user?.name || "Learner";

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Your learning space
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Welcome back, {displayName.split(" ")[0]}!
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              Track your purchases and continue your learning journey.
            </p>
          </div>

          <button
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm transition hover:border-emerald-400/40 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-12 flex flex-col items-center justify-center py-20">
            <LoaderCircle
              size={38}
              className="animate-spin text-emerald-400"
            />

            <p className="mt-4 text-sm text-slate-400">
              Loading your learning dashboard...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mt-10 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-6">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle size={20} />
              <h2 className="font-semibold">
                Unable to load dashboard
              </h2>
            </div>

            <p className="mt-3 text-sm text-slate-400">
              {error}
            </p>

            <button
              onClick={() => void loadDashboard()}
              className="mt-5 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Try again
            </button>
          </div>
        )}

        {/* DASHBOARD CONTENT */}
        {!loading && !error && dashboard && (
          <>
            {/* STATISTICS */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <StatCard
                title="Total Purchases"
                value={dashboard.summary.total_purchases}
                icon={ShoppingBag}
                description="Successful transactions"
              />

              <StatCard
                title="Learning Resources"
                value={dashboard.summary.total_resources}
                icon={BookOpen}
                description="Resources purchased"
              />

              <StatCard
                title="Total Spent"
                value={formatCurrency(
                  dashboard.summary.total_spent
                )}
                icon={Wallet}
                description="Total purchase amount"
              />

              <StatCard
                title="Account Status"
                value="Active"
                icon={CheckCircle2}
                description="Your account is available"
              />
            </div>

            {/* QUICK ACTIONS */}
            <section className="mt-10">
              <h2 className="text-xl font-semibold">
                Quick Actions
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">

                <ActionCard
                  title="Browse Marketplace"
                  description="Discover new learning resources."
                  icon={BookOpen}
                  to="/marketplace"
                />

                <ActionCard
                  title="AI Recommendations"
                  description="Find resources for your interests."
                  icon={BrainCircuit}
                  to="/ai-recommendations"
                />

                <ActionCard
                  title="My Profile"
                  description="View your account information."
                  icon={UserCircle}
                  to="/profile"
                />
              </div>
            </section>

            {/* MY LEARNING */}
            <section className="mt-12">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    My Learning
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Resources you've successfully purchased.
                  </p>
                </div>

                <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs font-medium text-emerald-300">
                  {purchasedResources.length} resources
                </span>
              </div>

              {purchasedResources.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="Your learning journey starts here"
                  description="You haven't purchased any learning resources yet."
                  link="/marketplace"
                  linkText="Explore Marketplace"
                />
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {purchasedResources.map((item) => (
                    <article
                      key={item.orderId + item.title}
                      className="rounded-2xl border border-white/10 bg-[#0c1224] p-5 transition hover:border-emerald-400/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                          <BookOpen size={23} />
                        </div>

                        <span className="flex items-center gap-1 rounded-lg bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">
                          <CheckCircle2 size={13} />
                          Purchased
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-semibold">
                        {item.title}
                      </h3>

                      {item.resource && (
                        <p className="mt-2 text-sm text-slate-400">
                          {item.resource.category} · {item.resource.type}
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                        <div>
                          <p className="text-xs text-slate-500">
                            Purchased on
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {formatDate(item.purchaseDate)}
                          </p>
                        </div>

                        <p className="font-semibold text-emerald-400">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      {item.resource ? (
                        <Link
                          to={`/marketplace`}
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                        >
                          View Marketplace
                          <ArrowUpRight size={16} />
                        </Link>
                      ) : (
                        <p className="mt-5 rounded-xl bg-white/[0.03] px-3 py-3 text-center text-xs text-slate-500">
                          Resource details are currently unavailable.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* PURCHASE HISTORY */}
            <section className="mt-12">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Purchase History
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Your PayPal transaction records.
                  </p>
                </div>

                <CreditCard
                  size={24}
                  className="text-emerald-400"
                />
              </div>

              {dashboard.purchases.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No purchases yet"
                  description="Your successful transactions will appear here."
                  link="/marketplace"
                  linkText="Browse Resources"
                />
              ) : (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#0c1224]">
                  <table className="w-full min-w-[750px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Resources</th>
                        <th className="px-5 py-4">Order ID</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Amount</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard.purchases.map((purchase) => (
                        <tr
                          key={purchase.paypal_order_id}
                          className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-medium text-white">
                              {purchase.resource_names.join(", ")}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {purchase.products.length} resource(s)
                            </p>
                          </td>

                          <td className="px-5 py-4 font-mono text-xs text-slate-400">
                            {purchase.paypal_order_id}
                          </td>

                          <td className="px-5 py-4 text-slate-400">
                            {formatDate(purchase.captured_at ?? null)}
                          </td>

                          <td className="px-5 py-4 font-semibold text-white">
                            {formatCurrency(
                              purchase.amount,
                              purchase.currency
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                              <CheckCircle2 size={13} />
                              Success
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ACCOUNT INFORMATION */}
            <section className="mt-12 rounded-2xl border border-white/10 bg-[#0c1224] p-6">
              <div className="flex items-center gap-3">
                <UserCircle
                  size={26}
                  className="text-emerald-400"
                />

                <h2 className="text-xl font-semibold">
                  Account Information
                </h2>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">
                    Full Name
                  </p>

                  <p className="mt-2 font-medium">
                    {dashboard.user.name || user?.name || "Learner"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Email Address
                  </p>

                  <p className="mt-2 font-medium">
                    {dashboard.user.email || user?.email || "Not available"}
                  </p>
                </div>
              </div>

              <Link
                to="/profile"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Manage Profile
                <ArrowUpRight size={16} />
              </Link>
            </section>
          </>
        )}

        <p className="mt-12 text-center text-xs text-slate-600">
          Skillora AI Learning Marketplace · Your learning journey, all in one place.
        </p>
      </main>
    </div>
  );
}


// --------------------------------------------------
// STATISTICS CARD
// --------------------------------------------------

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: typeof ShoppingBag;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1224] p-5 transition hover:border-emerald-400/30">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {title}
        </p>

        <div className="rounded-xl bg-emerald-400/10 p-2.5 text-emerald-400">
          <Icon size={20} />
        </div>
      </div>

      <h3 className="mt-5 text-2xl font-bold">
        {value}
      </h3>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}


// --------------------------------------------------
// QUICK ACTION CARD
// --------------------------------------------------

function ActionCard({
  title,
  description,
  icon: Icon,
  to,
}: {
  title: string;
  description: string;
  icon: typeof BookOpen;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0c1224] p-5 transition hover:border-emerald-400/40"
    >
      <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
        <Icon size={23} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <ArrowUpRight
        size={18}
        className="shrink-0 text-slate-500 transition group-hover:text-emerald-400"
      />
    </Link>
  );
}


// --------------------------------------------------
// EMPTY STATE
// --------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  description,
  link,
  linkText,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  link: string;
  linkText: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-[#0c1224] px-6 py-12 text-center">
      <Icon
        size={38}
        className="mx-auto text-slate-500"
      />

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        {description}
      </p>

      <Link
        to={link}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        {linkText}
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}

export default DashboardPage;
