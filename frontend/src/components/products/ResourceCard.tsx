import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  Code2,
  GraduationCap,
  Star,
} from "lucide-react";

export interface Resource {
  id: string;
  title: string;
  category: string;
  type: "Course" | "Ebook" | "Project";
  price: number;
  rating: number;
  duration: string;
  level: string;
  description: string;
  color: string;
}

interface ResourceCardProps {
  resource: Resource;
}

const icons = {
  Course: GraduationCap,
  Ebook: BookOpen,
  Project: Code2,
};

function ResourceCard({ resource }: ResourceCardProps) {
  const Icon = icons[resource.type];

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0c1224] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40">
      <div className={`relative flex h-44 items-center justify-center overflow-hidden ${resource.color}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-black/20 text-white shadow-2xl backdrop-blur-sm transition group-hover:scale-110">
          <Icon size={38} strokeWidth={1.5} />
        </div>

        <span className="absolute left-4 top-4 rounded-lg border border-white/15 bg-black/20 px-3 py-1.5 text-xs text-white backdrop-blur-md">
          {resource.type}
        </span>

        <span className="absolute right-4 top-4 rounded-lg bg-black/20 px-3 py-1.5 text-xs text-white backdrop-blur-md">
          {resource.level}
        </span>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium text-emerald-400">
          {resource.category}
        </p>

        <h3 className="mt-2 min-h-12 text-lg font-semibold leading-6 text-white group-hover:text-emerald-300">
          {resource.title}
        </h3>

        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
          {resource.description}
        </p>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {resource.rating.toFixed(1)}
          </span>

          <span className="flex items-center gap-1.5">
            <Clock3 size={14} />
            {resource.duration}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <span className="text-xs text-slate-500">Price</span>
            <p className="text-xl font-bold text-white">
              ₹{resource.price}
            </p>
          </div>

          <button
            aria-label={`View ${resource.title}`}
            onClick={() => alert(`${resource.title}\nPrice: ₹${resource.price}\n\nProduct details will be added later.`)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:border-emerald-400 hover:bg-emerald-400 hover:text-slate-950"
          >
            <ArrowUpRight size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default ResourceCard;