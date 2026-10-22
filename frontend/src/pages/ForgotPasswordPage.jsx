import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SpendWiseLogo from '../components/common/SpendWiseLogo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Mail, CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { success, error: toastError } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSubmitted(true);
      if (res.dev_reset_link) {
        setDevLink(res.dev_reset_link);
      }
      success('Password reset instructions dispatched.');
    } catch (err) {
      toastError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D6E5D3] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-6 sm:p-8 border border-emerald-950/5 animate-fade-in relative text-center">
        
        <div className="flex justify-center mb-6">
          <SpendWiseLogo size="md" to="/" showSubtitle />
        </div>

        {submitted ? (
          <div className="py-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#2F8F24] flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-['Outfit'] mb-2">
              Check your email
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              If an account with <strong className="text-slate-900">{email}</strong> exists, we've sent password reset instructions.
            </p>

            {devLink && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-left">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block mb-1">
                  Local Dev Simulator:
                </span>
                <a
                  href={devLink}
                  className="text-xs text-[#2F8F24] hover:underline font-medium break-all flex items-center gap-1"
                >
                  <span>Click to open reset page</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}

            <Link to="/login" className="w-full">
              <Button variant="outline" fullWidth icon={ArrowLeft}>
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit'] mb-1">
              Reset Password
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Enter your account email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <Input
                label="Email Address"
                id="reset-email"
                type="email"
                required
                placeholder="name@example.com"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
