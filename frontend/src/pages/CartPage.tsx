
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  BookOpen,
  ShieldCheck,
  Sparkles,
  PackageOpen,
  LoaderCircle,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import type { Resource } from "../components/products/ResourceCard";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";

type CartItem = Resource & {
  quantity: number;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

interface PaymentOrderResponse {
  id: string;
  status: string;
  currency: string;
  paypal_amount: string;
  original_total_inr: number;
  exchange_rate_inr_per_usd: string;
  products: Array<{
    id: string;
    title: string;
    price: number;
  }>;
  approval_url: string;
}

// --------------------------------------------------
// READ USER-SPECIFIC CART
// --------------------------------------------------

function readCart(storageKey: string | null): CartItem[] {
  if (!storageKey) return [];

  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === "object"
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
// AUTHENTICATED PAYPAL ORDER CREATION
// --------------------------------------------------

async function createAuthenticatedPaymentOrder(
  productIds: string[]
): Promise<PaymentOrderResponse> {
  const token = authService.getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please log in again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/payments/create-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_ids: productIds,
      }),
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Your login session is invalid or expired. Please log in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        result?.detail ||
          "You do not have permission to make this payment."
      );
    }

    throw new Error(
      result?.detail ||
        result?.message ||
        `Checkout failed (${response.status}).`
    );
  }

  return result as PaymentOrderResponse;
}

// --------------------------------------------------
// CART PAGE
// --------------------------------------------------

