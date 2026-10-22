import React from 'react';
import { Link } from 'react-router-dom';
import SpendWiseLogo from '../components/common/SpendWiseLogo';
import Button from '../components/common/Button';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#D6E5D3] flex items-center justify-center p-4 font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 text-center animate-fade-in border border-emerald-950/5">
        <div className="flex justify-center mb-6">
          <SpendWiseLogo size="md" to="/" showSubtitle />
        </div>
        <h1 className="text-6xl font-extrabold text-[#2F8F24] font-['Outfit'] mb-2">
          404
        </h1>
        <h2 className="text-xl font-bold text-slate-800 font-['Outfit'] mb-2">
          Page Not Found
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button icon={Home} fullWidth>
            Return to SpendWise
          </Button>
        </Link>
      </div>
    </div>
  );
}
