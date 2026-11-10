import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

function AIAssistantCard() {
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [budget, setBudget] = useState("1000");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(budget);

    if (!goal.trim()) {
      setMessage("Please enter a skill you want to learn.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setMessage("Please enter a valid budget.");
      return;
    }

    setMessage(
      `Your learning goal: ${goal.trim()} | Level: ${level} | Budget: ₹${amount.toLocaleString("en-IN")}. AI recommendations will be connected to the backend next.`
    );
  }

  return (
    <section id="ai-assistant" className="scroll-mt-28">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-[#102a2b] via-[#0c1728] to-[#0c1020] p-7 sm:p-10 lg:p-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300">
              <Sparkles size={15} />
              Your personal learning guide
            </div>

            <h2 className="max-w-xl text-3xl font-bold leading-tight text-white sm:text-5xl">
              Your goals.
              <br />
              Your budget.
              <br />
              <span className="text-emerald-400">Your learning path.</span>
            </h2>

            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
              Tell us what you want to learn, your current skill level,
              and your budget. Build a learning journey around your needs.
            </p>

            <div className="mt-8 flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 size={19} className="text-emerald-400" />
              Personalized learning goals
            </div>

            <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 size={19} className="text-emerald-400" />
              Budget-aware recommendations
            </div>

            <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 size={19} className="text-emerald-400" />
              Structured learning roadmap
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-[#080d1b]/90 p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400">
                <BrainCircuit size={23} />
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  Learning Planner
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Tell us about your learning goals
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="learningGoal" className="mb-2 block text-sm text-slate-300">
                What do you want to learn?
              </label>

              <input
                id="learningGoal"
                type="text"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="e.g. Machine Learning"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/60"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="skillLevel" className="mb-2 block text-sm text-slate-300">
                  Skill level
                </label>

                <select
                  id="skillLevel"
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#11192a] px-3 py-3.5 text-sm text-white outline-none focus:border-emerald-400/60"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="mb-2 block text-sm text-slate-300">
                  Budget (₹)
                </label>

                <input
                  id="budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3.5 text-sm text-white outline-none focus:border-emerald-400/60"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <Sparkles size={17} />
              Create my learning plan
              <ArrowRight size={17} />
            </button>

            {message && (
              <div
                aria-live="polite"
                className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-200"
              >
                {message}
              </div>
            )}

            <p className="mt-4 text-center text-xs text-slate-600">
              AI model integration will be implemented in the backend.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

export default AIAssistantCard;