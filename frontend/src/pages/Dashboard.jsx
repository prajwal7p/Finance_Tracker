import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Landmark, PiggyBank, Wallet } from 'lucide-react';
import API from '../services/api';

const StatCard = ({ label, value, icon: Icon, tone }) => (
  <div className="glass-panel p-5 rounded-2xl border border-slate-800">
    <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-slate-400">{label}</p><Icon className={`w-5 h-5 ${tone}`} /></div>
    <p className="mt-3 text-2xl font-bold text-white">₹{Number(value || 0).toLocaleString()}</p>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { API.get('/analytics/dashboard').then((res) => setData(res.data.data)).catch(() => setError('Unable to load dashboard data.')); }, []);
  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <div className="p-12 text-center text-slate-400">Loading dashboard…</div>;
  const { summary, recentTransactions = [], topCategoryExpenses = [] } = data;
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-white">Dashboard Overview</h1><p className="text-sm text-slate-400">Your real-time financial summary.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Income" value={summary.totalIncome} icon={ArrowUpRight} tone="text-emerald-400" />
      <StatCard label="Total Expenses" value={summary.totalExpenses} icon={ArrowDownRight} tone="text-rose-400" />
      <StatCard label="Current Balance" value={summary.currentBalance} icon={Wallet} tone="text-indigo-400" />
      <StatCard label="Total Savings" value={summary.totalSavings} icon={PiggyBank} tone="text-amber-400" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="glass-panel rounded-2xl border border-slate-800 p-5"><h2 className="font-semibold text-white">Recent transactions</h2><div className="mt-4 space-y-3">{recentTransactions.length ? recentTransactions.map((item) => <div key={item._id} className="flex justify-between border-b border-slate-800 pb-3 text-sm"><span><span className="font-medium text-white">{item.description}</span><span className="ml-2 text-slate-500">{item.categoryId?.name}</span></span><span className={item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>{item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString()}</span></div>) : <p className="text-sm text-slate-500">No transactions yet.</p>}</div></section>
      <section className="glass-panel rounded-2xl border border-slate-800 p-5"><h2 className="font-semibold text-white">Top spending categories</h2><div className="mt-4 space-y-4">{topCategoryExpenses.length ? topCategoryExpenses.map((item) => <div key={item.categoryId} className="flex items-center justify-between"><span className="text-sm text-slate-300">{item.name}</span><span className="text-sm font-semibold text-white">₹{item.totalSpent.toLocaleString()}</span></div>) : <p className="text-sm text-slate-500">No expense data this month.</p>}</div><Landmark className="mt-6 text-indigo-400" /></section>
    </div>
  </div>;
}
