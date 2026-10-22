import React from 'react';
import Button from './Button';
import { PlusCircle } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PlusCircle,
  title = 'No records found',
  description = 'Get started by adding your first record.',
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#2F8F24] flex items-center justify-center mb-4 border border-emerald-100">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-800 font-['Outfit'] mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} icon={PlusCircle}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
