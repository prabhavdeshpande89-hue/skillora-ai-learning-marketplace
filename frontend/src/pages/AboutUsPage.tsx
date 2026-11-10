import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Code2,
  GraduationCap,
  Heart,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";

const values = [
  {
    icon: Lightbulb,
    title: "Learn by Doing",
    description:
      "Go beyond theory with practical resources, projects, and learning materials designed to build real-world skills.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Learning",
    description:
      "Discover learning resources and personalized recommendations that help you focus on what matters most.",
  },
  {
    icon: Users,
    title: "Learning for Everyone",
    description:
      "Make learning more accessible by bringing useful educational resources together in one place.",
  },
  {
    icon: Rocket,
    title: "Grow Without Limits",
    description:
      "Explore new technologies, strengthen your abilities, and keep moving toward your personal and professional goals.",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Curated Resources",
    description:
      "Explore educational resources across technology, programming, AI, and data science.",
  },
  {
    icon: BrainCircuit,
    title: "Smart Recommendations",
    description:
      "Find relevant learning resources with AI-powered recommendations.",
  },
  {
    icon: Code2,
    title: "Practical Skills",
    description:
      "Discover materials that help connect technical concepts with practical applications.",
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative px-6 pb-20 pt-20 sm:pt-28">
        <div className="absolute left-1/2 top-10 -z-0 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm text-emerald-300">
            <Sparkles size={16} />
            About Skillora
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Your journey to
            <span className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
              limitless learning.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            Skillora is an AI-powered learning marketplace designed to help
            learners discover educational resources, explore new technologies,
            and build skills for the future.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/marketplace"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Explore Marketplace
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/ai-assistant"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-medium text-white transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
            >
              Meet Your AI Assistant
              <BrainCircuit size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/[0.09] to-transparent p-8 sm:p-10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Target size={25} />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Our Mission
            </p>

            <h2 className="text-2xl font-bold leading-snug sm:text-3xl">
              Make learning easier to discover and more meaningful to pursue.
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              We aim to bring learning resources and AI-powered assistance
              together in one convenient platform, helping learners spend less
              time searching and more time building their knowledge.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 sm:p-10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
              <GraduationCap size={25} />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
              Our Vision
            </p>

            <h2 className="text-2xl font-bold leading-snug sm:text-3xl">
              A world where everyone can keep learning and growing.
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              We envision a learning experience where discovering useful
              resources, exploring emerging technologies, and developing new
              skills feels accessible, engaging, and rewarding.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              What Guides Us
            </p>

            <h2 className="text-3xl font-bold sm:text-4xl">
              Built around the learner
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              Our approach focuses on practical learning, useful technology,
              accessibility, and continuous improvement.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <article
                  key={value.title}
                  className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 transition group-hover:bg-emerald-400 group-hover:text-slate-950">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-lg font-semibold">{value.title}</h3>

                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {value.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[#0b1020] p-8 sm:p-12">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              The Skillora Experience
            </p>

            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything starts with curiosity.
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              Explore the tools that help make your learning journey more
              organized and engaging.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    <Icon size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950">
            <Heart size={27} />
          </div>

          <h2 className="text-3xl font-bold sm:text-5xl">
            Ready to take the next step?
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-400">
            Discover resources, explore new subjects, and start building the
            skills you want to develop.
          </p>

          <Link
            to="/marketplace"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Start Exploring
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="text-emerald-400" size={22} />
            <span className="text-lg font-bold">
              Skill<span className="text-emerald-400">ora</span>
            </span>
          </Link>

          <p className="text-center text-sm text-slate-500">
            Learn without limits. Grow with purpose.
          </p>

          <Link
            to="/"
            className="text-sm text-slate-400 transition hover:text-emerald-300"
          >
            Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
