import { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import API from '../services/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { API.get('/analytics/dashboard').then((res) => setData(res.data.data)).catch(() => setError('Unable to load analytics.')); }, []);
  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <div className="p-12 text-center text-slate-400">Loading analytics…</div>;
  const categoryData = data.categoryExpenses.map((item) => ({ name: item.name, value: item.totalSpent, color: item.color }));
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-white">Analytics & Trends</h1><p className="text-sm text-slate-400">Charts are generated from your transaction history.</p></div><div className="grid gap-6 lg:grid-cols-2"><section className="glass-panel h-80 rounded-2xl border border-slate-800 p-5"><h2 className="mb-4 font-semibold text-white">Income vs expenses</h2><ResponsiveContainer width="100%" height="90%"><BarChart data={data.monthlyTrends}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="month" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Legend /><Bar dataKey="income" fill="#34d399" /><Bar dataKey="expense" fill="#fb7185" /></BarChart></ResponsiveContainer></section><section className="glass-panel h-80 rounded-2xl border border-slate-800 p-5"><h2 className="mb-4 font-semibold text-white">Monthly savings trend</h2><ResponsiveContainer width="100%" height="90%"><LineChart data={data.monthlyTrends}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="month" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Line type="monotone" dataKey="savings" stroke="#818cf8" strokeWidth={3} /></LineChart></ResponsiveContainer></section><section className="glass-panel h-80 rounded-2xl border border-slate-800 p-5 lg:col-span-2"><h2 className="mb-4 font-semibold text-white">This month’s category spending</h2>{categoryData.length ? <ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={105} label>{categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <p className="text-slate-500">No expense data available.</p>}</section></div></div>;
}
