import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { budgetsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { IndianRupee, Calendar } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BudgetModal({ isOpen, onClose, budgetToEdit, initialMonth, initialYear, onSuccess }) {
  const { success, error: toastError } = useToast();
  const currentDate = new Date();

  const [month, setMonth] = useState(initialMonth || currentDate.getMonth() + 1);
  const [year, setYear] = useState(initialYear || currentDate.getFullYear());
  const [limitAmount, setLimitAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (budgetToEdit) {
      setMonth(budgetToEdit.month);
      setYear(budgetToEdit.year);
      setLimitAmount(budgetToEdit.limit_amount || '');
    } else {
      setMonth(initialMonth || currentDate.getMonth() + 1);
      setYear(initialYear || currentDate.getFullYear());
      setLimitAmount('');
    }
    setError('');
  }, [budgetToEdit, initialMonth, initialYear, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!limitAmount || isNaN(limitAmount) || Number(limitAmount) <= 0) {
      setError('Please enter a valid budget amount greater than 0');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        limit_amount: parseFloat(limitAmount),
      };

      await budgetsApi.set(payload);
      success(`Budget for ${MONTH_NAMES[month - 1]} ${year} saved successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toastError(err.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Edit Monthly Budget' : 'Set Monthly Budget'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Month & Year Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Month</label>
            <select
              value={month}
              disabled={!!budgetToEdit}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#2F8F24] focus:ring-2 focus:ring-[#2F8F24]/20 transition disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Year</label>
            <select
              value={year}
              disabled={!!budgetToEdit}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#2F8F24] focus:ring-2 focus:ring-[#2F8F24]/20 transition disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Limit Amount */}
        <Input
          label="Budget Limit Amount (₹)"
          id="budget_limit"
          type="number"
          step="0.01"
          required
          placeholder="e.g. 25000"
          icon={IndianRupee}
          value={limitAmount}
          onChange={(e) => {
            setLimitAmount(e.target.value);
            setError('');
          }}
          error={error}
          helperText="We will notify you with alerts when your spending nears or exceeds this limit."
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {budgetToEdit ? 'Update Budget' : 'Set Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
