import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  GraduationCap,
  HeartPulse,
  Film,
  MoreHorizontal
} from 'lucide-react';

export const CATEGORY_CONFIG = {
  Food: {
    icon: Utensils,
    color: '#EA580C',
    bg: '#FFEDD5',
    text: '#C2410C',
    border: '#FED7AA',
  },
  Transport: {
    icon: Car,
    color: '#0284C7',
    bg: '#E0F2FE',
    text: '#0369A1',
    border: '#BAE6FD',
  },
  Shopping: {
    icon: ShoppingBag,
    color: '#9333EA',
    bg: '#F3E8FF',
    text: '#7E22CE',
    border: '#E9D5FF',
  },
  Bills: {
    icon: Receipt,
    color: '#D97706',
    bg: '#FEF3C7',
    text: '#B45309',
    border: '#FDE68A',
  },
  Education: {
    icon: GraduationCap,
    color: '#0D9488',
    bg: '#CCFBF1',
    text: '#0F766E',
    border: '#99F6E4',
  },
  Health: {
    icon: HeartPulse,
    color: '#E11D48',
    bg: '#FFE4E6',
    text: '#BE123C',
    border: '#FECDD3',
  },
  Entertainment: {
    icon: Film,
    color: '#DB2777',
    bg: '#FCE7F3',
    text: '#BE185D',
    border: '#FBCFE8',
  },
  Others: {
    icon: MoreHorizontal,
    color: '#475569',
    bg: '#F1F5F9',
    text: '#334155',
    border: '#E2E8F0',
  },
};

export default function CategoryIcon({ category, size = 'md', className = '' }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Others;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: { box: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5' },
    md: { box: 'w-9 h-9 rounded-xl', icon: 'w-4.5 h-4.5' },
    lg: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
  }[size] || { box: 'w-9 h-9 rounded-xl', icon: 'w-4.5 h-4.5' };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 border ${sizeClasses.box} ${className}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.color,
      }}
      title={category}
    >
      <IconComponent className={sizeClasses.icon} />
    </div>
  );
}
