import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Trash2,
    Edit,
    X,
    Calendar,
    CreditCard,
    Tag,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    FileText,
    RotateCcw,
} from 'lucide-react';

export default function Transactions() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Transactions State
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    // Filters State
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Delete Dialog State
    const [deletingId, setDeletingId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form Fields State
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        categoryId: '',
        description: '',
        paymentMethod: 'upi',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Fetch Categories
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

    // Fetch Transactions
    const fetchTransactions = useCallback(
        async (pageNum = 1) => {
            setLoading(true);
            try {
                const params = {
                    page: pageNum,
                    limit: meta.limit,
                };
                if (search) params.search = search;
                if (typeFilter) params.type = typeFilter;
                if (categoryFilter) params.categoryId = categoryFilter;
                if (startDate) params.startDate = startDate;
                if (endDate) params.endDate = endDate;

                const res = await API.get('/transactions', { params });
                if (res.data.success) {
                    setTransactions(res.data.data);
                    setMeta(res.data.meta || { page: pageNum, limit: 10, total: res.data.data.length, totalPages: 1 });
                }
            } catch (err) {
                console.error('Failed to fetch transactions:', err);
            } finally {
                setLoading(false);
            }
        },
        [search, typeFilter, categoryFilter, startDate, endDate, meta.limit]
    );

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchTransactions(1);
    }, [fetchTransactions]);

    // Open modal automatically if ?add=true param is present
    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            openAddModal();
            searchParams.delete('add');
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);

    const handleClearFilters = () => {
        setSearch('');
        setTypeFilter('');
        setCategoryFilter('');
        setStartDate('');
        setEndDate('');
    };

    const openAddModal = () => {
        setEditingTransaction(null);
        setFormData({
            type: 'expense',
            amount: '',
            categoryId: categories.length > 0 ? categories[0]._id : '',
            description: '',
            paymentMethod: 'upi',
            date: new Date().toISOString().split('T')[0],
            notes: '',
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (t) => {
        setEditingTransaction(t);
        setFormData({
            type: t.type,
            amount: t.amount,
            categoryId: t.categoryId?._id || t.categoryId,
            description: t.description,
            paymentMethod: t.paymentMethod || 'upi',
            date: new Date(t.date).toISOString().split('T')[0],
            notes: t.notes || '',
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || Number(formData.amount) <= 0) {
            setFormError('Please enter a valid amount greater than 0');
            return;
        }
        if (!formData.categoryId) {
            setFormError('Please select a category');
            return;
        }
        if (!formData.description.trim()) {
            setFormError('Please enter a description');
            return;
        }

        setIsSubmitting(true);
        setFormError('');

        try {
            const payload = {
                ...formData,
                amount: Number(formData.amount),
            };

            if (editingTransaction) {
                await API.put(`/transactions/${editingTransaction._id}`, payload);
            } else {
                await API.post('/transactions', payload);
            }

            setIsModalOpen(false);
            fetchTransactions(meta.page);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        try {
            await API.delete(`/transactions/${deletingId}`);
            setDeletingId(null);
            fetchTransactions(meta.page);
        } catch (err) {
            console.error('Failed to delete transaction:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Summary Metrics calculation for displayed batch
    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Transactions Management</h1>
                    <p className="text-slate-400 text-sm">
                        Track, filter, and control your incomes & daily expenses
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Transaction</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Filtered Income</p>
                        <p className="text-xl font-extrabold text-emerald-400 mt-1">
                            {currencySymbol} {totalIncome.toLocaleString()}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ArrowUpRight className="w-6 h-6" />
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Filtered Expenses</p>
                        <p className="text-xl font-extrabold text-rose-400 mt-1">
                            {currencySymbol} {totalExpense.toLocaleString()}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <ArrowDownRight className="w-6 h-6" />
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Filtered Net Flow</p>
                        <p className={`text-xl font-extrabold mt-1 ${netBalance >= 0 ? 'text-indigo-400' : 'text-amber-400'}`}>
                            {currencySymbol} {netBalance.toLocaleString()}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Box */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                    >
                        <option value="">All Types</option>
                        <option value="income">Income Only</option>
                        <option value="expense">Expense Only</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    {/* Date Range Inputs */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-slate-500 text-xs">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Reset Filters */}
                    <button
                        onClick={handleClearFilters}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 text-xs transition-colors flex items-center space-x-1"
                        title="Reset Filters"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                </div>
            </div>

            {/* Transactions Data Table */}
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 space-y-3">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-medium">Fetching transaction records...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="inline-flex p-3 rounded-full bg-slate-900 text-slate-500 border border-slate-800">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-300">No Transactions Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            There are no records matching your current filter criteria. Try clearing search filters or add a new transaction.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Transaction</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Payment Method</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-900/40 transition-colors">
                                        {/* Description & Type Icon */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`p-2 rounded-xl border ${t.type === 'income'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                        }`}
                                                >
                                                    {t.type === 'income' ? (
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    ) : (
                                                        <ArrowDownRight className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white text-sm">{t.description}</p>
                                                    {t.notes && <p className="text-xs text-slate-500 truncate max-w-xs">{t.notes}</p>}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td className="px-6 py-4">
                                            <span
                                                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                                                style={{
                                                    backgroundColor: `${t.categoryId?.color || '#6366f1'}15`,
                                                    borderColor: `${t.categoryId?.color || '#6366f1'}35`,
                                                    color: t.categoryId?.color || '#a5b4fc',
                                                }}
                                            >
                                                <Tag className="w-3 h-3" />
                                                <span>{t.categoryId?.name || 'Uncategorized'}</span>
                                            </span>
                                        </td>

                                        {/* Payment Method */}
                                        <td className="px-6 py-4">
                                            <span className="uppercase text-[10px] font-bold px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 tracking-wider">
                                                {t.paymentMethod || 'upi'}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4 text-xs text-slate-400">
                                            {new Date(t.date).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>

                                        {/* Amount */}
                                        <td className={`px-6 py-4 text-right font-bold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {t.type === 'income' ? '+' : '-'} {currencySymbol} {t.amount.toLocaleString()}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => openEditModal(t)}
                                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 border border-slate-800 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingId(t._id)}
                                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                {meta.totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            Showing Page <span className="font-semibold text-white">{meta.page}</span> of{' '}
                            <span className="font-semibold text-white">{meta.totalPages}</span> ({meta.total} records total)
                        </span>
                        <div className="flex items-center space-x-2">
                            <button
                                disabled={meta.page <= 1}
                                onClick={() => fetchTransactions(meta.page - 1)}
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                disabled={meta.page >= meta.totalPages}
                                onClick={() => fetchTransactions(meta.page + 1)}
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5 relative">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h2 className="text-lg font-bold text-white">
                                {editingTransaction ? 'Edit Transaction' : 'Create New Transaction'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Type Toggle */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${formData.type === 'expense'
                                            ? 'bg-rose-600 text-white shadow-md'
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'income' })}
                                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${formData.type === 'income'
                                            ? 'bg-emerald-600 text-white shadow-md'
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    Income
                                </button>
                            </div>

                            {/* Amount & Currency */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">
                                    Amount ({currencySymbol})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">Category</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                                >
                                    <option value="">Select Category</option>
                                    {categories
                                        .filter((c) => c.type === 'both' || c.type === formData.type)
                                        .map((c) => (
                                            <option key={c._id} value={c._id}>
                                                {c.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">Description</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Grocery Shopping / Salary Credited"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>

                            {/* Payment Method & Date Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase">Payment Method</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs uppercase font-medium"
                                    >
                                        <option value="upi">UPI</option>
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase">Notes (Optional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Additional context or remarks..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="pt-3 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span>{editingTransaction ? 'Update Transaction' : 'Save Transaction'}</span>
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
                        <h3 className="text-base font-bold text-white">Delete Transaction?</h3>
                        <p className="text-xs text-slate-400">
                            Are you sure you want to permanently remove this transaction record? This action cannot be undone.
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
