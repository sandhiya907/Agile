import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SpendWiseLogo from '../components/common/SpendWiseLogo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, CheckCircle2, ExternalLink } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    terms_accepted: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) {
      errs.password = 'Password must contain at least one letter and one number';
    }

    if (formData.password !== formData.confirm_password) {
      errs.confirm_password = 'Passwords do not match';
    }

    if (!formData.terms_accepted) {
      errs.terms_accepted = 'You must agree to the Terms and Conditions';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.register({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        terms_accepted: formData.terms_accepted,
      });

      success('Account created successfully! You can now log in with your email and password.');
      navigate('/login');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setErrors((prev) => ({
        ...prev,
        form: msg,
      }));
      toastError(msg);
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
            Create your account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Start tracking and saving smarter today
          </p>
        </div>

        {/* Error Alert */}
        {errors.form && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 animate-fade-in text-left">
            <p className="font-bold text-rose-950 mb-1">Registration Error</p>
            <p className="leading-relaxed">{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <Input
              label="Full Name"
              id="full_name"
              required
              placeholder="e.g. Rahul Sharma"
              icon={User}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              error={errors.full_name}
            />

            {/* Email */}
            <Input
              label="Email Address"
              id="email"
              type="email"
              required
              placeholder="name@example.com"
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />

            {/* Password */}
            <Input
              label="Password"
              id="password"
              type="password"
              required
              placeholder="At least 8 characters with 1 letter & 1 number"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              id="confirm_password"
              type="password"
              required
              placeholder="Repeat your password"
              icon={Lock}
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              error={errors.confirm_password}
            />

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={formData.terms_accepted}
                onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2F8F24] focus:ring-[#2F8F24] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 select-none">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setTermsModalOpen(true)}
                  className="text-[#2F8F24] hover:underline font-semibold"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>
            {errors.terms_accepted && (
              <p className="text-xs text-rose-500 font-medium">{errors.terms_accepted}</p>
            )}

            {/* Submit Button */}
            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Create Account
            </Button>

            {/* Link to Login */}
            <p className="text-center text-xs text-slate-500 pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-[#2F8F24] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </form>
      </div>

      {/* Terms and Conditions Modal */}
      <Modal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="Terms & Conditions"
      >
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 max-h-80 overflow-y-auto pr-2">
          <p>
            Welcome to SpendWise. By creating an account and using our service, you agree to comply with and be bound by the following terms.
          </p>
          <h4 className="font-semibold text-slate-800">1. Data Privacy & Security</h4>
          <p>
            We take your financial privacy seriously. Your expense logs, budgets, and personal details are encrypted and strictly isolated to your authenticated account.
          </p>
          <h4 className="font-semibold text-slate-800">2. Responsible Use</h4>
          <p>
            You agree to provide accurate information and safeguard your credentials. SpendWise does not access your real bank accounts or initiate payments.
          </p>
        </div>
        <div className="mt-5 text-right">
          <Button onClick={() => setTermsModalOpen(false)}>I Understand</Button>
        </div>
      </Modal>
    </div>
  );
}
