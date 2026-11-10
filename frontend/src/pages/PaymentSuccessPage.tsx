import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  CircleAlert,
  LoaderCircle,
  Sparkles,
  Home,
} from "lucide-react";
import { capturePaymentOrder } from "../services/paymentService";

type PaymentResult = {
  success: boolean;
  status: string;
  paypal_order_id: string;
  message: string;
  captures?: {
    capture_id: string;
    amount?: {
      currency_code: string;
      value: string;
    };
  }[];
};

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();

  const [message, setMessage] = useState(
    "We're securely verifying your payment with PayPal.",
  );
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    let active = true;

    async function capture() {
      const orderId = searchParams.get("token");

      if (!orderId) {
        setMessage("We couldn't find your PayPal order ID.");
        setLoading(false);
        return;
      }

      try {
        const response = (await capturePaymentOrder(
          orderId,
        )) as PaymentResult;

        if (!active) return;

        setResult(response);
        setMessage(
          response.success
            ? "Your payment has been verified successfully."
            : "We couldn't confirm your payment.",
        );
      } catch (error) {
        if (!active) return;

        setMessage(
          error instanceof Error
            ? error.message
            : "Payment verification failed. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void capture();

    return () => {
      active = false;
    };
  }, [searchParams]);

  const successful = !loading && result?.success === true;
  const failed = !loading && !successful;

  const capture = result?.captures?.[0];
  const amount = capture?.amount;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14] px-4 py-12 text-white sm:px-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="absolute bottom-[-160px] right-[-100px] h-[360px] w-[360px] rounded-full bg-blue-600/10 blur-[110px]" />

        <div className="absolute inset-0 bg-[radial-gradient(#ffffff09_1px,transparent_1px)] [background-size:26px_26px]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative w-full max-w-lg"
      >
        {/* Brand */}
        <Link
          to="/marketplace"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-lg shadow-black/20">
            <Sparkles className="h-5 w-5 text-emerald-300" />
          </div>

          <span className="text-2xl font-bold tracking-tight">
            Skillora<span className="text-emerald-400"> AI</span>
          </span>
        </Link>

        {/* Main card */}
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/30 backdrop-blur-2xl">
          {/* Status banner */}
          <div
            className={`px-6 pb-8 pt-10 text-center sm:px-10 ${
              successful
                ? "bg-gradient-to-b from-emerald-500/[0.10] to-transparent"
                : failed
                  ? "bg-gradient-to-b from-amber-500/[0.08] to-transparent"
                  : "bg-gradient-to-b from-blue-500/[0.08] to-transparent"
            }`}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.15,
                type: "spring",
                stiffness: 180,
                damping: 13,
              }}
              className={`relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border ${
                successful
                  ? "border-emerald-400/30 bg-emerald-400/10"
                  : failed
                    ? "border-amber-400/30 bg-amber-400/10"
                    : "border-blue-400/30 bg-blue-400/10"
              }`}
            >
              {successful && (
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1.15, opacity: 0 }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 rounded-full border border-emerald-400/60"
                />
              )}

              {loading ? (
                <LoaderCircle className="h-11 w-11 animate-spin text-blue-300" />
              ) : successful ? (
                <Check
                  className="h-12 w-12 text-emerald-300"
                  strokeWidth={2.5}
                />
              ) : (
                <CircleAlert className="h-11 w-11 text-amber-300" />
              )}
            </motion.div>

            <div
              className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                successful
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : failed
                    ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                    : "border-blue-400/20 bg-blue-400/10 text-blue-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  successful
                    ? "bg-emerald-400"
                    : failed
                      ? "bg-amber-400"
                      : "animate-pulse bg-blue-400"
                }`}
              />

              {loading
                ? "VERIFYING PAYMENT"
                : successful
                  ? "PAYMENT CONFIRMED"
                  : "PAYMENT NOT CONFIRMED"}
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {loading
                ? "Just a moment..."
                : successful
                  ? "Payment successful!"
                  : "Payment needs attention"}
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400 sm:text-base">
              {loading
                ? "Please wait while we confirm your transaction with PayPal."
                : message}
            </p>
          </div>

          {/* Transaction details */}
          {!loading && successful && result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="px-6 pb-6 sm:px-10"
            >
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <ShoppingBag className="h-4 w-4" />
                    Transaction details
                  </div>

                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>

                {amount && (
                  <div className="mb-5 border-b border-white/[0.08] pb-5">
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Amount paid
                    </p>

                    <p className="text-4xl font-bold tracking-tight">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: amount.currency_code,
                      }).format(Number(amount.value))}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Confirmed by PayPal Sandbox
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-slate-400">
                      Payment status
                    </span>

                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      {result.status}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-slate-400">
                      Payment provider
                    </span>

                    <span className="text-right text-sm font-medium text-slate-200">
                      PayPal Sandbox
                    </span>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-slate-400">
                      PayPal order ID
                    </p>

                    <div className="break-all rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 font-mono text-xs leading-5 text-slate-300">
                      {result.paypal_order_id}
                    </div>
                  </div>

                  {capture?.capture_id && (
                    <div>
                      <p className="mb-2 text-sm text-slate-400">
                        Capture ID
                      </p>

                      <div className="break-all rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 font-mono text-xs leading-5 text-slate-300">
                        {capture.capture_id}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                <p className="text-xs leading-5 text-slate-400">
                  Your payment was verified by our backend.
                  This transaction was processed in PayPal's
                  Sandbox testing environment.
                </p>
              </div>
            </motion.div>
          )}

          {/* Failed or cancelled verification */}
          {failed && (
            <div className="px-6 pb-6 sm:px-10">
              <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-5">
                <p className="text-sm font-medium text-amber-200">
                  What can you do next?
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Return to the marketplace and try again if
                  you want to complete your purchase. If you
                  believe you were charged, check your
                  transaction status before retrying.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 px-6 pb-8 sm:px-10">
            {successful ? (
              <Link
                to="/marketplace"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-semibold text-[#07110c] shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-300"
              >
                Continue learning
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : failed ? (
              <Link
                to="/marketplace"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                <ShoppingBag className="h-4 w-4" />
                Return to marketplace
              </Link>
            ) : (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-400/10 px-5 py-3.5 text-sm font-medium text-blue-200">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Verifying transaction...
              </div>
            )}

            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
            >
              <Home className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Secure checkout experience · Powered by PayPal Sandbox
        </p>
      </motion.section>
    </main>
  );
}
