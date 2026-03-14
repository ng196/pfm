import { useState, useEffect } from "react";

function formatInr(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSignedInr(value) {
  const amount = Number(value || 0);
  const sign = amount < 0 ? "-" : "+";
  const abs = Math.abs(amount);
  return `${sign}${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function computeNetWorth(accounts) {
  return (accounts || []).reduce((sum, account) => {
    if (account.fi_type === "CREDIT_CARD") {
      return sum - Number(account.outstanding_amount || 0);
    }
    return sum + Number(account.current_balance || 0);
  }, 0);
}

export default function HomeTab({ data }) {
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => setRefresh((prev) => prev + 1);
    window.addEventListener("fw-data-changed", handleStorageChange);
    return () => window.removeEventListener("fw-data-changed", handleStorageChange);
  }, []);

  let fw_txns = [];
  try {
    fw_txns = JSON.parse(localStorage.getItem("fw_transactions") || "[]");
  } catch (e) { }

  const accounts = data.accounts || [];
  const txns = [...fw_txns, ...(data.transactions || [])].sort(
    (a, b) => new Date(b.txn_timestamp || b.value_date || b.createdAt || 0) - new Date(a.txn_timestamp || a.value_date || a.createdAt || 0)
  );

  const insights = data.insights || {};
  const netWorth = computeNetWorth(accounts);
  const income = Number(insights?.last30Days?.credit || 0) + fw_txns.filter(t => t.txn_type === "CREDIT").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const expense = Number(insights?.last30Days?.debit || 0) + fw_txns.filter(t => t.txn_type === "DEBIT").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const recentTxns = txns.slice(0, 5);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Home</p>
          <h2 className="text-xl font-black text-slate-900">Good to see you, {data.user?.full_name || "there"}</h2>
        </div>
      </header>

      <article className="rounded-2xl bg-slate-900 p-4 text-white shadow-md">
        <p className="text-xs uppercase tracking-wide text-slate-300">Net Worth</p>
        <p className="mt-1 text-2xl font-black">{formatInr(netWorth)}</p>
        <p className="mt-1 text-xs text-slate-300">Across linked banks, cards, and investments</p>
      </article>

      <div className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-500">Income</p>
          <p className="mt-1 text-lg font-black text-emerald-700">{formatInr(income)}</p>
          <p className="text-xs text-slate-500">Last 30 days</p>
        </article>
        <article className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-500">Expense</p>
          <p className="mt-1 text-lg font-black text-rose-700">{formatInr(expense)}</p>
          <p className="text-xs text-slate-500">Last 30 days</p>
        </article>
      </div>

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Your Accounts</p>
        <div className="space-y-2">
          {(accounts || []).slice(0, 8).map((account) => {
            const isCard = account.fi_type === "CREDIT_CARD";
            const value = isCard
              ? -Number(account.outstanding_amount || 0)
              : Number(account.current_balance || 0);
            return (
              <article key={account.id} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{account.account_name || account.fi_type}</p>
                    <p className="text-xs text-slate-500">{account.fi_type.replace(/_/g, " ")}</p>
                  </div>
                  <p className={`text-sm font-black ${value < 0 ? "text-rose-700" : "text-slate-900"}`}>
                    {formatInr(value)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Recent Transactions</p>
        <div className="space-y-2">
          {recentTxns.length === 0 ? (
            <article className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <p className="text-sm text-slate-600">No transactions yet.</p>
            </article>
          ) : (
            recentTxns.map((txn, idx) => {
              const isCredit = txn.txn_type === "CREDIT";
              const signedAmount = isCredit ? Number(txn.amount || 0) : -Number(txn.amount || 0);
              return (
                <article key={txn.id || txn.txn_ref || idx} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{txn.merchant_name || txn.narration || "Transaction"}</p>
                      <p className="text-xs text-slate-500">{formatDate(txn.txn_timestamp || txn.value_date)}</p>
                    </div>
                    <p className={`text-sm font-black ${signedAmount < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                      {formatSignedInr(signedAmount)}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            ["Transfer", "↗"],
            ["Search", "⌕"],
            ["Add", "+"],
            ["More", "⋯"],
          ].map(([label, icon]) => (
            <button key={label} className="rounded-xl bg-white p-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
              <p className="text-lg">{icon}</p>
              <p className="mt-1">{label}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
