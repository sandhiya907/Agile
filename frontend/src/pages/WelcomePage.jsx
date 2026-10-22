import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#D6E5D3] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-['Inter']">
      {/* Centered Tall White Content Panel */}
      <div className="relative w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-950/10 overflow-hidden flex flex-col justify-between min-h-[660px] sm:min-h-[720px] border border-emerald-900/5 animate-fade-in">
        
        {/* Upper Left Header Label */}
        <div className="px-8 pt-8 flex items-center justify-between z-10">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Get Started Page
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#2F8F24] text-[11px] font-medium border border-emerald-100">
            <Sparkles className="w-3 h-3" />
            <span>v1.0</span>
          </div>
        </div>

        {/* Center Illustration and Branding Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 text-center z-10">
          {/* Custom Wallet with Rupee Symbol Illustration */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 mb-6 flex items-center justify-center">
            {/* Ambient Green Aura Glow behind wallet */}
            <div className="absolute inset-0 bg-[#2F8F24]/10 rounded-full blur-2xl transform scale-110" />

            <svg
              viewBox="0 0 200 200"
              className="w-full h-full relative z-10 drop-shadow-xl"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back Emerging Currency Note */}
              <g transform="rotate(-6 100 80)">
                <rect x="52" y="44" width="96" height="52" rx="7" fill="#B4E2AF" stroke="#2F8F24" strokeWidth="2.5"/>
                <circle cx="100" cy="70" r="14" fill="#2F8F24" opacity="0.25" />
                <path d="M60 52H68 M132 88H140" stroke="#2F8F24" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
              </g>

              {/* Front Emerging Currency Note */}
              <g transform="rotate(4 100 80)">
                <rect x="56" y="48" width="94" height="52" rx="7" fill="#D7F3D4" stroke="#2F8F24" strokeWidth="2.5"/>
                <circle cx="103" cy="74" r="14" fill="#2F8F24" opacity="0.2" />
                <text x="103" y="79" fontFamily="Inter, Arial, sans-serif" fontSize="15" fontWeight="bold" fill="#2F8F24" textAnchor="middle">₹</text>
              </g>

              {/* Back Layer of Wallet */}
              <rect x="32" y="76" width="136" height="88" rx="18" fill="#23751B" />
              
              {/* Main Wallet Leather Body */}
              <rect x="30" y="84" width="140" height="84" rx="18" fill="url(#walletGradient)" stroke="#1B5C15" strokeWidth="2"/>

              {/* Stitching Details along edges */}
              <rect x="35" y="89" width="130" height="74" rx="14" fill="none" stroke="#68D05C" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>

              {/* Top Accent Fold */}
              <path d="M30 100C30 91.1634 37.1634 84 46 84H154C162.837 84 170 91.1634 170 100V104H30V100Z" fill="#25751D" />

              {/* Wallet Closure Flap */}
              <path
                d="M106 104H164C168.418 104 172 107.582 172 112V136C172 140.418 168.418 144 164 144H106C100.477 144 96 139.523 96 134V114C96 108.477 100.477 104 106 104Z"
                fill="#1C5C15"
                stroke="#14430F"
                strokeWidth="1.5"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
              />

              {/* Metallic Clasp / Coin with Rupee Symbol */}
              <circle cx="140" cy="124" r="13" fill="#FFFFFF" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
              <circle cx="140" cy="124" r="10.5" fill="#F8FAF8" stroke="#2F8F24" strokeWidth="1.5" />
              <text
                x="140"
                y="129"
                fontFamily="Inter, Arial, sans-serif"
                fontSize="14"
                fontWeight="800"
                fill="#2F8F24"
                textAnchor="middle"
              >
                ₹
              </text>

              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="walletGradient" x1="30" y1="84" x2="170" y2="168" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#359E29" />
                  <stop offset="1" stopColor="#257A1E" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Brand Name */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Outfit'] mb-1">
            <span className="text-slate-900">Spend</span>
            <span className="text-[#2F8F24]">Wise</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base font-medium text-slate-500 mb-3 font-['Outfit']">
            Expense Tracker
          </p>

          {/* Tagline */}
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 mb-2">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wider">
              Track • Manage • Save
            </p>
          </div>
        </div>

        {/* Bottom Action Section with Curved Decorative Wave */}
        <div className="relative pt-4 pb-8 px-8 z-10">
          {/* Get Started Button */}
          <button
            id="get-started-btn"
            onClick={() => navigate('/register')}
            className="w-full bg-[#2F8F24] hover:bg-[#25751D] text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg shadow-[#2F8F24]/30 hover:shadow-xl hover:shadow-[#2F8F24]/40 active:scale-[0.98] transition-all duration-200 cursor-pointer group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          {/* Secondary Sign In Link */}
          <div className="mt-4 text-center">
            <span className="text-xs text-slate-500">Already have an account? </span>
            <Link
              to="/login"
              className="text-xs font-semibold text-[#2F8F24] hover:text-[#25751D] hover:underline transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Curved Green Decorative Shape at the bottom of the white panel */}
        <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none overflow-hidden z-0">
          <svg
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            className="w-full h-full opacity-15"
          >
            <path
              d="M0,60 C120,110 280,10 400,60 L400,120 L0,120 Z"
              fill="#2F8F24"
            />
            <path
              d="M0,80 C150,120 250,40 400,90 L400,120 L0,120 Z"
              fill="#1B5514"
            />
          </svg>
        </div>

      </div>
    </div>
  );
}
