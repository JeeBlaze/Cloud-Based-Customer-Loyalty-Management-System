import React from 'react';
import {
  Sparkles,
  Store,
  UserCheck,
  Smartphone,
  LogOut,
  LogIn,
  RotateCcw,
  PlusCircle,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loyaltyService } from '../services/loyaltyService';
import { Role } from '../types';

interface HeaderProps {
  onQuickRecordPurchase: () => void;
  onSeedDemoData: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onQuickRecordPurchase,
  onSeedDemoData,
  activeView,
  setActiveView,
}) => {
  const { user, role, setRole, signIn, signOut, activeBranchId, setActiveBranchId, firestoreConnected } =
    useAuth();
  const business = loyaltyService.getBusiness();
  const branches = loyaltyService.getBranches();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-lg tracking-tighter shadow-sm">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight text-base">
                AuraLoyalty
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                Cloud
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[180px] sm:max-w-xs">
              {business.name}
            </div>
          </div>
        </div>

        {/* Center: Branch Filter & Mode Switcher */}
        <div className="hidden md:flex items-center gap-2">
          {/* Branch Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
            <Store className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={activeBranchId}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-medium cursor-pointer"
            >
              <option value="all">All Locations ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Switch to Customer Portal Mode */}
          <button
            onClick={() => setActiveView(activeView === 'portal' ? 'dashboard' : 'portal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === 'portal'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{activeView === 'portal' ? 'Back to Admin' : 'Customer View'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Seed Demo Data Button */}
          <button
            onClick={onSeedDemoData}
            title="Reload realistic demo dataset"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          {/* Quick Record Purchase Button */}
          <button
            onClick={onQuickRecordPurchase}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Record Purchase</span>
            <span className="sm:hidden">+ Points</span>
          </button>

          {/* Role selector */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
            <UserCheck className="w-3 h-3 text-zinc-400 ml-1.5" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-transparent border-none outline-none text-[11px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer pr-1"
            >
              <option value="PLATFORM_ADMIN">Admin (Superuser)</option>
              <option value="BUSINESS_OWNER">Business Owner</option>
              <option value="STORE_MANAGER">Branch Manager</option>
              <option value="CUSTOMER">Customer Role</option>
            </select>
          </div>

          {/* Cloud Firestore Status Pill */}
          <div
            title={firestoreConnected ? 'Cloud Firestore Connected' : 'Local Persistence Active (Ready to Sync)'}
            className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden xl:inline">Firestore Ready</span>
          </div>

          {/* Google Auth status */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-zinc-200 dark:border-zinc-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-zinc-300 dark:border-zinc-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs font-semibold">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
