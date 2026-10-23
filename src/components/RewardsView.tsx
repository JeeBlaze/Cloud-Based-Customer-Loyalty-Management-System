import React, { useState } from 'react';
import {
  Gift,
  Plus,
  QrCode,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Search,
  Filter,
  Percent,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { Reward, RewardType, Redemption } from '../types';

interface RewardsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ onShowToast }) => {
  const business = loyaltyService.getBusiness();
  const tiers = loyaltyService.getTiers();
  const customers = loyaltyService.getCustomers();
  const rewards = loyaltyService.getRewards();
  const redemptions = loyaltyService.getRedemptions();

  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [targetReward, setTargetReward] = useState<Reward | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');

  // POS Coupon Scanner / Validator
  const [verifyCouponCode, setVerifyCouponCode] = useState('');
  const [verifiedRedemption, setVerifiedRedemption] = useState<Redemption | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // New Reward Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardType, setRewardType] = useState<RewardType>('DISCOUNT_PERCENT');
  const [pointsCost, setPointsCost] = useState('500');
  const [discountValue, setDiscountValue] = useState('15');
  const [minTier, setMinTier] = useState('tier_bronze');
  const [stock, setStock] = useState('100');
  const [expiryDays, setExpiryDays] = useState('30');

  const handleVerifyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifiedRedemption(null);
    const code = verifyCouponCode.trim().toUpperCase();
    if (!code) return;

