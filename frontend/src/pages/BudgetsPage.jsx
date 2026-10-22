import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import BudgetModal from '../components/budgets/BudgetModal';
import ExpenseModal from '../components/expenses/ExpenseModal';
import { budgetsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

import {
  Wallet,
  Plus,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  PieChart,
  Edit2
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BudgetsPage() {
  const { error: toastError } = useToast();
  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [currentBudget, setCurrentBudget] = useState(null);
  const [allBudgets, setAllBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const fetchBudgetData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch budget for selected month
      const currentRes = await budgetsApi.list({ month: selectedMonth, year: selectedYear });
      setCurrentBudget(currentRes.budget || null);

      // Fetch all historical budgets
      const allRes = await budgetsApi.list();
      setAllBudgets(allRes.budgets || []);
    } catch (err) {
      toastError(err.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, toastError]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

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

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter']">
      <Navbar onOpenAddExpense={() => setIsExpenseModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Header Bar */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
              Budget Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Set spending thresholds, monitor limits, and prevent overspending
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

            <Button
              onClick={() => {
                setBudgetToEdit(currentBudget);
                setIsBudgetModalOpen(true);
              }}
              icon={Plus}
            >
              {currentBudget ? 'Edit Budget' : 'Set Budget'}
            </Button>
          </div>
        </div>

        {/* Selected Month Budget Card */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-slate-400 text-xs">
            Loading budget analysis...
          </div>
        ) : !currentBudget ? (
          <EmptyState
            icon={Wallet}
            title={`No budget set for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            description="Setting a monthly spending target helps you save consistently and triggers real-time alerts before you overspend."
            actionText="Set Monthly Budget"
            onAction={() => {
              setBudgetToEdit(null);
              setIsBudgetModalOpen(true);
            }}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
            
            {/* Budget Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Budget for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
                    {formatCurrency(currentBudget.limit_amount)}
                  </h2>
                  <button
                    onClick={() => { setBudgetToEdit(currentBudget); setIsBudgetModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-[#2F8F24] hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                    title="Edit Budget Limit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {currentBudget.status === 'danger' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>Budget Exceeded</span>
                  </div>
                )}
                {currentBudget.status === 'warning' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Approaching Limit</span>
                  </div>
                )}
                {currentBudget.status === 'normal' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#2F8F24] border border-emerald-200 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8F24]" />
                    <span>On Track</span>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">
                  Spent: <strong className="text-slate-900">{formatCurrency(currentBudget.total_spent)}</strong>
                </span>
                <span className={`text-sm font-bold ${
                  currentBudget.status === 'danger' ? 'text-rose-600' : currentBudget.status === 'warning' ? 'text-amber-600' : 'text-[#2F8F24]'
                }`}>
                  {currentBudget.percentage_used}% used
                </span>
              </div>

              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    currentBudget.status === 'danger'
                      ? 'bg-rose-500'
                      : currentBudget.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-[#2F8F24]'
                  }`}
                  style={{ width: `${Math.min(currentBudget.percentage_used, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>₹0.00</span>
                <span>Warning at 75% ({formatCurrency(currentBudget.limit_amount * 0.75)})</span>
                <span>Limit: {formatCurrency(currentBudget.limit_amount)}</span>
              </div>
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <span className="text-xs text-slate-500 block mb-1">Total Spent</span>
                <span className="text-xl font-bold text-slate-900 font-['Outfit']">
                  {formatCurrency(currentBudget.total_spent)}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <span className="text-xs text-slate-500 block mb-1">Remaining Balance</span>
                <span className={`text-xl font-bold font-['Outfit'] ${
                  currentBudget.remaining_amount < 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {formatCurrency(currentBudget.remaining_amount)}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <span className="text-xs text-slate-500 block mb-1">Budget Threshold</span>
                <span className="text-xs font-semibold text-slate-700 leading-snug block mt-1">
                  {currentBudget.alert_message}
                </span>
              </div>
            </div>

          </div>
        )}

        {/* All Budgets History List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Budget History
            </h3>
            <p className="text-xs text-slate-500">Overview of all your monthly budget targets</p>
          </div>

          {allBudgets.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No historical budgets saved.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBudgets.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedMonth(b.month);
                    setSelectedYear(b.year);
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md ${
                    b.month === selectedMonth && b.year === selectedYear
                      ? 'border-[#2F8F24] bg-emerald-50/40 ring-1 ring-[#2F8F24]'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900 font-['Outfit']">
                      {MONTH_NAMES[b.month - 1]} {b.year}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'danger'
                        ? 'bg-rose-100 text-rose-700'
                        : b.status === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {b.percentage_used}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span>Limit:</span>
                      <strong className="text-slate-900">{formatCurrency(b.limit_amount)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent:</span>
                      <strong className="text-slate-900">{formatCurrency(b.total_spent)}</strong>
                    </div>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        b.status === 'danger' ? 'bg-rose-500' : b.status === 'warning' ? 'bg-amber-500' : 'bg-[#2F8F24]'
                      }`}
                      style={{ width: `${Math.min(b.percentage_used, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Set/Edit Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgetToEdit={budgetToEdit}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
        onSuccess={fetchBudgetData}
      />

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={fetchBudgetData}
      />
    </div>
  );
}