function CartPage() {
  const { user } = useAuth();

  // Unique cart key for each logged-in account.
  const CART_STORAGE_KEY = user
    ? `skillora-cart-${user.id || user.email.toLowerCase()}`
    : null;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Load the current user's cart.
  useEffect(() => {
    setCartItems(readCart(CART_STORAGE_KEY));
    setCheckoutError("");
  }, [CART_STORAGE_KEY]);

  // Sync cart changes from other browser tabs.
  useEffect(() => {
    function syncCart(event: StorageEvent) {
      if (
        event.key === CART_STORAGE_KEY ||
        event.key === null
      ) {
        setCartItems(readCart(CART_STORAGE_KEY));
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
  // CART OPERATIONS
  // --------------------------------------------------

  function increaseQuantity(id: string) {
    saveCart(
      cartItems.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseQuantity(id: string) {
    saveCart(
      cartItems
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(id: string) {
    saveCart(
      cartItems.filter((item) => item.id !== id)
    );
  }

  function clearCart() {
    saveCart([]);
  }

  // --------------------------------------------------
  // CHECKOUT
  // --------------------------------------------------

  async function handleCheckout() {
    if (checkoutLoading) return;

    setCheckoutError("");

    if (cartItems.length === 0) {
      setCheckoutError("Your shopping cart is empty.");
      return;
    }

    const token = authService.getToken();

    if (!token) {
      setCheckoutError(
        "Please log in to continue with checkout."
      );
      return;
    }

    setCheckoutLoading(true);

    try {
      // Backend currently supports one unit per resource.
      if (cartItems.some((item) => item.quantity !== 1)) {
        throw new Error(
          "Please set each product quantity to 1 before checkout. " +
            "Multiple quantities are not yet supported by the payment backend."
        );
      }

      // Send all selected resource IDs together.
      const productIds: string[] = cartItems.map(
        (item) => item.id
      );

      const order = await createAuthenticatedPaymentOrder(
        productIds
      );

      if (!order.id) {
        throw new Error(
          "The payment server did not return a valid order ID."
        );
      }

      if (!order.approval_url) {
        throw new Error(
          "PayPal did not return an approval URL. Please try again."
        );
      }

      // Preserve the cart until payment is confirmed.
      sessionStorage.setItem(
        "skillora-paypal-order-id",
        order.id
      );

      // Remember which user's cart belongs to this order.
      sessionStorage.setItem(
        "skillora-checkout-cart-key",
        CART_STORAGE_KEY || ""
      );

      // Redirect to PayPal Sandbox.
      window.location.assign(order.approval_url);
    } catch (error) {
      console.error("PayPal checkout error:", error);

      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Unable to start checkout. Please try again."
      );

      setCheckoutLoading(false);
    }
  }

  // --------------------------------------------------
  // CART TOTALS
  // --------------------------------------------------

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(price);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-14 lg:px-8">

        {/* HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Your learning collection
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
              Shopping Cart
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              Review your selected learning resources before checkout.
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-400">
            <ShoppingCart size={27} />
          </div>
        </div>

        {/* EMPTY CART */}

        {cartItems.length === 0 ? (
          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-white/10 bg-[#0c1224] px-6 py-14 text-center sm:py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
              <PackageOpen size={38} />
            </div>

            <h2 className="mt-7 text-2xl font-bold">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
              Your next skill is waiting for you. Explore our courses,
              ebooks, and practical projects to start building your
              learning journey.
            </p>

            <Link
              to="/marketplace"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Explore Marketplace
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (

          /* CART CONTENT */

          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_360px]">

            {/* SELECTED RESOURCES */}

            <section className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  Selected resources

                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({totalItems} {totalItems === 1 ? "item" : "items"})
                  </span>
                </h2>

                <button
                  onClick={clearCart}
                  disabled={checkoutLoading}
                  className="inline-flex items-center gap-2 text-xs text-slate-400 transition hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Clear cart
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {cartItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#0c1224] p-4 sm:p-5"
                  >
                    <div className="flex gap-4">
                      <div
                        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl sm:h-24 sm:w-24 ${item.color}`}
                      >
                        <BookOpen
                          size={30}
                          className="text-white/90"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-emerald-400">
                              {item.category}
                            </p>

                            <h3 className="mt-1 font-semibold leading-6 text-white">
                              {item.title}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.type} · {item.level}
                            </p>
                          </div>

                          <p className="font-semibold text-white">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center rounded-lg border border-white/10">
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              disabled={checkoutLoading}
                              aria-label={`Decrease quantity of ${item.title}`}
                              className="p-2 text-slate-400 transition hover:text-white disabled:opacity-50"
                            >
                              <Minus size={15} />
                            </button>

                            <span className="min-w-8 text-center text-sm">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => increaseQuantity(item.id)}
                              disabled={checkoutLoading}
                              aria-label={`Increase quantity of ${item.title}`}
                              className="p-2 text-slate-400 transition hover:text-white disabled:opacity-50"
                            >
                              <Plus size={15} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={checkoutLoading}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-red-400 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <Link
                to="/marketplace"
                className="mt-6 inline-flex items-center gap-2 text-sm text-emerald-400 transition hover:text-emerald-300"
              >
                <ArrowLeft size={17} />
                Continue shopping
              </Link>
            </section>

            {/* ORDER SUMMARY */}

            <aside className="rounded-2xl border border-white/10 bg-[#0c1224] p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold">
                Order summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Discount</span>
                  <span>{formatPrice(0)}</span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>

                    <span className="text-xl font-bold text-emerald-400">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CHECKOUT ERROR */}

              {checkoutError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm leading-6 text-red-300"
                >
                  {checkoutError}
                </div>
              )}

              {/* CHECKOUT BUTTON */}

              <button
                onClick={handleCheckout}
                disabled={
                  checkoutLoading || cartItems.length === 0
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutLoading ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                    Connecting to PayPal...
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                You will be redirected to PayPal Sandbox to approve
                your test payment.
              </p>

              {/* SECURITY INFORMATION */}

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-emerald-400"
                  />

                  <div>
                    <p className="text-sm font-medium">
                      PayPal Sandbox checkout
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Test payments only. Your order will be verified
                      and recorded by the backend after payment capture.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Sparkles
                  size={15}
                  className="text-emerald-400"
                />
                Invest in your next skill.
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default CartPage;
