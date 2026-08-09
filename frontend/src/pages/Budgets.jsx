import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    PieChart,
    Plus,
    AlertTriangle,
    CheckCircle2,
    Trash2,
    Edit,
    X,
    Calendar,
    Tag,
    TrendingUp,
    AlertCircle,
    FolderPlus,
} from 'lucide-react';

export default function Budgets() {
    const { user } = useAuth();

    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Budget Modal State
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [budgetAmount, setBudgetAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [modalMonth, setModalMonth] = useState(selectedMonth);
    const [modalYear, setModalYear] = useState(selectedYear);
    const [budgetError, setBudgetError] = useState('');
    const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [categoryType, setCategoryType] = useState('expense');
    const [categoryColor, setCategoryColor] = useState('#6366f1');
    const [categoryError, setCategoryError] = useState('');
    const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

    // Delete State
    const [deletingId, setDeletingId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const monthsList = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    const yearsList = [2024, 2025, 2026, 2027, 2028];

    const fetchCategories = useCallback(async () => {
        try {
            const res = await API.get('/categories');
            if (res.data.success) {
                setCategories(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    }, []);

    const fetchBudgets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('/budgets', {
                params: { month: selectedMonth, year: selectedYear },
            });
            if (res.data.success) {
                setBudgets(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch budgets:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    const openAddBudgetModal = () => {
        setEditingBudget(null);
        setBudgetAmount('');
        const firstCat = categories.find((c) => c.type === 'expense' || c.type === 'both');
        setSelectedCategory(firstCat ? firstCat._id : '');
        setModalMonth(selectedMonth);
        setModalYear(selectedYear);
        setBudgetError('');
        setIsBudgetModalOpen(true);
    };

    const openEditBudgetModal = (b) => {
        setEditingBudget(b);
        setBudgetAmount(b.amount);
        setSelectedCategory(b.category?._id || b.category);
        setModalMonth(b.month);
        setModalYear(b.year);
        setBudgetError('');
        setIsBudgetModalOpen(true);
    };

    const handleBudgetSubmit = async (e) => {
        e.preventDefault();
        if (!budgetAmount || Number(budgetAmount) <= 0) {
            setBudgetError('Target amount must be greater than 0');
            return;
        }
        if (!editingBudget && !selectedCategory) {
            setBudgetError('Please select a category');
            return;
        }

        setIsSubmittingBudget(true);
        setBudgetError('');

        try {
            if (editingBudget) {
                await API.put(`/budgets/${editingBudget._id}`, { amount: Number(budgetAmount) });
            } else {
                await API.post('/budgets', {
                    categoryId: selectedCategory,
                    amount: Number(budgetAmount),
                    month: Number(modalMonth),
                    year: Number(modalYear),
                });
            }
            setIsBudgetModalOpen(false);
            fetchBudgets();
        } catch (err) {
            setBudgetError(err.response?.data?.message || 'Failed to save budget');
        } finally {
            setIsSubmittingBudget(false);
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            setCategoryError('Category name is required');
            return;
        }

        setIsSubmittingCategory(true);
        setCategoryError('');

        try {
            const res = await API.post('/categories', {
                name: categoryName.trim(),
                type: categoryType,
                color: categoryColor,
                icon: 'Tag',
            });

            if (res.data.success) {
                setIsCategoryModalOpen(false);
                setCategoryName('');
                fetchCategories();
            }
        } catch (err) {
            setCategoryError(err.response?.data?.message || 'Failed to create category');
        } finally {
            setIsSubmittingCategory(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        try {
            await API.delete(`/budgets/${deletingId}`);
            setDeletingId(null);
            fetchBudgets();
        } catch (err) {
            console.error('Failed to delete budget:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Metrics
    const totalBudgeted = budgets.reduce((acc, b) => acc + b.amount, 0);
    const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
    const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
    const exceededCount = budgets.filter((b) => b.isExceeded).length;

    const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Category Budgets</h1>
                    <p className="text-slate-400 text-sm">
                        Set monthly category spending caps & receive smart over-budget alerts
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-sm transition-all"
                    >
                        <FolderPlus className="w-4 h-4 text-indigo-400" />
                        <span>Add Category</span>
                    </button>

                    <button
                        onClick={openAddBudgetModal}
                        className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Budget</span>
                    </button>
                </div>
            </div>

            {/* Month / Year Selector Bar */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-300">Target Month:</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 flex-1 sm:flex-initial"
                    >
                        {monthsList.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    >
                        {yearsList.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Allocated</p>
                    <p className="text-2xl font-extrabold text-white mt-1">
                        {currencySymbol} {totalBudgeted.toLocaleString()}
                    </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Spent</p>
                    <p className="text-2xl font-extrabold text-indigo-400 mt-1">
                        {currencySymbol} {totalSpent.toLocaleString()}
                    </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available Remaining</p>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                        {currencySymbol} {totalRemaining.toLocaleString()}
                    </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Over-Budget Alerts</p>
                        <p className={`text-2xl font-extrabold mt-1 ${exceededCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {exceededCount} {exceededCount === 1 ? 'Category' : 'Categories'}
                        </p>
                    </div>
                    {exceededCount > 0 && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </div>

            {/* Budget Cards Grid */}
            {loading ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-medium">Calculating budget spending progress...</p>
                </div>
            ) : budgets.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
                    <div className="inline-flex p-3 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <PieChart className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-200">No Budgets Defined for Selected Month</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Stay in control of your expenses by creating category budgets for {monthsList.find((m) => m.value === selectedMonth)?.label} {selectedYear}.
                    </p>
                    <button
                        onClick={openAddBudgetModal}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                    >
                        Setup First Category Budget
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {budgets.map((b) => {
                        const catName = b.category?.name || 'Category';
                        const catColor = b.category?.color || '#6366f1';
                        const isWarning = b.percentageUsed >= 80 && !b.isExceeded;
                        const isDanger = b.isExceeded;

                        return (
                            <div
                                key={b._id}
                                className={`glass-panel p-6 rounded-2xl border transition-all space-y-4 ${isDanger
                                        ? 'border-rose-500/40 bg-rose-950/10'
                                        : isWarning
                                            ? 'border-amber-500/40 bg-amber-950/10'
                                            : 'border-slate-800'
                                    }`}
                            >
                                {/* Card Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="p-2.5 rounded-xl border flex items-center justify-center"
                                            style={{
                                                backgroundColor: `${catColor}15`,
                                                borderColor: `${catColor}35`,
                                                color: catColor,
                                            }}
                                        >
                                            <Tag className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-base">{catName}</h3>
                                            <p className="text-xs text-slate-400">
                                                {monthsList.find((m) => m.value === b.month)?.label} {b.year} Budget
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => openEditBudgetModal(b)}
                                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 border border-slate-800"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(b._id)}
                                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar & Percentage */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400 font-medium">Spent Utilization</span>
                                        <span
                                            className={`font-bold ${isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-indigo-400'
                                                }`}
                                        >
                                            {b.percentageUsed}%
                                        </span>
                                    </div>

                                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
                                                }`}
                                            style={{ width: `${Math.min(100, b.percentageUsed)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Amount Details Breakdown */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                                    <div>
                                        <span className="text-slate-500">Spent:</span>
                                        <p className="font-bold text-white mt-0.5">
                                            {currencySymbol} {b.spent.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-500">Monthly Limit:</span>
                                        <p className="font-bold text-slate-300 mt-0.5">
                                            {currencySymbol} {b.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Alert Badge Banner */}
                                {isDanger && (
                                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <span>
                                            Exceeded by <strong>{currencySymbol} {b.excessAmount.toLocaleString()}</strong>!
                                        </span>
                                    </div>
                                )}
                                {isWarning && (
                                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center space-x-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>Approaching budget limit (above 80%)</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Budget Modal */}
            {isBudgetModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h2 className="text-lg font-bold text-white">
                                {editingBudget ? 'Edit Category Budget' : 'Set Category Budget'}
                            </h2>
                            <button
                                onClick={() => setIsBudgetModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {budgetError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{budgetError}</span>
                            </div>
                        )}

                        <form onSubmit={handleBudgetSubmit} className="space-y-4">
                            {!editingBudget && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase">Category</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                                    >
                                        <option value="">Select Expense Category</option>
                                        {categories.map((c) => (
                                            <option key={c._id} value={c._id}>
                                                {c.name} ({c.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">
                                    Monthly Budget Cap ({currencySymbol})
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="e.g. 15000"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>

                            {!editingBudget && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-400 uppercase">Month</label>
                                        <select
                                            value={modalMonth}
                                            onChange={(e) => setModalMonth(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                                        >
                                            {monthsList.map((m) => (
                                                <option key={m.value} value={m.value}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-400 uppercase">Year</label>
                                        <select
                                            value={modalYear}
                                            onChange={(e) => setModalYear(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                                        >
                                            {yearsList.map((y) => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsBudgetModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingBudget}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
                                >
                                    {isSubmittingBudget ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span>Save Budget</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Custom Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h2 className="text-lg font-bold text-white">Create Custom Category</h2>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {categoryError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{categoryError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCategorySubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Subscriptions / Investments / Pet Care"
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase">Type</label>
                                    <select
                                        value={categoryType}
                                        onChange={(e) => setCategoryType(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase">Badge Color</label>
                                    <input
                                        type="color"
                                        value={categoryColor}
                                        onChange={(e) => setCategoryColor(e.target.value)}
                                        className="w-full h-9 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer p-1"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCategory}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
                                >
                                    {isSubmittingCategory ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span>Create Category</span>
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
                        <h3 className="text-base font-bold text-white">Delete Budget Cap?</h3>
                        <p className="text-xs text-slate-400">
                            Are you sure you want to remove this budget ceiling? Existing transactions in this category will remain untouched.
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
