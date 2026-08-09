import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Target,
    Plus,
    TrendingUp,
    CheckCircle2,
    Calendar,
    DollarSign,
    AlertTriangle,
    Trash2,
    Edit,
    X,
    PiggyBank,
    Clock,
    Sparkles,
    ArrowUpRight,
} from 'lucide-react';

export default function Savings() {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    // Goal Modal State
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [description, setDescription] = useState('');
    const [goalError, setGoalError] = useState('');
    const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

    // Deposit Modal State
    const [depositingGoal, setDepositingGoal] = useState(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositError, setDepositError] = useState('');
    const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

    // Delete State
    const [deletingId, setDeletingId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchGoals = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            const res = await API.get('/savings-goals', { params });
            if (res.data.success) {
                setGoals(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch savings goals:', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const openAddGoalModal = () => {
        setEditingGoal(null);
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        // Default deadline to 3 months from now
        const d = new Date();
        d.setMonth(d.getMonth() + 3);
        setDeadline(d.toISOString().split('T')[0]);
        setDescription('');
        setGoalError('');
        setIsGoalModalOpen(true);
    };

    const openEditGoalModal = (g) => {
        setEditingGoal(g);
        setName(g.name);
        setTargetAmount(g.targetAmount);
        setCurrentAmount(g.currentAmount);
        setDeadline(new Date(g.deadline).toISOString().split('T')[0]);
        setDescription(g.description || '');
        setGoalError('');
        setIsGoalModalOpen(true);
    };

    const openDepositModal = (g) => {
        setDepositingGoal(g);
        setDepositAmount('');
        setDepositError('');
    };

    const handleGoalSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setGoalError('Goal name is required');
            return;
        }
        if (!targetAmount || Number(targetAmount) <= 0) {
            setGoalError('Target amount must be greater than 0');
            return;
        }
        if (!deadline) {
            setGoalError('Deadline date is required');
            return;
        }

        setIsSubmittingGoal(true);
        setGoalError('');

        try {
            const payload = {
                name: name.trim(),
                targetAmount: Number(targetAmount),
                currentAmount: Number(currentAmount) || 0,
                deadline,
                description: description.trim(),
            };

            if (editingGoal) {
                await API.put(`/savings-goals/${editingGoal._id}`, payload);
            } else {
                await API.post('/savings-goals', payload);
            }

            setIsGoalModalOpen(false);
            fetchGoals();
        } catch (err) {
            setGoalError(err.response?.data?.message || 'Failed to save savings goal');
        } finally {
            setIsSubmittingGoal(false);
        }
    };

    const handleDepositSubmit = async (e) => {
        e.preventDefault();
        const dep = Number(depositAmount);
        if (isNaN(dep) || dep <= 0) {
            setDepositError('Enter a valid deposit amount greater than 0');
            return;
        }

        setIsSubmittingDeposit(true);
        setDepositError('');

        try {
            await API.patch(`/savings-goals/${depositingGoal._id}/add-funds`, { amount: dep });
            setDepositingGoal(null);
            fetchGoals();
        } catch (err) {
            setDepositError(err.response?.data?.message || 'Failed to deposit funds');
        } finally {
            setIsSubmittingDeposit(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        try {
            await API.delete(`/savings-goals/${deletingId}`);
            setDeletingId(null);
            fetchGoals();
        } catch (err) {
            console.error('Failed to delete goal:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Metrics
    const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    const activeCount = goals.filter((g) => g.status === 'active').length;
    const completedCount = goals.filter((g) => g.status === 'completed').length;

    const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Savings Goals</h1>
                    <p className="text-slate-400 text-sm">
                        Plan, fund, and accomplish your short-term & long-term financial milestones
                    </p>
                </div>

                <button
                    onClick={openAddGoalModal}
                    className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create New Goal</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Accumulated</p>
                        <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                            {currencySymbol} {totalSaved.toLocaleString()}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <PiggyBank className="w-6 h-6" />
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Target Value</p>
                        <p className="text-2xl font-extrabold text-white mt-1">
                            {currencySymbol} {totalTarget.toLocaleString()}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Target className="w-6 h-6" />
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Progress</p>
                        <p className="text-2xl font-extrabold text-indigo-400 mt-1">{overallPercentage}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Milestones Met</p>
                        <p className="text-2xl font-extrabold text-white mt-1">
                            {completedCount} <span className="text-xs text-slate-400 font-normal">/ {goals.length}</span>
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                {['all', 'active', 'completed'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${statusFilter === tab
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                    >
                        {tab} Goals ({tab === 'all' ? goals.length : tab === 'active' ? activeCount : completedCount})
                    </button>
                ))}
            </div>

            {/* Goals Grid */}
            {loading ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-medium">Loading savings goals...</p>
                </div>
            ) : goals.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
                    <div className="inline-flex p-3 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Target className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-200">No Savings Goals Found</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Set ambitious financial targets like an emergency fund, home deposit, or holiday trip and start adding funds regularly.
                    </p>
                    <button
                        onClick={openAddGoalModal}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                    >
                        Create Your First Goal
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {goals.map((g) => {
                        const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                        const remaining = Math.max(0, g.targetAmount - g.currentAmount);
                        const isDone = g.status === 'completed' || g.currentAmount >= g.targetAmount;

                        const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24));

                        return (
                            <div
                                key={g._id}
                                className={`glass-panel p-6 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${isDone
                                        ? 'border-emerald-500/30 bg-emerald-950/10'
                                        : 'border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                <div className="space-y-4">
                                    {/* Goal Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className={`p-2.5 rounded-xl border ${isDone
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                    }`}
                                            >
                                                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-base leading-snug">{g.name}</h3>
                                                {g.description && <p className="text-xs text-slate-400 truncate max-w-xs">{g.description}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-1">
                                            <button
                                                onClick={() => openEditGoalModal(g)}
                                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 border border-slate-800"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(g._id)}
                                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar & Percent */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-medium">Funded Progress</span>
                                            <span className={`font-bold ${isDone ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                {pct}%
                                            </span>
                                        </div>

                                        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                                    }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Amount Breakdown */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                                        <div>
                                            <span className="text-slate-500">Saved:</span>
                                            <p className="font-bold text-emerald-400 mt-0.5">
                                                {currencySymbol} {g.currentAmount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-slate-500">Target Goal:</span>
                                            <p className="font-bold text-white mt-0.5">
                                                {currencySymbol} {g.targetAmount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Status & Deposit Action */}
                                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>
                                            {daysLeft > 0 ? (
                                                `${daysLeft} days remaining`
                                            ) : daysLeft === 0 ? (
                                                'Due Today'
                                            ) : (
                                                <span className="text-amber-400 font-medium">Target Past Due</span>
                                            )}
                                        </span>
                                    </div>

                                    {!isDone ? (
                                        <button
                                            onClick={() => openDepositModal(g)}
                                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Deposit</span>
                                        </button>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                                            <Sparkles className="w-3 h-3" />
                                            <span>Completed</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Goal Modal */}
            {isGoalModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h2 className="text-lg font-bold text-white">
                                {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
                            </h2>
                            <button onClick={() => setIsGoalModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {goalError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>{goalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleGoalSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">Goal Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Emergency Fund / Europe Vacation"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                        Target Amount ({currencySymbol})
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        placeholder="e.g. 50000"
                                        value={targetAmount}
                                        onChange={(e) => setTargetAmount(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                                        Saved So Far ({currencySymbol})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">Target Deadline Date</label>
                                <input
                                    type="date"
                                    required
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">Description / Purpose</label>
                                <textarea
                                    rows="2"
                                    placeholder="Optional goal notes or target milestones..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsGoalModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingGoal}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
                                >
                                    {isSubmittingGoal ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span>{editingGoal ? 'Update Goal' : 'Save Goal'}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deposit Funds Modal */}
            {depositingGoal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-sm w-full glass-panel p-6 rounded-2xl border border-indigo-500/30 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white">Deposit Funds</h3>
                                <p className="text-xs text-indigo-400 font-medium">{depositingGoal.name}</p>
                            </div>
                            <button onClick={() => setDepositingGoal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {depositError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                {depositError}
                            </div>
                        )}

                        <form onSubmit={handleDepositSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">
                                    Deposit Amount ({currencySymbol})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    required
                                    placeholder="e.g. 2000"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>

                            {depositAmount && Number(depositAmount) > 0 && (
                                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Current:</span>
                                        <span>{currencySymbol} {depositingGoal.currentAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-400 font-bold">
                                        <span>New Total:</span>
                                        <span>
                                            {currencySymbol} {(depositingGoal.currentAmount + Number(depositAmount)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setDepositingGoal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingDeposit}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-2"
                                >
                                    {isSubmittingDeposit ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span>Add Deposit</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-sm w-full glass-panel p-6 rounded-2xl border border-red-500/20 text-center space-y-4">
                        <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-white">Delete Savings Goal?</h3>
                        <p className="text-xs text-slate-400">
                            Are you sure you want to delete this savings milestone?
                        </p>
                        <div className="flex items-center justify-center space-x-3 pt-2">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="px-4 py-2 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span>Confirm Delete</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