    const found = redemptions.find((r) => r.couponCode === code);
    if (!found) {
      setVerifyError(`Coupon "${code}" not found.`);
      return;
    }
    setVerifiedRedemption(found);
  };

  const handleMarkAsUsed = async () => {
    if (!verifiedRedemption) return;
    setIsValidating(true);
    try {
      const updated = await loyaltyService.markCouponUsed(verifiedRedemption.couponCode);
      setVerifiedRedemption(updated);
      onShowToast(
        'Voucher Redeemed',
        `Coupon ${updated.couponCode} marked as USED for ${updated.customerName}`,
        'success'
      );
    } catch (err: any) {
      setVerifyError(err.message || 'Error processing coupon');
      onShowToast('Redemption Failed', err.message, 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Title required', 'Please provide a reward title', 'error');
      return;
    }

    const newReward: Reward = {
      id: `rew_${Date.now()}`,
      businessId: business.id,
      title: title.trim(),
      description: description.trim(),
      type: rewardType,
      pointsCost: parseInt(pointsCost, 10) || 500,
      discountValue: parseFloat(discountValue) || 10,
      minTier,
      stock: parseInt(stock, 10) || 50,
      redeemedCount: 0,
      expiryDays: parseInt(expiryDays, 10) || 30,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await loyaltyService.saveReward(newReward);
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    onShowToast('Reward Created', `${newReward.title} added to catalog`, 'success');
  };

  const handleRedeemForCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReward || !selectedCustomerId) return;

    try {
      const res = await loyaltyService.redeemReward({
        customerId: selectedCustomerId,
        rewardId: targetReward.id,
      });

      setShowRedeemModal(false);
      onShowToast(
        'Reward Redeemed Successfully',
        `Voucher ${res.redemption.couponCode} generated for ${res.customer.fullName}`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Redemption Failed', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Rewards &amp; Redemptions
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure coupons, perks, vouchers, and verify coupon codes at store registers
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Reward</span>
        </button>
      </div>

      {/* POS Coupon Verification & Scanner Section */}
      <div className="p-5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-900/90 border border-zinc-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold tracking-tight text-white">
                POS Coupon Code Scanner &amp; Redemption Validator
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Enter or scan member voucher code to verify authenticity and mark as USED at checkout
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded self-start md:self-auto">
            Live Register Auth
          </span>
        </div>

        <form onSubmit={handleVerifyCoupon} className="mt-4 flex flex-col sm:flex-row gap-2 max-w-xl">
          <input
            type="text"
            value={verifyCouponCode}
            onChange={(e) => setVerifyCouponCode(e.target.value)}
            placeholder="e.g. AURA-25CR-8891 or AURA-15PC-4421"
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono uppercase text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-colors shrink-0"
          >
            Check Voucher
          </button>
        </form>

        {/* Verification Result */}
        {verifyError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{verifyError}</span>
          </div>
        )}

        {verifiedRedemption && (
          <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  {verifiedRedemption.rewardTitle}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    verifiedRedemption.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {verifiedRedemption.status}
                </span>
              </div>
              <div className="text-xs text-zinc-300">
                Member: <span className="font-semibold text-white">{verifiedRedemption.customerName}</span> | Code:{' '}
                <span className="font-mono text-emerald-400">{verifiedRedemption.couponCode}</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Expires: {new Date(verifiedRedemption.expiresAt).toLocaleDateString()} | Cost:{' '}
                {verifiedRedemption.pointsSpent} pts
              </div>
            </div>

            {verifiedRedemption.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={handleMarkAsUsed}
                disabled={isValidating}
                className="px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isValidating ? 'Redeeming...' : 'Apply & Mark Voucher as USED'}</span>
              </button>
            ) : (
              <div className="text-xs text-zinc-400 italic">
                Voucher already marked as {verifiedRedemption.status} on{' '}
                {new Date(verifiedRedemption.usedAt || verifiedRedemption.expiresAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rewards Catalog Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Active Catalog Perks ({rewards.length})
          </h2>
          <span className="text-xs text-zinc-400">Currency ratio: $0.05 / pt</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const minTierObj = loyaltyService.getTierById(reward.minTier);
            return (
              <div
                key={reward.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${minTierObj.color}15`,
                        color: minTierObj.color,
                        border: `1px solid ${minTierObj.color}35`,
                      }}
                    >
                      {minTierObj.name}+
                    </span>
                    <span className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {reward.pointsCost} pts
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 leading-snug">
                    {reward.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {reward.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                    <span>Stock Remaining</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {reward.stock} units ({reward.redeemedCount} claimed)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                    <span>Voucher Validity</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {reward.expiryDays} days from claim
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setTargetReward(reward);
                        setShowRedeemModal(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Redeem for Member</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Redemptions Log Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Voucher Redemptions History
            </h3>
            <p className="text-xs text-zinc-400">Claimed reward vouchers &amp; coupon status</p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">Total: {redemptions.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="pb-2.5 px-2">Coupon Code</th>
                <th className="pb-2.5 px-2">Reward</th>
                <th className="pb-2.5 px-2">Member</th>
                <th className="pb-2.5 px-2 text-right">Points Cost</th>
                <th className="pb-2.5 px-2 text-center">Status</th>
                <th className="pb-2.5 px-2 text-right">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {redemptions.map((red) => (
                <tr key={red.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                  <td className="py-2.5 px-2 font-mono font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    {red.couponCode}
                  </td>
                  <td className="py-2.5 px-2 font-medium text-zinc-800 dark:text-zinc-200">{red.rewardTitle}</td>
                  <td className="py-2.5 px-2 text-zinc-600 dark:text-zinc-400">{red.customerName}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-zinc-700 dark:text-zinc-300">
                    {red.pointsSpent} pts
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        red.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : red.status === 'USED'
                          ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {red.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-zinc-400 text-[11px]">
                    {new Date(red.expiresAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Reward Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Create Catalog Reward
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Reward Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20% Off Footwear Collection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details and conditions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Reward Type
                  </label>
                  <select
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value as RewardType)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                  >
                    <option value="DISCOUNT_PERCENT">Percentage Discount</option>
                    <option value="DISCOUNT_FIXED">Fixed Store Credit ($)</option>
                    <option value="FREE_PRODUCT">Free Product Gift</option>
                    <option value="GIFT_CARD">Digital Gift Card</option>
                    <option value="CASHBACK">Cashback Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Value ($ or %)
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Points Cost
                  </label>
                  <input
                    type="number"
                    value={pointsCost}
                    onChange={(e) => setPointsCost(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Minimum Tier
                  </label>
                  <select
                    value={minTier}
                    onChange={(e) => setMinTier(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                  >
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Coupon Expiration (Days from claim)
                </label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90"
                >
                  Create Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem For Customer Modal */}
      {showRedeemModal && targetReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Redeem Reward for Member
                </h3>
                <p className="text-xs text-zinc-400">
                  {targetReward.title} ({targetReward.pointsCost} pts)
                </p>
              </div>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRedeemForCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Select Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium focus:outline-none"
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

              {/* Balance Check Info */}
              {(() => {
                const c = loyaltyService.getCustomerById(selectedCustomerId);
                if (!c) return null;
                const t = loyaltyService.getTierById(c.tierId);
                const reqTier = loyaltyService.getTierById(targetReward.minTier);
                const isTierOk = t.rank >= reqTier.rank;
                const isPointsOk = c.pointsBalance >= targetReward.pointsCost;

                return (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Current Balance:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {c.pointsBalance} pts
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Balance After Claim:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {c.pointsBalance - targetReward.pointsCost} pts
                      </span>
                    </div>
                    {(!isTierOk || !isPointsOk) && (
                      <div className="pt-1 text-rose-500 font-semibold text-[11px]">
                        {!isTierOk
                          ? `Requires ${reqTier.name} or higher.`
                          : 'Insufficient points balance.'}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90"
                >
                  Generate Voucher Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
