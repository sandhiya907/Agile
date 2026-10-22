import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileApi } from '../services/api';

import Modal from '../components/common/Modal';

import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  Calendar,
  LogOut,
  Receipt,
  PiggyBank,
  ShieldCheck,
  AlertTriangle,
  Trash2
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateLocalUser } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwError, setPwError] = useState('');

  // Delete Account state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.getProfile();
        if (data && data.success) {
          setProfile(data.profile);
          setFullName(data.profile.full_name || '');
        }
      } catch (err) {
        toastError(err.message || 'Failed to fetch profile details');
      }
    };

    fetchProfile();
  }, [toastError]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setUpdatingName(true);
    try {
      const res = await profileApi.updateProfile({ full_name: fullName.trim() });
      updateLocalUser({ full_name: fullName.trim() });
      success('Name updated successfully!');
    } catch (err) {
      toastError(err.message || 'Failed to update name');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');

    if (!currentPassword) {
      setPwError('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPwError('New password must contain at least one letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await profileApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Failed to change password. Ensure current password is correct.');
      toastError(err.message || 'Password update failed');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (deleteConfirmText.trim() !== 'DELETE') {
      setDeleteError('Please type DELETE exactly to confirm deletion.');
      return;
    }

    if (!deletePassword) {
      setDeleteError('Please enter your current password.');
      return;
    }

    setDeletingAccount(true);
    try {
      await profileApi.deleteAccount({
        password: deletePassword,
        confirmation: deleteConfirmText.trim(),
      });

      success('Your account and all associated data have been permanently deleted.');
      setDeleteModalOpen(false);
      await logout();
      navigate('/welcome', { replace: true });
    } catch (err) {
      const msg = err.message || 'Failed to delete account. Please verify your password.';
      setDeleteError(msg);
      toastError(msg);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter']">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
            User Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your personal profile and security preferences
          </p>
        </div>

        {/* Profile Card & Summary */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#2F8F24] flex items-center justify-center font-bold text-2xl uppercase border-2 border-emerald-200">
              {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit']">
                  {profile?.full_name || user?.full_name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#2F8F24] text-[11px] font-semibold border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">{profile?.email || user?.email}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '2026'}
              </p>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center min-w-[110px]">
              <span className="text-xs text-slate-500 block">Expenses</span>
              <strong className="text-base font-extrabold text-slate-900 font-['Outfit']">
                {profile?.expense_count || 0}
              </strong>
            </div>

            <div className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center min-w-[110px]">
              <span className="text-xs text-slate-500 block">Budgets</span>
              <strong className="text-base font-extrabold text-slate-900 font-['Outfit']">
                {profile?.budget_count || 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Edit Profile Name Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] mb-1">
            Personal Information
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Update your account display name
          </p>

          <form onSubmit={handleUpdateName} className="space-y-4 max-w-lg">
            <Input
              label="Full Name"
              id="profile_name"
              required
              placeholder="Your full name"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Email Address (Protected)"
              id="profile_email"
              disabled
              icon={Mail}
              value={profile?.email || user?.email || ''}
              helperText="Email address is permanently linked and verified with this account."
            />

            <Button type="submit" loading={updatingName}>
              Save Name Changes
            </Button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] mb-1">
            Change Password
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Ensure your account is using a secure, strong password
          </p>

          {pwError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs max-w-lg">
              {pwError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <Input
              label="Current Password"
              id="current_password"
              type="password"
              required
              placeholder="Enter current password"
              icon={Lock}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <Input
              label="New Password"
              id="new_password"
              type="password"
              required
              placeholder="Minimum 8 characters with letter & number"
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="Confirm New Password"
              id="confirm_new_password"
              type="password"
              required
              placeholder="Repeat new password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button type="submit" loading={changingPassword}>
              Update Password
            </Button>
          </form>
        </div>

        {/* Security & Logout Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 font-['Outfit']">
              Sign Out of Session
            </h4>
            <p className="text-xs text-slate-500">
              Clear your HttpOnly authentication cookies from this browser session.
            </p>
          </div>
          <Button variant="outline" icon={LogOut} onClick={handleLogout}>
            Logout from SpendWise
          </Button>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="bg-rose-50/40 rounded-3xl border border-rose-200/80 p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h4 className="text-base sm:text-lg font-bold text-rose-950 font-['Outfit']">
                  Danger Zone
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
                Permanently delete your SpendWise account and all personal data. This action is irreversible.
              </p>
            </div>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                setDeleteModalOpen(true);
                setDeletePassword('');
                setDeleteConfirmText('');
                setDeleteError('');
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
            >
              Delete Account
            </Button>
          </div>
        </div>

      </main>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deletingAccount) {
            setDeleteModalOpen(false);
            setDeletePassword('');
            setDeleteConfirmText('');
            setDeleteError('');
          }
        }}
        title="Delete Account Permanently"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-rose-950 font-semibold mb-0.5">Warning: This action is permanent!</strong>
              Deleting your account will immediately and permanently erase your profile, all recorded expenses, budgets, and security tokens. This cannot be undone.
            </div>
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs">
              {deleteError}
            </div>
          )}

          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter your current password
              </label>
              <Input
                id="delete_account_password"
                type="password"
                required
                placeholder="Enter password to verify identity"
                icon={Lock}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                disabled={deletingAccount}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type <span className="font-mono font-bold text-rose-600">DELETE</span> to confirm
              </label>
              <input
                id="delete_account_confirmation"
                type="text"
                required
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deletingAccount}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={deletingAccount}
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={deletingAccount}
                disabled={deleteConfirmText.trim() !== 'DELETE' || !deletePassword}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Permanently Delete Account
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
