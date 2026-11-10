
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Star,
  Clock,
  SlidersHorizontal,
  BookOpen,
  Code2,
  Database,
  BrainCircuit,
  Cloud,
  CheckCircle2,
  ArrowUpDown,
  X,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import ResourceCard, {
  type Resource,
} from "../components/products/ResourceCard";
import { getProducts } from "../services/productService";
import { useAuth } from "../context/AuthContext";

const categories = [
  { name: "All categories", icon: BookOpen },
  { name: "Artificial Intelligence", icon: BrainCircuit },
  { name: "Web Development", icon: Code2 },
  { name: "Data Science", icon: Database },
  { name: "Cloud Computing", icon: Cloud },
  { name: "Cybersecurity", icon: ShieldCheck },
  { name: "Other", icon: Layers },
];

const resourceTypes = ["All types", "Course", "Ebook", "Project"];

type CartItem = Resource & {
  quantity: number;
};

const categoryMap: Record<string, string> = {
  AI: "Artificial Intelligence",
  Cloud: "Cloud Computing",
};

const colorMap: Record<string, string> = {
  violet: "bg-gradient-to-br from-violet-600 to-indigo-950",
  blue: "bg-gradient-to-br from-sky-600 to-blue-950",
  amber: "bg-gradient-to-br from-amber-600 to-orange-950",
  emerald: "bg-gradient-to-br from-emerald-600 to-teal-950",
  pink: "bg-gradient-to-br from-pink-600 to-rose-950",
  cyan: "bg-gradient-to-br from-cyan-600 to-blue-950",
};

// --------------------------------------------------
// READ USER-SPECIFIC CART
// --------------------------------------------------

function getCart(storageKey: string | null): CartItem[] {
  if (!storageKey) return [];

  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) return [];

    const items: unknown = JSON.parse(stored);

    if (!Array.isArray(items)) return [];

    return items
      .filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === "object"
      )
      .filter(
        (item) =>
          typeof item.id === "string" ||
          typeof item.id === "number"
      )
      .filter(
        (item) =>
          typeof item.title === "string" &&
          typeof item.price === "number" &&
          typeof item.quantity === "number" &&
          item.quantity > 0
      )
      .map((item) => ({
        ...(item as unknown as Resource),
        id: String(item.id),
        quantity: Number(item.quantity),
      }));
  } catch {
    return [];
  }
}

// --------------------------------------------------
// NORMALIZE RESOURCE
// --------------------------------------------------

function normalizeResource(resource: Resource): Resource {
  return {
    ...resource,
    id: String(resource.id),
    category: categoryMap[resource.category] ?? resource.category,
    color: colorMap[resource.color] ?? resource.color,
    rating: Number(resource.rating) || 0,
    price: Number(resource.price) || 0,
    duration: resource.duration || "Self-paced",
    level: resource.level || "Beginner",
    description: resource.description || "",
  };
}

// --------------------------------------------------
// MARKETPLACE PAGE
// --------------------------------------------------

