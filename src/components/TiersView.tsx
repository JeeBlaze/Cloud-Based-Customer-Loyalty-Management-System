import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  Check,
  Edit2,
  TrendingUp,
  X,
  Plus,
  Users,
  Shield,
  Layers,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { LoyaltyTier } from '../types';

interface TiersViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const TiersView: React.FC<TiersViewProps> = ({ onShowToast }) => {
  const tiers = loyaltyService.getTiers();
  const customers = loyaltyService.getCustomers();

  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [tierName, setTierName] = useState('');
  const [minSpend, setMinSpend] = useState('0');
  const [minPoints, setMinPoints] = useState('0');
  const [multiplier, setMultiplier] = useState('1.0');
  const [benefitsText, setBenefitsText] = useState('');

  const handleEditClick = (tier: LoyaltyTier) => {
    setEditingTier(tier);
    setTierName(tier.name);
    setMinSpend(tier.minSpend.toString());
    setMinPoints(tier.minPoints.toString());
    setMultiplier(tier.multiplier.toString());
    setBenefitsText(tier.benefits.join('\n'));
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;

    const benefits = benefitsText
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    const updated: LoyaltyTier = {
      ...editingTier,
      name: tierName.trim(),
      minSpend: parseFloat(minSpend) || 0,
      minPoints: parseInt(minPoints, 10) || 0,
      multiplier: parseFloat(multiplier) || 1.0,
      benefits,
    };

    await loyaltyService.updateTier(updated);
    setEditingTier(null);
    onShowToast('VIP Tier Updated', `${updated.name} settings updated`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Membership &amp; VIP Tiers
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure tier qualification thresholds, earning accelerators, and exclusive luxury perks
          </p>
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const membersInTier = customers.filter((c) => c.tierId === tier.id);
          const totalSpentInTier = membersInTier.reduce((sum, c) => sum + c.totalSpent, 0);

          return (
            <div
              key={tier.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-zinc-100 dark:ring-zinc-800"
                      style={{ backgroundColor: tier.color }}
                    />
                    <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
                      {tier.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleEditClick(tier)}
                    className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Multiplier Badge */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight font-mono text-zinc-900 dark:text-zinc-50">
                    {tier.multiplier}x
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">Points Velocity</span>
                </div>

                {/* Qualification Criteria */}
                <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-500 text-[11px]">
                    <span>Spend Threshold:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      ${tier.minSpend.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-[11px]">
                    <span>Points Threshold:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {tier.minPoints.toLocaleString()} pts
                    </span>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Tier Privileges
                  </div>
                  <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    {tier.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight text-[11px]">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Members Footprint */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{membersInTier.length} Members</span>
                </div>
                <span className="font-mono text-zinc-600 dark:text-zinc-300">
                  ${totalSpentInTier.toLocaleString()} vol
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tier Upgrade Philosophy Box */}
      <div className="p-5 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-white">Automated Real-Time Tier Upgrades</h4>
          </div>
          <p className="text-xs text-zinc-400">
            Whenever a customer completes an order, their spend and lifetime points are re-evaluated against the tier ladder.
            When qualified, their multiplier accelerates instantly and welcome notifications are dispatched.
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-mono font-medium text-zinc-200">
            Next Evaluation: Immediate on Tx
          </span>
        </div>
      </div>

      {/* Edit Tier Modal */}
      {editingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Edit {editingTier.name}
              </h3>
              <button
                onClick={() => setEditingTier(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tier Display Name
                </label>
                <input
                  type="text"
                  required
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Min Spend ($)
                  </label>
                  <input
                    type="number"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Points Multiplier (e.g. 1.5)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Privileges / Benefits (one per line)
                </label>
                <textarea
                  rows={4}
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90"
                >
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
