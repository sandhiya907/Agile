import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import SpendWiseLogo from '../components/common/SpendWiseLogo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Lock, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Missing password reset token in the link.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErrorMsg('Password must contain at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        password,
        confirm_password: confirmPassword,
      });

      success('Password reset successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. The link may have expired.');
      toastError(err.message || 'Reset failed');
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

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit'] mb-1">
          Set New Password
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          Choose a strong password with at least 8 characters.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left animate-fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="New Password"
            id="new-password"
            type="password"
            required
            placeholder="At least 8 characters with letter & number"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Confirm New Password"
            id="confirm-password"
            type="password"
            required
            placeholder="Repeat your new password"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
            Reset Password
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
    </div>
  );
}
