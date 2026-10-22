import React, { useState, useEffect, useCallback } from 'react';
import { dashboardApi, expensesApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import CategoryIcon from '../components/common/CategoryIcon';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ExpenseModal from '../components/expenses/ExpenseModal';
import BudgetModal from '../components/budgets/BudgetModal';
import {
  IndianRupee,
  Wallet,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Receipt,
  ArrowRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DashboardPage() {
  const { success, error: toastError } = useToast();
  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await dashboardApi.getSummary(selectedMonth, selectedYear);
      setSummary(data);
    } catch (err) {
      const msg = err.message || 'Failed to load dashboard data';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, toastError]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    setIsDeleting(true);
    try {
      await expensesApi.delete(deleteExpenseId);
      success('Expense deleted successfully');
      setDeleteExpenseId(null);
      fetchSummary();
    } catch (err) {
      toastError(err.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Safe checks for nullable budget fields
  const hasBudget = summary?.monthly_budget !== null && summary?.monthly_budget !== undefined;
  const hasRemaining = summary?.remaining_budget !== null && summary?.remaining_budget !== undefined;
  const isBudgetDanger = summary?.budget_status === 'danger';
  const isBudgetWarning = summary?.budget_status === 'warning';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter']">
      <Navbar onOpenAddExpense={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Top Control Bar: Date Selector & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
              Dashboard Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Track your financial health and monthly expenditure
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month & Year Navigator */}
            <div className="flex items-center bg-slate-100/80 rounded-2xl p-1 border border-slate-200/60">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 px-3 min-w-[130px] text-center">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Add Expense Button */}
            <Button
              onClick={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
              icon={Plus}
              className="shadow-sm"
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Error Banner with Retry */}
        {errorMsg && !summary && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center animate-fade-in shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-950 font-['Outfit'] mb-1">
              Could not load dashboard data
            </h3>
            <p className="text-xs text-rose-800 mb-4 max-w-sm mx-auto">
              {errorMsg}
            </p>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchSummary}>
              Retry Loading
            </Button>
          </div>
        )}

        {/* Loading Skeleton if no summary loaded yet */}
        {loading && !summary && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 h-32 flex flex-col justify-between">
                  <div className="w-24 h-4 bg-slate-100 rounded-md" />
                  <div className="w-36 h-8 bg-slate-200 rounded-lg" />
                  <div className="w-20 h-3 bg-slate-100 rounded-md" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 h-80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#2F8F24] animate-spin" />
              </div>
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 h-80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            </div>
          </div>
        )}

        {/* Budget Warning Banner if applicable */}
        {isBudgetDanger && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 animate-fade-in shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-950 font-['Outfit']">
                Budget Exceeded!
              </h4>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                You have spent {formatCurrency(summary?.total_expenses_month)} which exceeds your monthly limit of {formatCurrency(summary?.monthly_budget)} by {formatCurrency(Math.abs(summary?.remaining_budget ?? 0))}. Consider reviewing your non-essential expenses.
              </p>
            </div>
          </div>
        )}

        {isBudgetWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 animate-fade-in shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-950 font-['Outfit']">
                Approaching Budget Limit ({summary?.budget_used_percentage ?? 0}%)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                You have used {summary?.budget_used_percentage ?? 0}% of your monthly budget. Only {formatCurrency(summary?.remaining_budget)} remains for {MONTH_NAMES[selectedMonth - 1]}.
              </p>
            </div>
          </div>
        )}

        {/* 4 Primary Summary Cards */}
        {summary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Spent This Month */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Expenses
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2F8F24] flex items-center justify-center">
                    <Receipt className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] mb-1">
                  {formatCurrency(summary?.total_expenses_month ?? 0)}
                </div>
                <span className="text-xs text-slate-500">
                  For {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
              </div>

              {/* Card 2: Monthly Budget */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Monthly Budget
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Wallet className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] mb-1">
                  {hasBudget ? formatCurrency(summary.monthly_budget) : 'Not Set'}
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="text-xs font-semibold text-[#2F8F24] hover:text-[#25751d] hover:underline cursor-pointer"
                >
                  {hasBudget ? 'Modify Budget' : '+ Set Budget Limit'}
                </button>
              </div>

              {/* Card 3: Remaining Budget */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Remaining
                  </span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    (summary?.remaining_budget ?? 0) < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-[#2F8F24]'
                  }`}>
                    <PiggyBank className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className={`text-2xl sm:text-3xl font-extrabold font-['Outfit'] mb-1 ${
                  (summary?.remaining_budget ?? 0) < 0 ? 'text-rose-600' : 'text-slate-900'
                }`}>
                  {hasRemaining ? formatCurrency(summary.remaining_budget) : '—'}
                </div>
                <span className="text-xs text-slate-500">
                  {hasRemaining
                    ? (summary.remaining_budget < 0 ? 'Over budget limit' : 'Available to spend')
                    : 'Set budget to track'}
                </span>
              </div>

              {/* Card 4: Budget Used % */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Budget Used
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] mb-2">
                  {summary?.budget_used_percentage ?? 0}%
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isBudgetDanger
                        ? 'bg-rose-500'
                        : isBudgetWarning
                        ? 'bg-amber-500'
                        : 'bg-[#2F8F24]'
                    }`}
                    style={{ width: `${Math.min(summary?.budget_used_percentage ?? 0, 100)}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Recent Transactions & Category Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Transactions Table (2 Columns on large screens) */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                      Recent Transactions
                    </h3>
                    <p className="text-xs text-slate-500">Latest expense entries recorded</p>
                  </div>
                  <Link
                    to="/expenses"
                    className="text-xs font-semibold text-[#2F8F24] hover:text-[#25751d] hover:underline flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {!summary?.recent_expenses?.length ? (
                  <EmptyState
                    title="No recent expenses"
                    description="You haven't recorded any expenses yet. Start tracking your spending now!"
                    actionText="Add First Expense"
                    onAction={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                          <th className="pb-3 pl-1">Category & Title</th>
                          <th className="pb-3 text-center">Date</th>
                          <th className="pb-3 text-right">Amount</th>
                          <th className="pb-3 text-right pr-1">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {summary.recent_expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/80 transition group">
                            <td className="py-3.5 pl-1">
                              <div className="flex items-center gap-3">
                                <CategoryIcon category={exp.category} size="md" />
                                <div>
                                  <div className="font-semibold text-slate-900 line-clamp-1">{exp.title}</div>
                                  <div className="text-xs text-slate-400">{exp.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 text-center text-xs text-slate-500">
                              {exp.expense_date}
                            </td>
                            <td className="py-3.5 text-right font-bold text-slate-900">
                              {formatCurrency(exp.amount)}
                            </td>
                            <td className="py-3.5 text-right pr-1">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => { setExpenseToEdit(exp); setIsExpenseModalOpen(true); }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteExpenseId(exp.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
              </div>

              {/* Monthly Category Breakdown Widget */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                        Top Categories
                      </h3>
                      <p className="text-xs text-slate-500">Spending by category this month</p>
                    </div>
                    <Link
                      to="/analytics"
                      className="text-xs font-semibold text-[#2F8F24] hover:underline"
                    >
                      Full Charts
                    </Link>
                  </div>

                  {!summary?.category_summary?.length ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No categorical data for {MONTH_NAMES[selectedMonth - 1]}.
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-2">
                      {summary.category_summary.map((cat) => (
                        <div key={cat.category} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-medium text-slate-800">
                              <CategoryIcon category={cat.category} size="sm" />
                              <span>{cat.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{formatCurrency(cat.total)}</span>
                              <span className="text-[11px] text-slate-400">({cat.percentage}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#2F8F24] h-full rounded-full"
                              style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 text-center">
                  <Link to="/budgets">
                    <Button variant="outline" size="sm" fullWidth>
                      Manage Monthly Budgets
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          </>
        )}

      </main>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenseToEdit={expenseToEdit}
        onSuccess={fetchSummary}
      />

      {/* Set / Edit Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
        onSuccess={fetchSummary}
      />

      {/* Delete Expense Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        loading={isDeleting}
      />
    </div>
  );
}
