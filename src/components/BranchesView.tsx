import React, { useState } from 'react';
import {
  Store,
  MapPin,
  User,
  Plus,
  DollarSign,
  TrendingUp,
  X,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { Branch } from '../types';

interface BranchesViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const BranchesView: React.FC<BranchesViewProps> = ({ onShowToast }) => {
  const branches = loyaltyService.getBranches();
  const business = loyaltyService.getBusiness();
  const transactions = loyaltyService.getTransactions();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [managerName, setManagerName] = useState('');

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      onShowToast('Missing info', 'Name and branch code are required', 'error');
      return;
    }

    const newBranch: Branch = {
      id: `br_${Date.now()}`,
      businessId: business.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      location: location.trim(),
      managerName: managerName.trim() || 'Store Manager',
      isActive: true,
      revenueThisMonth: 0,
      transactionsCount: 0,
      createdAt: new Date().toISOString(),
    };

    await loyaltyService.saveBranch(newBranch);
    setShowAddModal(false);
    setName('');
    setCode('');
    setLocation('');
    setManagerName('');
    onShowToast('Branch Added', `Store branch "${newBranch.name}" created`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Stores &amp; Branch Locations
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage physical retail locations, online storefronts, and branch-level loyalty attribution
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Business Tenant Profile */}
      <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{business.name}</h2>
            <div className="text-xs text-zinc-400">
              Currency: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{business.currency}</span> | Earning Ratio: {business.pointsPerCurrency} pt/$1 | Expiry: {business.pointExpiryMonths} Mo
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          Super Admin Owner: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{business.ownerEmail}</span>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((b) => {
          const branchTxs = transactions.filter((t) => t.branchId === b.id);
          const pointsEarnedHere = branchTxs.filter((t) => t.points > 0).reduce((s, t) => s + t.points, 0);

          return (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">{b.name}</h3>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {b.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{b.location}</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Active
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-400">Store Manager</span>
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1">
                    <User className="w-3 h-3 text-zinc-400" />
                    <span>{b.managerName}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-400">Monthly Volume</span>
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    ${(b.revenueThisMonth || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>Transactions Recorded:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {(b.transactionsCount || branchTxs.length).toLocaleString()} orders
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Add Store Branch
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Location / Store Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Austin South Congress"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Store Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ATX-04"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Store Manager Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Liam Parker"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Physical Address / URL
                </label>
                <input
                  type="text"
                  placeholder="1400 S Congress Ave, Austin, TX"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90"
                >
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
