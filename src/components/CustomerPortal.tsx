import React, { useState } from 'react';
import {
  Smartphone,
  QrCode,
  Coins,
  Crown,
  Gift,
  Share2,
  Copy,
  CheckCircle2,
  Bell,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  User,
  ShoppingBag,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { Customer, Reward, Redemption } from '../types';

interface CustomerPortalProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onExitPortal: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onShowToast, onExitPortal }) => {
  const customers = loyaltyService.getCustomers();
  const tiers = loyaltyService.getTiers();
  const rewards = loyaltyService.getRewards();
  const redemptions = loyaltyService.getRedemptions();
  const transactions = loyaltyService.getTransactions();
  const business = loyaltyService.getBusiness();

  // Active customer in portal simulation
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [portalTab, setPortalTab] = useState<'pass' | 'rewards' | 'vouchers' | 'history' | 'profile'>('pass');
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

  const customer = loyaltyService.getCustomerById(selectedCustomerId) || customers[0];
  const tier = customer ? loyaltyService.getTierById(customer.tierId) : tiers[0];

  // Next tier calculation
  const currentRank = tier.rank;
  const nextTier = tiers.find((t) => t.rank === currentRank + 1);
  const pointsToNext = nextTier ? Math.max(0, nextTier.minPoints - customer.lifetimePoints) : 0;
  const spendToNext = nextTier ? Math.max(0, nextTier.minSpend - customer.totalSpent) : 0;
  const progressPct = nextTier
    ? Math.min(100, Math.round((customer.lifetimePoints / nextTier.minPoints) * 100))
    : 100;

  // Customer vouchers & ledger
  const myRedemptions = redemptions.filter((r) => r.customerId === customer?.id);
  const activeVouchers = myRedemptions.filter((r) => r.status === 'ACTIVE');
  const pastVouchers = myRedemptions.filter((r) => r.status !== 'ACTIVE');

