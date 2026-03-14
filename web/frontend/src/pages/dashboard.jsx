import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ChartWrapper from "../components/ChartWrapper";
import QuickActions from "../components/QuickActions";
import AccountBalance from "./AccountBalance";
import Expenses from "./Expenses";
import Goals from "./Goals";
import ManualEntry from "./ManualEntry";
import Transactions from "./Transactions";

function HomeSection() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">This Month Spent</p>
          <p className="mt-2 text-3xl font-black text-slate-900">$1,240</p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Saved</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">$540</p>
        </article>
        <article className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
          <p className="text-sm text-slate-300">Goal Completion</p>
          <p className="mt-2 text-3xl font-black">62%</p>
        </article>
      </div>

      <ChartWrapper
        title="Spending Trend"
        labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
        values={[420, 390, 480, 450, 530, 490]}
      />

      <QuickActions />
    </div>
  );
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const currentSection = searchParams.get("section") || "home";

  const pageMeta = {
    home: { title: "Dashboard", subtitle: "Your financial snapshot at a glance" },
    balance: { title: "Account Balance", subtitle: "Track debit, credit, and net account state" },
    expenses: { title: "Expenses", subtitle: "Understand where your money is going" },
    goals: { title: "Goals", subtitle: "Set clear targets and monitor progress" },
    cashentry: { title: "Cash Entry", subtitle: "Add expenses and income manually" },
    transactions: { title: "Transactions", subtitle: "Review your latest records" },
  };

  const renderSection = () => {
    switch (currentSection) {
      case "balance":
        return <AccountBalance />;
      case "expenses":
        return <Expenses />;
      case "goals":
        return <Goals />;
      case "cashentry":
        return <ManualEntry />;
      case "transactions":
        return <Transactions />;
      default:
        return <HomeSection />;
    }
  };

  const meta = pageMeta[currentSection] || pageMeta.home;

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar currentSection={currentSection} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-0">
        <div className="mx-auto max-w-6xl">
          <Navbar title={meta.title} subtitle={meta.subtitle} />
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
