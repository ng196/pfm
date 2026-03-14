import { useState, useEffect } from "react";

function formatInr(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function categorize(txn) {
  const text = `${txn.narration || ""} ${txn.merchant_name || ""}`.toLowerCase();
  if (/swiggy|zomato|dominos|starbucks|food/.test(text)) return "Food & Dining";
  if (/ola|uber|metro|irctc|transport/.test(text)) return "Transport";
  if (/amazon|flipkart|myntra|nykaa|shopping/.test(text)) return "Shopping";
  if (/netflix|spotify|bookmyshow|entertainment/.test(text)) return "Entertainment";
  return "Other";
}

export default function BudgetTab({ data }) {
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => setRefresh((prev) => prev + 1);
    window.addEventListener("fw-data-changed", handleStorageChange);
    return () => window.removeEventListener("fw-data-changed", handleStorageChange);
  }, []);

  let fw_txns = [];
  let fw_budget = {};
  try {
    fw_txns = JSON.parse(localStorage.getItem("fw_transactions") || "[]");
    fw_budget = JSON.parse(localStorage.getItem("fw_budget") || "{}");
  } catch (e) { }

  const mergedTxns = [...fw_txns, ...(data?.transactions || [])];
  const debitTxns = mergedTxns.filter((txn) => txn.txn_type === "DEBIT");
  const spent = debitTxns.reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

  // Use user-defined budget from AI, fallback to 1.3x spent
  const aiTotalBudget = Object.values(fw_budget).reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const budget = aiTotalBudget > 0 ? aiTotalBudget : Math.max(50000, Math.round(spent * 1.3));

  const categorySpend = debitTxns.reduce((acc, txn) => {
    const category = categorize(txn);
    acc[category] = (acc[category] || 0) + Number(txn.amount || 0);
    return acc;
  }, {});

  const categories = Object.entries(categorySpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Budget</p>
        <h2 className="text-xl font-black text-slate-900">Monthly budget tracker</h2>
      </header>

      <article className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-sm font-black text-slate-900">{formatInr(budget)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Spent</p>
            <p className="text-sm font-black text-rose-700">{formatInr(spent)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Left</p>
            <p className={`text-sm font-black ${budget - spent >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {formatInr(budget - spent)}
            </p>
          </div>
        </div>
      </article>

      <section className="space-y-3">
        {categories.length === 0 ? (
          <article className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">No spending data yet.</p>
          </article>
        ) : (
          categories.map(([name, amount]) => {
            const pct = budget > 0 ? Math.min(100, Math.round((amount / budget) * 100)) : 0;
            return (
              <article key={name} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">{name}</p>
                  <p className="text-sm font-black text-slate-700">{formatInr(amount)}</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className={`h-2 rounded-full ${pct >= 100 ? "bg-rose-500" : "bg-teal-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{pct}% of monthly budget</p>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
