
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  BrainCircuit,
  Sparkles,
  Wallet,
  Target,
  GraduationCap,
  LoaderCircle,
  BookOpen,
  AlertCircle,
  ArrowRight,
  Clock3,
  Layers3,
  RotateCcw,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import {
  getAIRecommendations,
  type RecommendationResponse,
} from "../services/aiService";

interface LearningResource {
  id: string;
  title: string;
  type: string;
  price: number;
  category: string;
  level: string;
  description: string;
}

function parseRecommendations(markdown: string): LearningResource[] {
  const resources: LearningResource[] = [];
  const lines = markdown.split("\n");

  let current: Partial<LearningResource> | null = null;

  for (const line of lines) {
    const titleMatch = line.match(/^\s*\d+\.\s+\*\*(.+?)\*\*/);

    if (titleMatch) {
      if (current?.title) {
        resources.push({
          id: current.id || String(resources.length + 1),
          title: current.title,
          type: current.type || "Resource",
          price: current.price || 0,
          category: current.category || "Learning",
          level: current.level || "All levels",
          description:
            current.description || "Explore this learning resource.",
        });
      }

      current = {
        title: titleMatch[1].trim(),
        id: String(resources.length + 1),
        type: "Resource",
        price: 0,
        category: "Learning",
        level: "All levels",
        description: "Explore this learning resource.",
      };

      continue;
    }

    if (!current) continue;

    const idMatch = line.match(/ID:\s*([^\n]+)/i);
    const typeMatch = line.match(/Type:\s*([^\n]+)/i);
    const priceMatch = line.match(/Price:\s*₹?\s*([\d,.]+)/i);
    const categoryMatch = line.match(/Category:\s*([^\n]+)/i);
    const levelMatch = line.match(/Level:\s*([^\n]+)/i);
    const descriptionMatch = line.match(/Description:\s*([^\n]+)/i);

    if (idMatch) current.id = idMatch[1].trim();
    if (typeMatch) current.type = typeMatch[1].trim();

    if (priceMatch) {
      current.price = Number(priceMatch[1].replace(/,/g, "")) || 0;
    }

    if (categoryMatch) current.category = categoryMatch[1].trim();
    if (levelMatch) current.level = levelMatch[1].trim();

    if (descriptionMatch) {
      current.description = descriptionMatch[1].trim();
    }
  }

  if (current?.title) {
    resources.push({
      id: current.id || String(resources.length + 1),
      title: current.title,
      type: current.type || "Resource",
      price: current.price || 0,
      category: current.category || "Learning",
      level: current.level || "All levels",
      description:
        current.description || "Explore this learning resource.",
    });
  }

  return resources;
}

