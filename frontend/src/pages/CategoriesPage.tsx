import { Link } from "react-router-dom";
import {
  BrainCircuit,
  Code2,
  Database,
  Cloud,
  ArrowRight,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";

const categories = [
  {
    title: "Artificial Intelligence",
    description: "Machine learning, deep learning, and generative AI.",
    icon: BrainCircuit,
  },
  {
    title: "Web Development",
    description: "Frontend, backend, and full-stack development.",
    icon: Code2,
  },
  {
    title: "Data Science",
    description: "Data analysis, visualization, and statistics.",
    icon: Database,
  },
  {
    title: "Cloud Computing",
    description: "Cloud platforms, deployment, and DevOps.",
    icon: Cloud,
  },
];

function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
          Find your direction
        </p>

        <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
          Explore Categories
        </h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Choose a field and discover resources that match your interests.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <article
                key={category.title}
                className="rounded-2xl border border-white/10 bg-[#0c1224] p-7 transition hover:-translate-y-1 hover:border-emerald-400/40"
              >
                <Icon size={34} className="text-emerald-400" />

                <h2 className="mt-6 text-xl font-semibold">
                  {category.title}
                </h2>

                <p className="mt-3 min-h-16 text-sm leading-6 text-slate-400">
                  {category.description}
                </p>

                <Link
                  to="/marketplace"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-400"
                >
                  Browse resources <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default CategoriesPage;