  const myTransactions = transactions.filter((t) => t.customerId === customer?.id);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('Copied', `${label} copied to clipboard`, 'info');
  };

  const handleRedeem = async (reward: Reward) => {
    if (!customer) return;
    setIsRedeeming(reward.id);
    try {
      const res = await loyaltyService.redeemReward({
        customerId: customer.id,
        rewardId: reward.id,
      });

      onShowToast(
        'Voucher Generated!',
        `Your voucher ${res.redemption.couponCode} is ready in "My Vouchers"`,
        'success'
      );
      setPortalTab('vouchers');
    } catch (err: any) {
      onShowToast('Redemption Failed', err.message, 'error');
    } finally {
      setIsRedeeming(null);
    }
  };

  if (!customer) {
    return <div className="p-8 text-center text-zinc-500">No customer profiles available.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Portal Top Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Member Portal Preview</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Customer View
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive preview of how {customer.fullName} experiences their loyalty club
            </p>
          </div>
        </div>

        {/* Switch Persona */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-transparent border-none text-xs text-zinc-200 outline-none cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  Switch: {c.fullName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onExitPortal}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors"
          >
            Return to Admin
          </button>
        </div>
      </div>

      {/* Portal Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs">
        {[
          { id: 'pass', label: 'My VIP Pass', icon: CreditCard },
          { id: 'rewards', label: 'Browse Rewards', icon: Gift },
          {
            id: 'vouchers',
            label: `My Vouchers (${activeVouchers.length})`,
            icon: Sparkles,
          },
          { id: 'history', label: 'Point History', icon: Clock },
          { id: 'profile', label: 'Referrals & Profile', icon: Share2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = portalTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setPortalTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VIP PASS & DIGITAL WALLET CARD */}
      {portalTab === 'pass' && (
        <div className="space-y-6">
          {/* Apple Wallet Style Digital Loyalty Card */}
          <div className="relative rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 shadow-2xl overflow-hidden">
            {/* Subtle background glow */}
            <div
              className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: tier.color }}
            />

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-widest font-extrabold text-zinc-400">
                    {business.name}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${tier.color}30`,
                      color: tier.color,
                      border: `1px solid ${tier.color}60`,
                    }}
                  >
                    {tier.name}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                  {customer.fullName}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Accelerator</span>
                <div className="font-mono text-xl font-bold text-emerald-400">
                  {tier.multiplier}x Points
                </div>
              </div>
            </div>

            {/* Middle: Available Balance */}
            <div className="mb-8 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                  Available Loyalty Points
                </div>
                <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-white mt-0.5">
                  {customer.pointsBalance.toLocaleString()}
                  <span className="text-base font-normal text-zinc-400 ml-2">pts</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Redeemable for up to ${(customer.pointsBalance * business.currencyPerPoint).toFixed(2)} in store credit
                </div>
              </div>

              {/* Scannable Barcode & QR Block */}
              <div className="bg-white p-3 rounded-2xl shadow-inner flex flex-col items-center gap-1.5 self-start sm:self-auto">
                <div className="h-10 flex items-center gap-0.5 bg-white">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-full ${
                        i % 4 === 0
                          ? 'w-1.5 bg-black'
                          : i % 3 === 0
                          ? 'w-0.5 bg-black'
                          : i % 2 === 0
                          ? 'w-1 bg-black'
                          : 'w-0.5 bg-black'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] font-bold text-zinc-900 tracking-wider">
                  {customer.referralCode}
                </span>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400 relative z-10">
              <div>
                Member since {new Date(customer.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <span>Personal Referral Code:</span>
                <span className="font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
                  {customer.referralCode}
                </span>
                <button
                  onClick={() => copyText(customer.referralCode, 'Referral code')}
                  className="p-1 hover:text-white transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tier Progression Tracker */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  VIP Tier Status &amp; Progress
                </h3>
                <p className="text-xs text-zinc-400">
                  {nextTier
                    ? `${pointsToNext.toLocaleString()} points or $${spendToNext.toFixed(2)} spend away from ${nextTier.name}`
                    : 'You have achieved our highest loyalty status: Platinum Luminary!'}
                </p>
              </div>
              <Crown className="w-5 h-5 text-amber-500" />
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-zinc-900 dark:bg-zinc-100"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 pt-0.5">
                <span>{tier.name}</span>
                <span>{progressPct}% to {nextTier ? nextTier.name : 'Max Tier'}</span>
              </div>
            </div>

            {/* Active Tier Perks List */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">
                Your Current Exclusive Privileges
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {tier.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-850">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-zinc-700 dark:text-zinc-300">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BROWSE REWARDS CATALOG */}
      {portalTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Redeem Loyalty Points
              </h2>
              <p className="text-xs text-zinc-400">
                Your Balance: <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{customer.pointsBalance} pts</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => {
              const reqTier = loyaltyService.getTierById(reward.minTier);
              const canAfford = customer.pointsBalance >= reward.pointsCost;
              const hasTier = tier.rank >= reqTier.rank;
              const isEligible = canAfford && hasTier && reward.stock > 0;

              return (
                <div
                  key={reward.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {reqTier.name}+ Required
                      </span>
                      <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {reward.pointsCost} pts
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">{reward.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{reward.description}</p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!isEligible || isRedeeming === reward.id}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                        isEligible
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 shadow-xs cursor-pointer'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>
                        {isRedeeming === reward.id
                          ? 'Generating Voucher...'
                          : !canAfford
                          ? `Need ${reward.pointsCost - customer.pointsBalance} more points`
                          : !hasTier
                          ? `Unlocked at ${reqTier.name}`
                          : 'Claim Voucher with Points'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MY VOUCHERS */}
      {portalTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              My Active Vouchers &amp; Coupon Codes
            </h2>
            <p className="text-xs text-zinc-400">Present coupon code at store counter or enter during web checkout</p>
          </div>

          {activeVouchers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-3">
              <Gift className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No active vouchers</div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Explore the Rewards tab to redeem points for discount coupons and free products.
              </p>
              <button
                onClick={() => setPortalTab('rewards')}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold"
              >
                Browse Rewards
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Active &amp; Ready
                      </span>
                      <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 mt-1">
                        {v.rewardTitle}
                      </h3>
                    </div>
                  </div>

                  {/* Coupon Code Banner */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider">Coupon Code</span>
                      <div className="font-mono font-extrabold text-base text-zinc-950 dark:text-zinc-50 tracking-wider">
                        {v.couponCode}
                      </div>
                    </div>
                    <button
                      onClick={() => copyText(v.couponCode, 'Coupon code')}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                    <span>Valid until: {new Date(v.expiresAt).toLocaleDateString()}</span>
                    <span>Cost: {v.pointsSpent} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Redemptions */}
          {pastVouchers.length > 0 && (
            <div className="pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                Used &amp; Past Vouchers ({pastVouchers.length})
              </h3>
              <div className="space-y-2">
                {pastVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs opacity-75"
                  >
                    <div>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{v.rewardTitle}</span>
                      <span className="font-mono text-zinc-400 ml-2">#{v.couponCode}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: POINT TRANSACTION HISTORY */}
      {portalTab === 'history' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Personal Points Ledger
              </h2>
              <p className="text-xs text-zinc-400">Complete audit log of all points transactions</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-zinc-400">Lifetime Points</span>
              <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {customer.lifetimePoints.toLocaleString()} pts
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Points</th>
                  <th className="pb-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {myTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                    <td className="py-2.5 text-zinc-400 whitespace-nowrap text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                      {tx.description}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold whitespace-nowrap">
                      <span className={tx.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-zinc-500 whitespace-nowrap">
                      {tx.balanceAfter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REFERRALS & PROFILE */}
      {portalTab === 'profile' && (
        <div className="space-y-6">
          {/* Share Referral Link Card */}
          <div className="p-6 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-900 border border-zinc-800 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-white">
                Invite Friends &amp; Earn 200 Points Each
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
              Give your friends 100 welcome bonus points when they sign up with your unique referral code.
              You will automatically receive 200 points as soon as they complete their first purchase!
            </p>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Your Referral Link</span>
                <div className="font-mono text-xs text-emerald-400 mt-0.5 truncate max-w-md">
                  https://luminarybrands.com/join?ref={customer.referralCode}
                </div>
              </div>
              <button
                onClick={() =>
                  copyText(
                    `https://luminarybrands.com/join?ref=${customer.referralCode}`,
                    'Referral link'
                  )
                }
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors shrink-0"
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Profile & Notifications Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 text-xs">
            <h3 className="font-semibold text-sm text-zinc-950 dark:text-zinc-50">
              Account Information &amp; Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-zinc-400 text-[11px]">Full Name</span>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{customer.fullName}</div>
              </div>
              <div>
                <span className="text-zinc-400 text-[11px]">Email Address</span>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{customer.email}</div>
              </div>
              <div>
                <span className="text-zinc-400 text-[11px]">Phone Number</span>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{customer.phone || 'Not provided'}</div>
              </div>
              <div>
                <span className="text-zinc-400 text-[11px]">Birthday</span>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{customer.birthday || 'Not set'}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">Loyalty &amp; Perk Notifications</div>
                <div className="text-[11px] text-zinc-400">Receive points alerts, tier updates, and birthday bonus notifications</div>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                Enabled
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