function AIRecommendationsPage() {
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [budget, setBudget] = useState("");

  const [result, setResult] =
    useState<RecommendationResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prevent the browser document from scrolling while this page is mounted.
  // Restore the original styles when navigating away.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyMargin = body.style.margin;
    const previousBodyHeight = body.style.height;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.margin = "0";
    body.style.height = "100%";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.margin = previousBodyMargin;
      body.style.height = previousBodyHeight;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (goal.trim().length < 3) {
      setError("Please enter a learning goal with at least 3 characters.");
      return;
    }

    const numericBudget = Number(budget);

    if (
      !budget.trim() ||
      !Number.isFinite(numericBudget) ||
      numericBudget < 1 ||
      numericBudget > 100000
    ) {
      setError("Please enter a budget between ₹1 and ₹1,00,000.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await getAIRecommendations({
        goal: goal.trim(),
        level,
        budget: numericBudget,
      });

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate recommendations. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setGoal("");
    setLevel("Beginner");
    setBudget("");
    setResult(null);
    setError("");
  }

  const resources = result
    ? parseRecommendations(result.recommendations)
    : [];

  const totalCost = resources.reduce(
    (total, resource) => total + resource.price,
    0,
  );

  const remainingBudget = Math.max(
    0,
    Number(result?.budget || 0) - totalCost,
  );

  const budgetUsedPercentage =
    Number(result?.budget || 0) > 0
      ? Math.min(
          100,
          (totalCost / Number(result?.budget)) * 100,
        )
      : 0;

  const roadmap = [
    {
      step: "01",
      title: "Learn the fundamentals",
      description:
        "Build a strong foundation with the recommended learning materials.",
    },
    {
      step: "02",
      title: "Practice what you learn",
      description:
        "Apply concepts through exercises and practical examples.",
    },
    {
      step: "03",
      title: "Build a real project",
      description:
        "Turn your knowledge into a project you can showcase.",
    },
  ];

  return (
    <div className="ai-recommendations-page flex h-screen h-[100dvh] flex-col overflow-hidden bg-[#050816] text-white">
      {/* Fixed-height navbar area */}
      <header className="relative z-50 shrink-0">
        <Navbar />
      </header>

      {/* Remaining viewport height below the navbar */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        {/* The initial form fits the viewport; long results scroll inside this area. */}
        <div
          className="h-full overflow-x-hidden overflow-y-auto overscroll-contain"
          style={{ scrollbarWidth: "none" }}
        >
          <div
            className={[
              "mx-auto flex w-full max-w-7xl flex-col px-4",
              "py-3 sm:px-6 sm:py-4 lg:px-8",
              result ? "pb-6" : "justify-center",
            ].join(" ")}
          >
            {/* Page heading */}
            <section
              className={[
                "text-center",
                result ? "mb-5 sm:mb-6" : "mb-4 sm:mb-5",
              ].join(" ")}
            >
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 sm:h-10 sm:w-10">
                <BrainCircuit
                  size={21}
                  className="text-emerald-400"
                />
              </div>

              <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400 sm:mt-3 sm:text-[10px]">
                Powered by AI
              </p>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Your personal learning advisor
              </h1>

              <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                Tell Skillora what you want to learn, your experience
                level, and your budget. Get a learning plan tailored
                to your goals.
              </p>
            </section>

            {/* Recommendation form */}
            <form
              onSubmit={handleSubmit}
              className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0c1224] p-4 sm:rounded-3xl sm:p-5 lg:p-6"
            >
              {/* Learning goal */}
              <div>
                <label
                  htmlFor="goal"
                  className="mb-2 flex items-center gap-2 text-xs font-semibold sm:text-sm"
                >
                  <Target
                    size={17}
                    className="shrink-0 text-emerald-400"
                  />
                  What do you want to learn?
                </label>

                <textarea
                  id="goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="Example: I want to learn AI and machine learning"
                  minLength={3}
                  maxLength={300}
                  required
                  rows={2}
                  className="min-h-[66px] w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-5 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50 sm:min-h-[76px]"
                />
              </div>

              {/* Skill level and budget */}
              <div className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5">
                <div>
                  <label
                    htmlFor="level"
                    className="mb-2 flex items-center gap-2 text-xs font-semibold sm:text-sm"
                  >
                    <GraduationCap
                      size={17}
                      className="shrink-0 text-emerald-400"
                    />
                    Current skill level
                  </label>

                  <select
                    id="level"
                    value={level}
                    onChange={(event) => setLevel(event.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#111a30] px-3 text-sm outline-none focus:border-emerald-400/50 sm:px-4"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="budget"
                    className="mb-2 flex items-center gap-2 text-xs font-semibold sm:text-sm"
                  >
                    <Wallet
                      size={17}
                      className="shrink-0 text-emerald-400"
                    />
                    Learning budget (INR)
                  </label>

                  <input
                    id="budget"
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                    required
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    placeholder="Enter your budget (e.g. 800)"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50 sm:px-4"
                  />
                </div>
              </div>

              {/* Validation or API error */}
              {error && (
                <div
                  role="alert"
                  className="mt-4 flex gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-xs leading-5 text-red-300"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Generate plan */}
              <button
                type="submit"
                disabled={loading || !goal.trim() || !budget.trim()}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-5 sm:min-h-12"
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Building your learning plan...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate my learning plan
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <p className="mt-2.5 text-center text-[10px] leading-4 text-slate-500 sm:mt-3 sm:text-xs">
                Recommendations are selected from Skillora&apos;s
                available catalogue.
              </p>
            </form>

            {/* Results dashboard */}
            {result && (
              <section
                className="mt-6 space-y-5 sm:mt-8 sm:space-y-6"
                aria-live="polite"
              >
                {/* Results heading */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 sm:text-sm">
                      <CheckCircle2 size={17} />
                      YOUR PLAN IS READY
                    </div>

                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                      Your learning dashboard
                    </h2>

                    <p className="mt-2 break-words text-sm text-slate-400">
                      {result.goal}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:border-emerald-400/40 hover:text-white sm:self-center"
                  >
                    <RotateCcw size={16} />
                    New plan
                  </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="rounded-2xl border border-white/10 bg-[#0c1224] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Total cost
                      </span>
                      <IndianRupee
                        size={19}
                        className="text-emerald-400"
                      />
                    </div>

                    <p className="mt-3 text-2xl font-bold sm:text-3xl">
                      ₹{totalCost.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Recommended bundle
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0c1224] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Resources
                      </span>
                      <Layers3
                        size={19}
                        className="text-sky-400"
                      />
                    </div>

                    <p className="mt-3 text-2xl font-bold sm:text-3xl">
                      {resources.length}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Selected for your learning goal
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0c1224] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Budget left
                      </span>
                      <Wallet
                        size={19}
                        className="text-amber-400"
                      />
                    </div>

                    <p className="mt-3 text-2xl font-bold sm:text-3xl">
                      ₹{remainingBudget.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      From ₹
                      {Number(result.budget).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Budget overview */}
                <div className="rounded-2xl border border-white/10 bg-[#0c1224] p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        Budget overview
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        How your learning budget is allocated
                      </p>
                    </div>

                    <span className="text-sm font-bold text-emerald-400">
                      {budgetUsedPercentage.toFixed(1)}%
                    </span>
                  </div>

                  <div
                    className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-label="Budget used"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(budgetUsedPercentage)}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{
                        width: `${budgetUsedPercentage}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between gap-3 text-xs text-slate-500">
                    <span>
                      Spent: ₹{totalCost.toLocaleString("en-IN")}
                    </span>
                    <span>
                      Budget: ₹
                      {Number(result.budget).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Recommended resources */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold">
                      Recommended resources
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Learning materials selected for your goal and budget.
                    </p>
                  </div>

                  {resources.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {resources.map((resource, index) => (
                        <article
                          key={`${resource.id}-${index}`}
                          className="group rounded-2xl border border-white/10 bg-[#0c1224] p-4 transition duration-200 hover:border-emerald-400/30 sm:p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                              <BookOpen
                                size={22}
                                className="text-emerald-400"
                              />
                            </div>

                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                              {resource.type}
                            </span>
                          </div>

                          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-emerald-400">
                            {resource.category}
                          </p>

                          <h4 className="mt-2 break-words text-lg font-bold transition group-hover:text-emerald-300">
                            {resource.title}
                          </h4>

                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            {resource.description}
                          </p>

                          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                            <div>
                              <p className="text-xl font-bold">
                                ₹
                                {resource.price.toLocaleString("en-IN")}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {resource.level}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock3 size={14} />
                              Resource {index + 1}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-[#0c1224] p-8 text-center">
                      <BookOpen
                        size={30}
                        className="mx-auto text-slate-500"
                      />

                      <h4 className="mt-3 font-semibold">
                        No resources found
                      </h4>

                      <p className="mt-2 text-sm text-slate-400">
                        The response could not be converted into resource
                        cards. Try generating a new plan.
                      </p>
                    </div>
                  )}
                </div>

                {/* Learning roadmap */}
                <div className="rounded-2xl border border-white/10 bg-[#0c1224] p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                      <GraduationCap
                        size={22}
                        className="text-emerald-400"
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold">
                        Your learning roadmap
                      </h3>
                      <p className="text-sm text-slate-400">
                        Three simple steps to get started
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {roadmap.map((step) => (
                      <div
                        key={step.step}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                      >
                        <span className="text-sm font-bold text-emerald-400">
                          STEP {step.step}
                        </span>

                        <h4 className="mt-3 font-semibold">
                          {step.title}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Marketplace action */}
                <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4 sm:flex-row sm:items-center sm:p-6">
                  <div>
                    <h3 className="font-bold">
                      Ready to continue learning?
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Explore the marketplace for more learning materials.
                    </p>
                  </div>

                  <a
                    href="/marketplace"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Explore marketplace
                    <ArrowRight size={17} />
                  </a>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AIRecommendationsPage;
