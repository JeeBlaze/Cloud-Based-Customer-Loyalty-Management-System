import React, { useState } from 'react';
import { ShoppingBag, X, Coins, Sparkles, Check } from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';

interface QuickRecordPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuickRecordPurchaseModal: React.FC<QuickRecordPurchaseModalProps> = ({
  isOpen,
  onClose,
  customerId,
  onShowToast,
}) => {
  const customers = loyaltyService.getCustomers();
  const branches = loyaltyService.getBranches();
  const campaigns = loyaltyService.getCampaigns().filter((c) => c.status === 'ACTIVE');

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customerId || (customers[0]?.id || '')
  );
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '');
  const [amount, setAmount] = useState('120.00');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-5)}`);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync if customerId changes
  React.useEffect(() => {
    if (customerId) setSelectedCustomerId(customerId);
  }, [customerId]);

  if (!isOpen) return null;

  const currentCust = loyaltyService.getCustomerById(selectedCustomerId);
  const amountNum = parseFloat(amount) || 0;
  const calc = currentCust
    ? loyaltyService.calculatePoints(amountNum, currentCust.id, selectedCampaignId || undefined)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCust) return;
    if (amountNum <= 0) {
      onShowToast('Invalid amount', 'Purchase amount must be > $0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loyaltyService.recordPurchase({
        customerId: currentCust.id,
        purchaseAmount: amountNum,
        branchId: selectedBranchId,
        invoiceNumber: invoiceNumber.trim(),
        notes: notes.trim(),
        campaignId: selectedCampaignId || undefined,
      });

      onShowToast(
        'Points Awarded',
        `+${res.transaction.points} pts credited to ${res.customer.fullName}. New balance: ${res.customer.pointsBalance} pts.`,
        'success'
      );

      if (res.upgradedTier) {
        onShowToast(
          'VIP Tier Upgraded!',
          `${res.customer.fullName} is now ${res.upgradedTier.name}!`,
          'info'
        );
      }

      onClose();
    } catch (err: any) {
      onShowToast('Transaction Failed', err.message || 'Error recording purchase', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
              POS: Award Purchase Points
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Select Member *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
            >
              {customers.map((c) => {
                const t = loyaltyService.getTierById(c.tierId);
                return (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({t.name} - {c.pointsBalance} pts)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Purchase Amount ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-400 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Invoice / Receipt #
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Store Location
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Bonus Campaign
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
              >
                <option value="">None (Standard Rate)</option>
                {campaigns.map((cmp) => (
                  <option key={cmp.id} value={cmp.id}>
                    {cmp.name} ({cmp.bonusMultiplier}x)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Calculation Summary */}
          {calc && currentCust && (
            <div className="p-3.5 rounded-xl bg-zinc-950 text-white dark:bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Multiplier:</span>
                <span>
                  {calc.appliedTier.name} ({calc.tierMultiplier}x)
                  {calc.campaignMultiplier > 1 ? ` + Camp (${calc.campaignMultiplier}x)` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-white">Points to Issue:</span>
                <span className="font-mono text-emerald-400 text-sm">+{calc.totalPoints} pts</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                <span>New Balance:</span>
                <span className="font-mono text-white">
                  {(currentCust.pointsBalance + calc.totalPoints).toLocaleString()} pts
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90 flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Recording...' : 'Award Points Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
