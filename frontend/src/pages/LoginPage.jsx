import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SpendWiseLogo from '../components/common/SpendWiseLogo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({
        email: email.trim(),
        password,
        remember_me: rememberMe,
      });

      success('Welcome back to SpendWise!');
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D6E5D3] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-6 sm:p-8 border border-emerald-950/5 animate-fade-in relative overflow-hidden">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <SpendWiseLogo size="md" to="/" showSubtitle />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit'] mt-4">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sign in to track your expenses and budgets
          </p>
        </div>

        {/* General Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <Input
            label="Email Address"
            id="email"
            type="email"
            required
            placeholder="name@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <Input
            label="Password"
            id="password"
            type="password"
            required
            placeholder="Enter your password"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#2F8F24] focus:ring-[#2F8F24] cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-[#2F8F24] hover:text-[#25751d] font-semibold hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Login Button */}
          <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
            Sign In
          </Button>

          {/* Link to Register */}
          <p className="text-center text-xs text-slate-500 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2F8F24] font-semibold hover:underline">
              Register now
            </Link>
          </p>
        </form>

      </div>
    </div>
  );
}
