import { useCallback, useState, useEffect } from "react";
import { Bot, Plus, Send, Trash2 } from "lucide-react";
import { sendAIMessage } from "../../../services/aiService";

function formatInr(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const DEFAULT_GOALS = [
  { id: "home", name: "Dream Home", target: 2500000, saved: 0, emoji: "🏠", priority: "high", months: 36 },
  { id: "car", name: "New Car", target: 1500000, saved: 0, emoji: "🚗", priority: "medium", months: 24 },
  { id: "fund", name: "Emergency Fund", target: 600000, saved: 0, emoji: "🛟", priority: "high", months: 12 },
];

function computeGoals(data) {
  const netWorth = (data?.accounts || []).reduce((sum, a) => {
    if (a.fi_type === "CREDIT_CARD") return sum - Number(a.outstanding_amount || 0);
    return sum + Number(a.current_balance || 0);
  }, 0);

  let fw_goals = [];
  try {
    fw_goals = JSON.parse(localStorage.getItem("fw_goals") || "[]");
  } catch (e) { }

  const merged = [...DEFAULT_GOALS, ...fw_goals];
  return merged.map((g) => ({
    ...g,
    saved:
      g.saved > 0
        ? g.saved
        : Math.max(0, Math.round(netWorth * (g.id === "home" ? 0.2 : g.id === "car" ? 0.1 : 0.06))),
  }));
}

function generateInsights(goals) {
  if (goals.length === 0) return [];
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const highPriority = goals.filter((g) => g.priority === "high");
  const closest = goals.reduce((best, g) => {
    const p = g.target > 0 ? g.saved / g.target : 0;
    return !best || p > best.p ? { ...g, p } : best;
  }, null);

  return [
    { icon: "📊", label: "Overall Progress", value: `${overallPct}%`, desc: `Across ${goals.length} goals` },
    {
      icon: "⚡",
      label: "High Priority",
      value: formatInr(highPriority.reduce((s, g) => s + (g.target - g.saved), 0)),
      desc: `${highPriority.length} goal${highPriority.length !== 1 ? "s" : ""} need attention`,
    },
    closest ? { icon: "🏁", label: "Closest Goal", value: `${Math.round((closest.p || 0) * 100)}%`, desc: `"${closest.name}" is nearest` } : null,
  ].filter(Boolean);
}

export default function GoalsTab({ data }) {
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => setRefresh((prev) => prev + 1);
    window.addEventListener("fw-data-changed", handleStorageChange);
    return () => window.removeEventListener("fw-data-changed", handleStorageChange);
  }, []);

  const goals = computeGoals(data);
  const insights = generateInsights(goals);
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  const askAI = useCallback(async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput("");
    setAiLoading(true);
    setAiResponse("");

    try {
      const result = await sendAIMessage(text, { data });
      let response = result.message || "No response received.";
      if (result.actions?.length > 0) {
        response += "\n\n" + result.actions.map((a) => `✅ ${a.action}: ${JSON.stringify(a.data)}`).join("\n");
      }
      setAiResponse(response);
    } catch {
      setAiResponse("⚠️ Could not reach AI. Ensure backend is running on port 5000 and ZAI_API_KEY is set in backend .env.");
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiLoading, data]);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Goals</p>
          <h2 className="text-xl font-black text-slate-900">Your goals, on track</h2>
        </div>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 transition-all hover:shadow-lg"
        >
          <Plus size={14} />
          New Goal
        </button>
      </header>

      {/* AI Advisor Card */}
      <article className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500">
            <Bot size={20} />
          </div>
          <div>
            <p className="text-sm font-bold">FinWise Goal Advisor</p>
            <p className="text-xs text-slate-400">AI-powered insights on your financial goals</p>
          </div>
        </div>

        {/* Insights */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {insights.map((ins) => (
            <div key={ins.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-lg">{ins.icon}</p>
              <p className="mt-1 text-xs text-slate-400">{ins.desc}</p>
              <p className="text-lg font-black text-emerald-400">{ins.value}</p>
            </div>
          ))}
        </div>

        {/* AI Input */}
        <div className="flex gap-2">
          <input
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askAI()}
            placeholder="Ask AI: 'How can I save faster for my home?'"
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400"
          />
          <button
            onClick={askAI}
            disabled={!aiInput.trim() || aiLoading}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            <Send size={14} />
            Ask
          </button>
        </div>

        {/* AI Response */}
        {(aiResponse || aiLoading) && (
          <div className="mt-3 rounded-xl border border-teal-500/20 bg-teal-500/10 p-3 text-sm leading-relaxed text-emerald-100">
            {aiLoading ? (
              <span className="text-slate-400">🤖 Thinking...</span>
            ) : (
              aiResponse.split("\n").map((line, i) => <p key={i} className={i > 0 ? "mt-1" : ""}>{line}</p>)
            )}
          </div>
        )}
      </article>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Total Saved</p>
          <p className="mt-1 text-xl font-black text-emerald-700">{formatInr(totalSaved)}</p>
        </article>
        <article className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Total Target</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatInr(totalTarget)}</p>
        </article>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
          const remaining = goal.target - goal.saved;
          const monthlyNeeded = goal.months > 0 ? Math.ceil(remaining / goal.months) : remaining;

          return (
            <article key={goal.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{goal.name}</p>
                    <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${goal.priority === "high" ? "bg-rose-100 text-rose-700" :
                      goal.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                      }`}>
                      {goal.priority}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-black text-teal-600">{pct}%</p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{formatInr(goal.saved)}</span>
                <span>{formatInr(goal.target)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                💡 Save {formatInr(monthlyNeeded)}/month to reach goal in {goal.months} months
              </p>
            </article>
          );
        })}
      </div>

      {/* Add Goal Button */}
      <button
        onClick={() => setShowAddGoal(!showAddGoal)}
        className="w-full rounded-2xl border border-dashed border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
      >
        + Add New Goal
      </button>

      {/* Add Goal Form (simple modal) */}
      {showAddGoal && (
        <div className="rounded-2xl border border-teal-200 bg-white p-5 ring-1 ring-teal-100">
          <h3 className="mb-3 text-sm font-bold text-slate-900">✨ Create Goal via AI</h3>
          <p className="text-xs text-slate-500">
            Use the AI advisor above! Type something like: <em>"Create a vacation goal for ₹50,000 in 6 months"</em>
          </p>
          <button
            onClick={() => setShowAddGoal(false)}
            className="mt-3 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
