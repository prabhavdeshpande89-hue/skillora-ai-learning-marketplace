import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";

function HomePage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#050816] text-white">
      <Navbar />

      <main className="relative flex min-h-0 flex-1 items-center overflow-hidden">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-400/[0.08] blur-[120px]" />
          <div className="absolute left-0 top-1/3 h-64 w-64 rounded-full bg-violet-500/[0.07] blur-[100px]" />
        </div>

        <section className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-6 py-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-10">
          {/* Left: Hero content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-xs font-medium text-emerald-300 sm:px-4">
              <Sparkles size={15} />
              A smarter way to learn
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5">
                AI-powered
              </span>
            </div>

            <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:mx-0 lg:mt-6 lg:text-7xl">
              Your next skill
              <br />
              starts <span className="text-emerald-400">right here.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base sm:leading-8 lg:mx-0 lg:mt-6 lg:text-lg">
              Discover courses, ebooks, and projects. Let AI help you build a
              learning path that fits your goals and budget.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 sm:px-6"
              >
                Explore marketplace
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/ai-assistant"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-emerald-400/40 sm:px-6"
              >
                <Sparkles size={17} className="text-emerald-400" />
                Meet your AI guide
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-slate-500 lg:justify-start">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Learn at your own pace
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Resources for your budget
              </span>
            </div>
          </div>

          {/* Right: Learning dashboard preview */}
          <div className="relative mx-auto hidden w-full max-w-lg lg:block">
            <div className="absolute -inset-5 rounded-[2rem] bg-emerald-400/[0.06] blur-2xl" />

            <div className="learning-preview relative rounded-3xl border border-white/10 bg-[#0c1224]/95 p-5 text-white shadow-2xl xl:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs text-slate-500">
                    YOUR LEARNING SPACE
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Build something great.
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                  <GraduationCap size={23} />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/10 to-transparent p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                    <BrainCircuit size={21} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      AI learning assistant
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Start with a goal, not a guess.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-[#080d1b] p-3.5">
                  <p className="text-xs text-slate-500">
                    EXAMPLE LEARNING GOAL
                  </p>
                  <p className="mt-2 text-sm text-white">
                    Become a Machine Learning Developer
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
                    <Sparkles size={14} />
                    Personalized recommendations
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3.5">
                  <BookOpen size={22} className="text-violet-300" />
                  <p className="mt-3 text-sm font-medium">
                    Learning resources
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Courses, ebooks and projects
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3.5">
                  <Wallet size={22} className="text-amber-300" />
                  <p className="mt-3 text-sm font-medium">Your budget</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Smarter resource choices
                  </p>
                </div>
              </div>

              <Link
                to="/ai-assistant"
                className="mt-4 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 transition hover:border-emerald-400/30"
              >
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-emerald-400" />
                  <span className="text-xs text-slate-300">
                    Your next step starts here
                  </span>
                </div>

                <ArrowUpRight size={17} className="text-slate-500" />
              </Link>
            </div>
          </div>

          {/* Compact preview for smaller screens */}
          <Link
            to="/marketplace"
            className="mx-auto flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 transition hover:border-emerald-400/30 lg:hidden"
          >
            <BookOpen size={18} className="text-emerald-400" />
            Explore courses, ebooks and projects
            <ArrowRight size={16} className="ml-2 text-emerald-400" />
          </Link>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
