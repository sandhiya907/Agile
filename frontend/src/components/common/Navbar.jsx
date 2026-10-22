import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SpendWiseLogo from './SpendWiseLogo';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BarChart3,
  User,
  LogOut,
  Plus,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ onOpenAddExpense }) {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Expenses', to: '/expenses', icon: Receipt },
    { label: 'Budgets', to: '/budgets', icon: PieChart },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-8">
              <SpendWiseLogo size="md" to="/dashboard" />

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-50 text-[#2F8F24] font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Right side Actions */}
            <div className="hidden md:flex items-center gap-3">
              {onOpenAddExpense && (
                <button
                  type="button"
                  onClick={onOpenAddExpense}
                  className="flex items-center gap-1.5 bg-[#2F8F24] hover:bg-[#26751d] text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs hover:shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Expense</span>
                </button>
              )}

              {/* User Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition"
                  title="View Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#2F8F24] flex items-center justify-center font-bold text-xs uppercase border border-emerald-200">
                    {user?.full_name ? user.full_name.charAt(0) : 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.full_name || 'My Account'}</span>
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition focus:outline-none cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              {onOpenAddExpense && (
                <button
                  type="button"
                  onClick={onOpenAddExpense}
                  className="p-2 rounded-xl bg-[#2F8F24] text-white shadow-xs cursor-pointer"
                  aria-label="Add Expense"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-fade-in shadow-xl">
            <div className="px-3 py-2 bg-slate-50 rounded-xl mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2F8F24] flex items-center justify-center font-bold text-sm border border-emerald-200">
                  {user?.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{user?.full_name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-emerald-50 text-[#2F8F24] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