function MarketplacePage() {
  const { user } = useAuth();

  // Same storage key used by CartPage.
  const CART_STORAGE_KEY = user
    ? `skillora-cart-${user.id || user.email.toLowerCase()}`
    : null;

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [type, setType] = useState("All types");
  const [sortBy, setSortBy] = useState("featured");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [addedMessage, setAddedMessage] = useState("");

  // --------------------------------------------------
  // LOAD CURRENT USER'S CART
  // --------------------------------------------------

  useEffect(() => {
    setCartItems(getCart(CART_STORAGE_KEY));
    setAddedMessage("");
  }, [CART_STORAGE_KEY]);

  // Sync changes from other browser tabs.
  useEffect(() => {
    function syncCart(event: StorageEvent) {
      if (
        event.key === CART_STORAGE_KEY ||
        event.key === null
      ) {
        setCartItems(getCart(CART_STORAGE_KEY));
      }
    }

    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
    };
  }, [CART_STORAGE_KEY]);

  // --------------------------------------------------
  // SAVE CART
  // --------------------------------------------------

  function saveCart(items: CartItem[]) {
    if (!CART_STORAGE_KEY) return;

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(items)
    );

    setCartItems(items);
  }

  // --------------------------------------------------
  // FETCH PRODUCTS
  // --------------------------------------------------

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const data = await getProducts();

      setResources(data.map(normalizeResource));
    } catch (err) {
      console.error("Unable to load marketplace products:", err);

      setError(
        "We couldn't connect to the marketplace server. Make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  // --------------------------------------------------
  // FILTER AND SORT
  // --------------------------------------------------

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    const results = resources.filter((resource) => {
      const matchesSearch =
        !query ||
        resource.title.toLowerCase().includes(query) ||
        resource.category.toLowerCase().includes(query) ||
        resource.type.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query);

      const matchesCategory =
        category === "All categories" ||
        resource.category === category;

      const matchesType =
        type === "All types" || resource.type === type;

      return matchesSearch && matchesCategory && matchesType;
    });

    if (sortBy === "price-low") {
      results.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      results.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      results.sort((a, b) => b.rating - a.rating);
    }

    return results;
  }, [resources, search, category, type, sortBy]);

  // --------------------------------------------------
  // CART COUNT
  // --------------------------------------------------

  const cartCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartIds = cartItems.map((item) => item.id);

  // --------------------------------------------------
  // ADD RESOURCE TO CART
  // --------------------------------------------------

  function addToCart(resource: Resource) {
    if (!CART_STORAGE_KEY) {
      setAddedMessage("Please log in to add resources to your cart.");
      return;
    }

    const currentCart = getCart(CART_STORAGE_KEY);

    const existingItem = currentCart.find(
      (item) => item.id === resource.id
    );

    let updatedCart: CartItem[];

    if (existingItem) {
      // Increase quantity if the same resource is added again.
      updatedCart = currentCart.map((item) =>
        item.id === resource.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      // Add a different resource as a separate cart item.
      updatedCart = [
        ...currentCart,
        { ...resource, quantity: 1 },
      ];
    }

    saveCart(updatedCart);

    setAddedMessage(`${resource.title} added to your cart.`);
  }

  // --------------------------------------------------
  // RESET FILTERS
  // --------------------------------------------------

  function resetFilters() {
    setSearch("");
    setCategory("All categories");
    setType("All types");
    setSortBy("featured");
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-14 lg:px-8">

        {/* PAGE HEADING */}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Discover and learn
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Learning Marketplace
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Find your next skill with courses, ebooks, and practical
              projects selected for your learning journey.
            </p>
          </div>

          <Link
            to="/cart"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium transition hover:border-emerald-400/40"
          >
            <ShoppingCart size={18} className="text-emerald-400" />

            View cart

            <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-bold text-slate-950">
              {cartCount}
            </span>
          </Link>
        </div>

        {/* SEARCH AND FILTERS */}

        <div className="mt-9 rounded-2xl border border-white/10 bg-[#0c1224] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row">

            <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 focus-within:border-emerald-400/50">
              <Search size={19} className="shrink-0 text-slate-500" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses, ebooks, projects..."
                aria-label="Search learning resources"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 lg:w-64">
              <SlidersHorizontal
                size={18}
                className="shrink-0 text-emerald-400"
              />

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filter by category"
                className="w-full bg-transparent text-sm text-white outline-none"
              >
                {categories.map((item) => (
                  <option
                    key={item.name}
                    value={item.name}
                    className="bg-[#0c1224]"
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex flex-wrap gap-2">
              {resourceTypes.map((resourceType) => (
                <button
                  key={resourceType}
                  onClick={() => setType(resourceType)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                    type === resourceType
                      ? "bg-emerald-400 text-slate-950"
                      : "border border-white/10 bg-white/[0.025] text-slate-400 hover:border-emerald-400/30 hover:text-white"
                  }`}
                >
                  {resourceType}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown size={15} className="text-slate-500" />

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort resources"
                className="rounded-lg border border-white/10 bg-[#0c1224] px-3 py-2 text-xs text-slate-300 outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Highest rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* CATEGORY SHORTCUTS */}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.slice(1).map((item) => {
            const Icon = item.icon;
            const active = category === item.name;

            return (
              <button
                key={item.name}
                onClick={() =>
                  setCategory(
                    active ? "All categories" : item.name
                  )
                }
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition sm:p-4 ${
                  active
                    ? "border-emerald-400/40 bg-emerald-400/[0.08]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <Icon
                  size={19}
                  className="shrink-0 text-emerald-400"
                />

                <span className="text-xs font-medium text-slate-300 sm:text-sm">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* RESULTS HEADING */}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              Explore resources
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading resources..."
                : `${filteredResources.length} resource${
                    filteredResources.length === 1 ? "" : "s"
                  } found`}
            </p>
          </div>

          {(search ||
            category !== "All categories" ||
            type !== "All types" ||
            sortBy !== "featured") && (
            <button
              onClick={resetFilters}
              className="text-sm text-emerald-400 transition hover:text-emerald-300"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* ADDED TO CART FEEDBACK */}

        {addedMessage && (
          <div
            role="status"
            className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-300"
          >
            <CheckCircle2 size={18} />

            {addedMessage}

            <Link
              to="/cart"
              className="ml-auto font-semibold underline"
            >
              View cart
            </Link>

            <button
              onClick={() => setAddedMessage("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* LOADING STATE */}

        {loading && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0c1224] px-6 py-20 text-center">
            <LoaderCircle
              size={36}
              className="animate-spin text-emerald-400"
            />

            <h3 className="mt-5 text-lg font-semibold">
              Loading learning resources
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Connecting to the Skillora backend...
            </p>
          </div>
        )}

        {/* BACKEND ERROR */}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-red-300">
              Unable to load resources
            </h3>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
              {error}
            </p>

            <button
              onClick={() => void loadProducts()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {/* RESOURCE GRID */}

        {!loading && !error && filteredResources.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => {
              const alreadyAdded = cartIds.includes(resource.id);

              return (
                <div key={resource.id} className="flex flex-col">

                  <ResourceCard resource={resource} />

                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0c1224] px-4 py-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-sm text-amber-300">
                        <Star size={15} fill="currentColor" />

                        <span>{resource.rating.toFixed(1)}</span>

                        <span className="text-xs text-slate-500">
                          rating
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={13} />

                        {resource.duration}

                        <span>·</span>

                        {resource.level}
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(resource)}
                      disabled={!CART_STORAGE_KEY}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:px-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                        alreadyAdded
                          ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
                          : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                      }`}
                    >
                      {alreadyAdded ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <ShoppingCart size={15} />
                      )}

                      {alreadyAdded
                        ? "Add another"
                        : "Add to cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NO MATCHING PRODUCTS */}

        {!loading && !error && filteredResources.length === 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c1224] px-6 py-16 text-center">
            <Search
              className="mx-auto text-slate-500"
              size={34}
            />

            <h3 className="mt-4 text-lg font-semibold">
              No resources found
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Try a different search term or change your filters.
            </p>

            <button
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Reset filters
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-xs leading-6 text-slate-600">
          Learning resources are retrieved from the Skillora database.
        </p>

      </main>
    </div>
  );
}

export default MarketplacePage;
