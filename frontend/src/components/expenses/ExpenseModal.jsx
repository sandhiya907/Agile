import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { CATEGORY_CONFIG } from '../common/CategoryIcon';
import { expensesApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Calendar, Tag, FileText, IndianRupee } from 'lucide-react';

export default function ExpenseModal({ isOpen, onClose, expenseToEdit, onSuccess }) {
  const isEditing = !!expenseToEdit;
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        title: expenseToEdit.title || '',
        amount: expenseToEdit.amount || '',
        category: expenseToEdit.category || 'Food',
        expense_date: expenseToEdit.expense_date || new Date().toISOString().split('T')[0],
        notes: expenseToEdit.notes || '',
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setErrors({});
  }, [expenseToEdit, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required';
    }
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!formData.category) {
      errs.category = 'Category is required';
    }
    if (!formData.expense_date) {
      errs.expense_date = 'Date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        expense_date: formData.expense_date,
        notes: formData.notes.trim(),
      };

      if (isEditing) {
        await expensesApi.update(expenseToEdit.id, payload);
        success('Expense updated successfully');
      } else {
        await expensesApi.create(payload);
        success('Expense added successfully');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toastError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense' : 'Add New Expense'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <Input
          label="Expense Title / Description"
          id="title"
          required
          placeholder="e.g. Weekly Grocery, Bus Pass, Dinner"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
        />

        {/* Amount */}
        <Input
          label="Amount (₹)"
          id="amount"
          type="number"
          step="0.01"
          required
          placeholder="0.00"
          icon={IndianRupee}
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          error={errors.amount}
        />

        {/* Category Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">
            Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(CATEGORY_CONFIG).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const isSelected = formData.category === cat;
              const Icon = config.icon;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'border-[#2F8F24] bg-emerald-50 text-[#2F8F24] shadow-xs ring-1 ring-[#2F8F24]'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: isSelected ? '#2F8F24' : config.color }} />
                  <span className="truncate">{cat}</span>
                </button>
              );
            })}
          </div>
          {errors.category && <p className="text-xs text-rose-500 font-medium mt-1">{errors.category}</p>}
        </div>

        {/* Expense Date */}
        <Input
          label="Expense Date"
          id="expense_date"
          type="date"
          required
          icon={Calendar}
          value={formData.expense_date}
          onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
          error={errors.expense_date}
        />

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="text-xs font-semibold text-slate-700 block mb-1.5">
            Optional Notes
          </label>
          <div className="relative">
            <textarea
              id="notes"
              rows={2}
              placeholder="Additional details, merchant info, tags..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2F8F24] focus:ring-2 focus:ring-[#2F8F24]/20 transition"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
