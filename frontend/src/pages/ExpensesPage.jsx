import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import CategoryIcon, { CATEGORY_CONFIG } from '../components/common/CategoryIcon';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ExpenseModal from '../components/expenses/ExpenseModal';
import { expensesApi } from '../services/api';
import { useToast } from '../context/ToastContext';

import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet,
  IndianRupee,
  X
} from 'lucide-react';

export default function ExpensesPage() {
  const { success, error: toastError } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expensesApi.list({
        page,
        per_page: 15,
        search,
        category,
        start_date: startDate,
        end_date: endDate,
        sort_by: sortBy,
        order: sortOrder,
      });

      if (data && data.success) {
        setExpenses(data.expenses || []);
        setTotalAmount(data.total_amount || 0);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, startDate, endDate, sortBy, sortOrder, toastError]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await expensesApi.delete(deleteId);
      success('Expense deleted successfully');
      setDeleteId(null);
      fetchExpenses();
    } catch (err) {
      toastError(err.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter']">
      <Navbar onOpenAddExpense={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
              Expense History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage, filter, and track all your logged transactions
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Filtered Total Display Badge */}
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-left">
              <span className="text-[11px] font-semibold text-[#2F8F24] block uppercase tracking-wider">
                Total for this view
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-950 font-['Outfit']">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <Button
              onClick={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
              icon={Plus}
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Filter and Search Panel */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title or notes..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#2F8F24] focus:ring-2 focus:ring-[#2F8F24]/20 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#2F8F24] focus:ring-2 focus:ring-[#2F8F24]/20 transition cursor-pointer"
              >
                <option value="">All Categories</option>
                {Object.keys(CATEGORY_CONFIG).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#2F8F24] focus:ring-2 focus:ring-[#2F8F24]/20 transition cursor-pointer"
                title="Filter from date"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#2F8F24] focus:ring-2 focus:ring-[#2F8F24]/20 transition cursor-pointer"
                title="Filter to date"
              />
            </div>

          </div>

          {/* Sorting and Reset Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sort by:</span>
              <button
                onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{sortBy === 'date' ? 'Date' : 'Amount'}</span>
              </button>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
              >
                {sortOrder === 'desc' ? 'Highest / Newest First' : 'Lowest / Oldest First'}
              </button>
            </div>

            {(search || category || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Expenses List Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading your expenses...</div>
          ) : expenses.length === 0 ? (
            <EmptyState
              title="No expenses found"
              description={search || category ? 'No expenses match your filters. Try resetting your search parameters.' : 'Start recording your expenses to see them organized here.'}
              actionText={search || category ? 'Clear Filters' : 'Add First Expense'}
              onAction={search || category ? handleResetFilters : () => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3.5 px-6">Expense Title</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4 text-center">Date</th>
                      <th className="py-3.5 px-4">Notes</th>
                      <th className="py-3.5 px-6 text-right">Amount</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {exp.title}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <CategoryIcon category={exp.category} size="sm" />
                            <span className="font-medium text-slate-700">{exp.category}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-500">
                          {exp.expense_date}
                        </td>
                        <td className="py-4 px-4 text-slate-500 max-w-[200px] truncate">
                          {exp.notes || '—'}
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-slate-900">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setExpenseToEdit(exp); setIsExpenseModalOpen(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                              title="Edit expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(exp.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete expense"
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    Showing page <span className="font-bold text-slate-900">{page}</span> of{' '}
                    <span className="font-bold text-slate-900">{totalPages}</span> ({totalCount} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </main>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenseToEdit={expenseToEdit}
        onSuccess={fetchExpenses}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action will permanently remove it from your records."
        loading={isDeleting}
      />
    </div>
  );
}
