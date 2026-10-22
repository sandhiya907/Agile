import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/common/Navbar';
import EmptyState from '../components/common/EmptyState';
import ExpenseModal from '../components/expenses/ExpenseModal';
import { CATEGORY_CONFIG } from '../components/common/CategoryIcon';
import { analyticsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

import {
  PieChart as PieIcon,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Layers,
  IndianRupee
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const MONTH_NAMES = [
  'All Year',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AnalyticsPage() {
  const { error: toastError } = useToast();
  const currentDate = new Date();

  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 0 = all year, 1-12 = month
  const [categoryData, setCategoryData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const monthParam = selectedMonth === 0 ? null : selectedMonth;
      const [catRes, trendsRes] = await Promise.all([
        analyticsApi.getCategories(monthParam, selectedYear),
        analyticsApi.getMonthlyTrends(selectedYear),
      ]);

      setCategoryData(catRes);
      setTrendsData(trendsRes);
    } catch (err) {
      toastError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const pieColors = {
    Food: '#EA580C',
    Transport: '#0284C7',
    Shopping: '#9333EA',
    Bills: '#D97706',
    Education: '#0D9488',
    Health: '#E11D48',
    Entertainment: '#DB2777',
    Others: '#475569',
  };

  const categories = categoryData?.categories || [];
  const highestCategory = categoryData?.highest_category;
  const comparison = trendsData?.comparison;
  const trends = trendsData?.trends || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter']">
      <Navbar onOpenAddExpense={() => setIsExpenseModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
              Spending Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Interactive visual charts and category breakdown
            </p>
          </div>

          {/* Filters for Analytics */}
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-slate-100/80 border border-slate-200 rounded-2xl px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#2F8F24] focus:ring-2 focus:ring-[#2F8F24]/20 transition cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-slate-100/80 border border-slate-200 rounded-2xl px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#2F8F24] focus:ring-2 focus:ring-[#2F8F24]/20 transition cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Total Spent in Filtered Period */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Spending ({selectedMonth === 0 ? selectedYear : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`})
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] mb-1">
              {formatCurrency(categoryData?.total_amount || 0)}
            </div>
            <span className="text-xs text-slate-500">
              {categories.reduce((acc, c) => acc + c.count, 0)} transactions recorded
            </span>
          </div>

          {/* Card 2: Highest Spending Category */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Highest Spending Category
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] mb-1 flex items-center gap-2">
              <span>{highestCategory ? highestCategory.category : 'None'}</span>
            </div>
            <span className="text-xs text-slate-500">
              {highestCategory
                ? `${formatCurrency(highestCategory.total)} (${highestCategory.percentage}% of total)`
                : 'No expense entries found'}
            </span>
          </div>

          {/* Card 3: Month-over-Month Comparison */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              vs. Previous Month
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] mb-1 flex items-center gap-2">
              {comparison?.difference !== undefined ? (
                <>
                  <span className={comparison.increased ? 'text-rose-600' : 'text-emerald-600'}>
                    {comparison.increased ? '+' : ''}{comparison.percent_change}%
                  </span>
                  {comparison.increased ? (
                    <TrendingUp className="w-5 h-5 text-rose-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-emerald-600" />
                  )}
                </>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              {comparison ? `${formatCurrency(Math.abs(comparison.difference))} ${comparison.increased ? 'more' : 'less'} than last month` : 'Need at least 2 months of data'}
            </span>
          </div>

        </div>

        {/* Charts Section */}
        {loading ? (
          <div className="bg-white p-16 rounded-3xl border border-slate-200/80 text-center text-slate-400 text-xs">
            Loading charts and trend analytics...
          </div>
        ) : categories.length === 0 && trends.every((t) => t.spending === 0) ? (
          <EmptyState
            icon={BarChart2}
            title="No spending data to visualize"
            description="Start adding your daily expenses to see dynamic category breakdowns and monthly trends."
            actionText="Add an Expense"
            onAction={() => setIsExpenseModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Donut Chart: Category-wise Expense */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                    Category Spending Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">Distribution of expenses by category</p>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <PieIcon className="w-4.5 h-4.5" />
                </div>
              </div>

              {categories.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  No categorical spending recorded for this selection.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {categories.map((entry) => (
                          <Cell
                            key={`cell-${entry.category}`}
                            fill={pieColors[entry.category] || '#475569'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), 'Total']}
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#FFF',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Custom Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                {categories.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: pieColors[cat.category] || '#475569' }}
                    />
                    <span className="text-slate-600 truncate">{cat.category}</span>
                    <span className="font-bold text-slate-800">({cat.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart: Monthly Spending (12 Months) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                    Monthly Spending in {selectedYear}
                  </h3>
                  <p className="text-xs text-slate-500">12-month expense comparison</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 text-[#2F8F24]">
                  <BarChart2 className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Spending']}
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#FFF',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="spending" fill="#2F8F24" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 text-center">
                Annual overview for {selectedYear}
              </div>
            </div>

            {/* Monthly Spending Breakdown Table (Full Width) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                    Monthly Spending Breakdown ({selectedYear})
                  </h3>
                  <p className="text-xs text-slate-500">Structured monthly totals and comparisons</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 text-[#2F8F24]">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Month</th>
                      <th className="pb-3 text-right">Total Expenditure</th>
                      <th className="pb-3 text-right pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {trends.map((item, idx) => {
                      const isSelected = selectedMonth === idx + 1;
                      return (
                        <tr
                          key={item.month}
                          className={`hover:bg-slate-50/80 transition ${
                            isSelected ? 'bg-emerald-50/50 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 pl-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#2F8F24]" />
                            <span className="text-slate-900">{MONTH_NAMES[idx + 1]}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-[#2F8F24] text-white px-2 py-0.5 rounded-full font-medium">
                                Selected Month
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-bold text-slate-900">
                            {formatCurrency(item.spending)}
                          </td>
                          <td className="py-3 text-right pr-2">
                            {item.spending > 0 ? (
                              <span className="inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                Recorded
                              </span>
                            ) : (
                              <span className="inline-block text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                                No expenses
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Add Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
