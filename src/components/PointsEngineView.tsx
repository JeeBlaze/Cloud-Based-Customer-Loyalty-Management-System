import React, { useState } from 'react';
import {
  Coins,
  Calculator,
  History,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  ShoppingBag,
  Store,
  Layers,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { Customer, PointTransaction, TransactionType } from '../types';

interface PointsEngineViewProps {
  preselectedCustomerId?: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PointsEngineView: React.FC<PointsEngineViewProps> = ({
  preselectedCustomerId,
  onShowToast,
}) => {
  const business = loyaltyService.getBusiness();
  const branches = loyaltyService.getBranches();
  const customers = loyaltyService.getCustomers();
  const campaigns = loyaltyService.getCampaigns().filter((c) => c.status === 'ACTIVE');
  const transactions = loyaltyService.getTransactions();

  // POS Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomerId || (customers[0]?.id || '')
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [purchaseAmount, setPurchaseAmount] = useState<string>('150.00');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-${Date.now().toString().slice(-5)}`);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Ledger Filter State
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Earning Rules Config State
  const [editingRules, setEditingRules] = useState(false);
  const [pointsPerDollar, setPointsPerDollar] = useState(business.pointsPerCurrency.toString());
  const [dollarPerPoint, setDollarPerPoint] = useState(business.currencyPerPoint.toString());
  const [expiryMonths, setExpiryMonths] = useState(business.pointExpiryMonths.toString());

  const currentCustomer = loyaltyService.getCustomerById(selectedCustomerId);
  const currentTier = currentCustomer ? loyaltyService.getTierById(currentCustomer.tierId) : loyaltyService.getTiers()[0];

  // Live calculation
  const amountNum = parseFloat(purchaseAmount) || 0;
  const calcResult = currentCustomer
    ? loyaltyService.calculatePoints(amountNum, currentCustomer.id, selectedCampaignId || undefined)
    : {
        basePoints: 0,
        tierMultiplier: 1,
        campaignMultiplier: 1,
        totalPoints: 0,
        appliedTier: currentTier,
      };

  const balanceAfter = currentCustomer ? currentCustomer.pointsBalance + calcResult.totalPoints : 0;

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) {
      onShowToast('Customer Required', 'Please select a customer', 'error');
      return;
    }
    if (amountNum <= 0) {
      onShowToast('Invalid Amount', 'Purchase amount must be greater than $0', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await loyaltyService.recordPurchase({
        customerId: currentCustomer.id,
        purchaseAmount: amountNum,
        branchId: selectedBranchId,
        invoiceNumber: invoiceNumber.trim(),
        notes: notes.trim(),
        campaignId: selectedCampaignId || undefined,
      });

      onShowToast(
        'Points Awarded Successfully',
        `Awarded +${res.transaction.points} pts to ${res.customer.fullName}. New balance: ${res.customer.pointsBalance} pts.`,
        'success'
      );

      if (res.upgradedTier) {
        onShowToast(
          'VIP Tier Upgraded!',
          `Congratulations! ${res.customer.fullName} has advanced to ${res.upgradedTier.name} (${res.upgradedTier.multiplier}x multiplier)!`,
          'info'
        );
      }

      // Reset invoice number for next transaction
      setInvoiceNumber(`INV-${Date.now().toString().slice(-5)}`);
      setNotes('');
    } catch (err: any) {
      onShowToast('Transaction Failed', err.message || 'Error executing purchase award', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loyaltyService.updateBusiness({
        ...business,
        pointsPerCurrency: parseFloat(pointsPerDollar) || 1,
        currencyPerPoint: parseFloat(dollarPerPoint) || 0.05,
        pointExpiryMonths: parseInt(expiryMonths, 10) || 12,
      });
      setEditingRules(false);
      onShowToast('Loyalty Rules Updated', 'New point calculation rules deployed', 'success');
    } catch (err: any) {
      onShowToast('Error', err.message, 'error');
    }
  };

  // Filtered Ledger
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.customerName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      t.customerEmail.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(ledgerSearch.toLowerCase())) ||
      t.description.toLowerCase().includes(ledgerSearch.toLowerCase());

    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Points Engine &amp; POS Simulator
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automated points ledger, idempotency protection, tier multipliers, and live checkout simulator
          </p>
        </div>

        <button
          onClick={() => setEditingRules(!editingRules)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{editingRules ? 'Close Rules Editor' : 'Configure Earning Rules'}</span>
        </button>
      </div>

      {/* Rules Editor Panel (Expandable) */}
      {editingRules && (
        <form
          onSubmit={handleSaveRules}
          className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Loyalty Program Earning &amp; Expiration Settings
            </h3>
            <span className="text-[11px] text-zinc-400">Business Tenant ID: {business.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">
                Points per Currency Unit ({business.currency})
              </label>
              <input
                type="number"
                step="0.1"
                value={pointsPerDollar}
                onChange={(e) => setPointsPerDollar(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-0.5">Default: 1 point earned per $1 spent</p>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">
                Redemption Value per Point ($)
              </label>
              <input
                type="number"
                step="0.005"
                value={dollarPerPoint}
                onChange={(e) => setDollarPerPoint(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-0.5">e.g. $0.05 = 100 points worth $5.00</p>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">
                Points Expiration (Months)
              </label>
              <input
                type="number"
                value={expiryMonths}
                onChange={(e) => setExpiryMonths(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-0.5">Inactivity period before unused points expire</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingRules(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold shadow-xs hover:opacity-90"
            >
              Save Program Rules
            </button>
          </div>
        </form>
      )}

      {/* POS Simulator Card & Formula Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Register POS Purchase &amp; Award Points
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Idempotency Protected
            </span>
          </div>

          <form onSubmit={handleRecordPurchase} className="space-y-4 text-xs">
            {/* Customer Picker */}
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Select Member / Customer *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                {customers.map((c) => {
                  const t = loyaltyService.getTierById(c.tierId);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({t.name} - {c.pointsBalance} pts) - {c.email}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Branch & Campaign */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Store / Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Active Promotional Campaign
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                >
                  <option value="">No Active Campaign (Standard)</option>
                  {campaigns.map((cmp) => (
                    <option key={cmp.id} value={cmp.id}>
                      {cmp.name} ({cmp.bonusMultiplier}x Bonus)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Purchase Amount & Invoice Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Order / Purchase Amount ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Invoice / Receipt # (Idempotency Key)
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Transaction Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. In-store register #2, cashier Alex"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Transaction...' : `Confirm & Award ${calcResult.totalPoints} Points`}</span>
            </button>
          </form>
        </div>

        {/* Right: Live Calculation Formula Preview */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-900 border border-zinc-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                Points Calculation Engine
              </span>
              <Calculator className="w-4 h-4 text-emerald-400" />
            </div>

            {currentCustomer ? (
              <div className="mt-4 space-y-4">
                {/* Member Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{currentCustomer.fullName}</div>
                    <div className="text-[11px] text-zinc-400">{currentTier.name}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-zinc-400">Current Balance</span>
                    <div className="text-base font-mono font-bold text-zinc-100">
                      {currentCustomer.pointsBalance.toLocaleString()} pts
                    </div>
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Base Points (${amountNum.toFixed(2)} @ {business.pointsPerCurrency} pt/$)</span>
                    <span className="font-mono text-zinc-200">{calcResult.basePoints} pts</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>VIP Tier Accelerator ({currentTier.name})</span>
                    <span className="font-mono text-zinc-200">× {calcResult.tierMultiplier}x</span>
                  </div>
                  {calcResult.campaignMultiplier > 1 && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Active Campaign Bonus Multiplier</span>
                      <span className="font-mono">× {calcResult.campaignMultiplier}x</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between font-semibold">
                    <span className="text-white">Total Points to Award</span>
                    <span className="text-base font-mono text-emerald-400">
                      +{calcResult.totalPoints.toLocaleString()} pts
                    </span>
                  </div>
                </div>

                {/* Projected New Balance */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Projected Balance After Transaction</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {balanceAfter.toLocaleString()} pts
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Select a customer to view live calculation
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ledger entries are cryptographically stamped and synchronized across Firestore.</span>
          </div>
        </div>
      </div>

      {/* Points Ledger Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Immutable Transaction Ledger
            </h3>
            <p className="text-xs text-zinc-400">Full audit log of points issued, redeemed, or adjusted</p>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search member, invoice..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="EARNED">EARNED</option>
              <option value="REDEEMED">REDEEMED</option>
              <option value="BONUS">BONUS</option>
              <option value="REFERRAL">REFERRAL</option>
              <option value="ADJUSTED">ADJUSTED</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="pb-2.5 px-2">Tx ID / Invoice</th>
                <th className="pb-2.5 px-2">Member</th>
                <th className="pb-2.5 px-2">Type</th>
                <th className="pb-2.5 px-2 text-right">Points</th>
                <th className="pb-2.5 px-2 text-right">Balance After</th>
                <th className="pb-2.5 px-3">Description</th>
                <th className="pb-2.5 px-2 text-right">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-zinc-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors">
                    <td className="py-2.5 px-2 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {tx.invoiceNumber || tx.id.slice(0, 12)}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {tx.customerName}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.type === 'EARNED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : tx.type === 'REDEEMED'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : tx.type === 'REFERRAL'
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                            : tx.type === 'BONUS'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold whitespace-nowrap">
                      <span className={tx.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {tx.balanceAfter.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-300 text-[11px] max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="py-2.5 px-2 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
