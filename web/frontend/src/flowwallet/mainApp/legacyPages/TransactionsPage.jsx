import { useState, useEffect } from "react";

function formatInr(value) {
  const amount = Number(value || 0);
  const sign = amount < 0 ? "-" : "+";
  const abs = Math.abs(amount);
  return `${sign}${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(abs)}`;
}

function formatInrPlain(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function deriveAccountBalance(accounts = []) {
  return accounts.reduce((sum, account) => {
    if (account.fi_type === "CREDIT_CARD") {
      return sum - Number(account.outstanding_amount || 0);
    }
    return sum + Number(account.current_balance || 0);
  }, 0);
}

function deriveCards(accounts = [], userName = "User") {
  const cardsFromBackend = accounts
    .filter((account) => account.fi_type === "CREDIT_CARD")
    .slice(0, 4)
    .map((account, idx) => {
      const masked = String(account.masked_identifier || "");
      const last4Match = masked.match(/(\d{4})(?!.*\d)/);
      const last4 = last4Match ? last4Match[1] : "0000";
      return {
        id: account.id || `card-${idx}`,
        type: "Credit Card",
        number: `**** **** **** ${last4}`,
        name: userName,
        exp: "--/--",
        color: idx % 2 === 0 ? "green" : "red",
      };
    });

  if (cardsFromBackend.length > 0) return cardsFromBackend;

  return [
    {
      id: "fallback-card",
      type: "Credit Card",
      number: "**** **** **** 0000",
      name: userName,
      exp: "--/--",
      color: "green",
    },
  ];
}

function deriveRecentTransactions(transactions = []) {
  return (transactions || []).slice(0, 8).map((txn, idx) => {
    const isCredit = txn.txn_type === "CREDIT";
    return {
      id: txn.id || txn.txn_ref || `txn-${idx}`,
      icon: isCredit ? "👤" : "💳",
      iconTone: isCredit ? "create" : "credit",
      label: txn.merchant_name || txn.narration || (isCredit ? "Credit" : "Debit"),
      date: formatDate(txn.txn_timestamp || txn.value_date),
      amount: isCredit ? Number(txn.amount || 0) : -Number(txn.amount || 0),
    };
  });
}

export default function TransactionsPage({ data }) {
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => setRefresh((prev) => prev + 1);
    window.addEventListener("fw-data-changed", handleStorageChange);
    return () => window.removeEventListener("fw-data-changed", handleStorageChange);
  }, []);

  const userName = data?.user?.full_name || "User";
  const accounts = data?.accounts || [];

  let fw_txns = [];
  try {
    fw_txns = JSON.parse(localStorage.getItem("fw_transactions") || "[]");
  } catch (e) { }

  const txns = [...fw_txns, ...(data?.transactions || [])].sort(
    (a, b) => new Date(b.txn_timestamp || b.value_date || b.createdAt || 0) - new Date(a.txn_timestamp || a.value_date || a.createdAt || 0)
  );

  const balance = deriveAccountBalance(accounts);
  const recent = deriveRecentTransactions(txns);
  const cards = deriveCards(accounts, userName);

  return (
    <div className="space-y-5">
      <article className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-700/30">
        <p className="text-xs uppercase text-emerald-100">Account Balance</p>
        <h1 className="mt-1 text-3xl font-black">{formatInrPlain(balance)}</h1>
        <p className="mt-1 text-xs text-emerald-100">Balance as of {formatDate(new Date().toISOString())}</p>
      </article>

      <section>
        <h2 className="mb-3 text-xl font-black text-slate-900">Transaction History</h2>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-sm text-slate-600">No transactions available yet.</p>
            </article>
          ) : (
            recent.map((txn) => (
              <article key={txn.id} className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <div
                  className={`grid h-11 w-11 place-items-center rounded-lg text-xl ${txn.iconTone === "create" ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                >
                  {txn.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{txn.label}</p>
                  <p className="text-xs text-slate-500">{txn.date}</p>
                </div>
                <p className={`text-sm font-black ${txn.amount < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {formatInr(txn.amount)}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black text-slate-900">Transactions</h2>
        <div className="space-y-3">
          {cards.map((card) => (
            <article
              key={card.id}
              className={`rounded-2xl p-5 text-white shadow-md ${card.color === "green"
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
                  : "bg-gradient-to-br from-rose-500 to-rose-700"
                }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">{card.type}</span>
                <span className="text-lg">●●●●</span>
              </div>
              <p className="mb-4 text-xl font-bold tracking-widest">{card.number}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase text-white/75">Card Holder</p>
                  <p className="text-sm font-semibold">{card.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-white/75">Expires</p>
                  <p className="text-sm font-semibold">{card.exp}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
