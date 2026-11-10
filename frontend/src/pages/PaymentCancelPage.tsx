import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  XCircle,
  ArrowLeft,
  ShoppingBag,
  Home,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14] px-4 py-12 text-white sm:px-6">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-amber-500/[0.08] blur-[120px]" />

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
          <div className="bg-gradient-to-b from-amber-500/[0.08] to-transparent px-6 pb-8 pt-10 text-center sm:px-10">
            {/* Cancel icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.15,
                type: "spring",
                stiffness: 180,
                damping: 13,
              }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10"
            >
              <XCircle
                className="h-12 w-12 text-amber-300"
                strokeWidth={1.7}
              />
            </motion.div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              CHECKOUT CANCELLED
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Payment cancelled
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400 sm:text-base">
              No worries! Your checkout was cancelled before
              we confirmed a successful payment. You can
              return to the marketplace whenever you're ready.
            </p>
          </div>

          {/* Information */}
          <div className="px-6 pb-6 sm:px-10">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                <div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Your checkout wasn't completed
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    You haven't received a purchase confirmation
                    from Skillora AI. If you believe a payment
                    was captured, verify its status before
                    attempting another payment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 px-6 pb-8 sm:px-10">
            <Link
              to="/marketplace"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-semibold text-[#07110c] shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-300"
            >
              <ShoppingBag className="h-4 w-4" />
              Return to marketplace
              <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
            </Link>

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
          Skillora AI · Secure checkout with PayPal Sandbox
        </p>
      </motion.section>
    </main>
  );
}
