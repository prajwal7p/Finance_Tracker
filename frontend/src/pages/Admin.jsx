import { useEffect, useState } from 'react';
import { ShieldCheck, Users, ReceiptText } from 'lucide-react';
import API from '../services/api';

export default function Admin() {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  const load = () => API.get('/admin/overview').then((res) => setData(res.data.data)).catch((err) => setError(err.response?.data?.message || 'Unable to load admin data.'));
  useEffect(() => { load(); }, []);
  const toggle = async (id) => { try { await API.patch(`/admin/users/${id}/toggle-status`); load(); } catch (err) { setError(err.response?.data?.message || 'Unable to update user.'); } };
  if (error && !data) return <p className="text-red-400">{error}</p>;
  if (!data) return <div className="p-12 text-center text-slate-400">Loading admin dashboard…</div>;
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-white">System Administration</h1><p className="text-sm text-slate-400">Application-level statistics and user account controls.</p></div>{error && <p className="text-red-400">{error}</p>}<div className="grid gap-4 md:grid-cols-3">{[["Users", data.totalUsers, Users], ["Active users", data.activeUsers, ShieldCheck], ["Transactions", data.totalTransactions, ReceiptText]].map(([label, value, Icon]) => <div key={label} className="glass-panel rounded-2xl border border-slate-800 p-5"><Icon className="text-indigo-400" /><p className="mt-3 text-2xl font-bold text-white">{value}</p><p className="text-sm text-slate-400">{label}</p></div>)}</div><section className="glass-panel rounded-2xl border border-slate-800 p-5"><h2 className="font-semibold text-white">Recent users</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="pb-3">User</th><th className="pb-3">Role</th><th className="pb-3">Status</th><th className="pb-3"></th></tr></thead><tbody>{data.recentUsers.map((item) => <tr key={item._id} className="border-t border-slate-800"><td className="py-3 text-white"><div>{item.name}</div><div className="text-xs text-slate-500">{item.email}</div></td><td className="capitalize text-slate-300">{item.role}</td><td className={item.isActive ? 'text-emerald-400' : 'text-rose-400'}>{item.isActive ? 'Active' : 'Disabled'}</td><td><button onClick={() => toggle(item._id)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200">{item.isActive ? 'Disable' : 'Enable'}</button></td></tr>)}</tbody></table></div></section></div>;
}
