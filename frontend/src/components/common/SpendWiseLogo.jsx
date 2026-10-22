import React from 'react';
import { Link } from 'react-router-dom';

export default function SpendWiseLogo({ size = 'md', showSubtitle = false, to = '/' }) {
  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-xl' },
    md: { icon: 'w-10 h-10', text: 'text-2xl' },
    lg: { icon: 'w-14 h-14', text: 'text-3xl' },
    xl: { icon: 'w-20 h-20', text: 'text-4xl' },
  }[size] || { icon: 'w-10 h-10', text: 'text-2xl' };

  const content = (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Wallet SVG Icon with Rupee Symbol */}
      <div className={`relative ${sizeClasses.icon} shrink-0 transition-transform duration-200 group-hover:scale-105`}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Back Paper Currency Note */}
          <rect x="12" y="6" width="24" height="12" rx="3" fill="#A3D99B" stroke="#2F8F24" strokeWidth="1.5"/>
          <circle cx="24" cy="12" r="3" fill="#2F8F24" opacity="0.3"/>
          
          {/* Main Wallet Base */}
          <rect x="6" y="14" width="36" height="26" rx="6" fill="#2F8F24" />
          
          {/* Top Wallet Trim / Fold */}
          <path d="M6 20C6 16.6863 8.68629 14 12 14H36C39.3137 14 42 16.6863 42 20V22H6V20Z" fill="#25751D" />
          
          {/* Card Slot Highlight */}
          <path d="M11 20H25" stroke="#48BA3C" strokeWidth="2" strokeLinecap="round" />
          
          {/* Wallet Clasp / Flap */}
          <path d="M26 21H38C39.6569 21 41 22.3431 41 24V30C41 31.6569 39.6569 33 38 33H26C24.3431 33 23 31.6569 23 30V24C23 22.3431 24.3431 21 26 21Z" fill="#1B5514" />
          
          {/* Rupee Symbol Coin on Clasp */}
          <circle cx="32" cy="27" r="4.5" fill="#FFFFFF" />
          <text
            x="32"
            y="30"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="8"
            fontWeight="bold"
            fill="#2F8F24"
            textAnchor="middle"
          >
            ₹
          </text>
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className={`font-bold tracking-tight ${sizeClasses.text} leading-none font-['Outfit']`}>
          <span className="text-slate-900">Spend</span>
          <span className="text-[#2F8F24]">Wise</span>
        </div>
        {showSubtitle && (
          <span className="text-xs font-medium text-slate-500 tracking-wide mt-0.5">
            Expense Tracker
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block hover:opacity-95 transition">
        {content}
      </Link>
    );
  }

  return content;
}
