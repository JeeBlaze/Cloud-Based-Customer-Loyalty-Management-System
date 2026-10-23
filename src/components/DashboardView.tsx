import React, { useState } from 'react';
import {
  Users,
  Coins,
  Gift,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Download,
  Calendar,
  Plus,
  ShieldAlert,
  Crown,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { Customer, LoyaltyTier, PointTransaction } from '../types';

interface DashboardViewProps {
  onOpenRecordPurchase: () => void;
  onOpenAddCustomer: () => void;
  onOpenCreateReward: () => void;
  onSelectCustomer: (customerId: string) => void;
  setActiveView: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenRecordPurchase,
  onOpenAddCustomer,
  onOpenCreateReward,
  onSelectCustomer,
  setActiveView,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const business = loyaltyService.getBusiness();
  const customers = loyaltyService.getCustomers();
  const tiers = loyaltyService.getTiers();
  const transactions = loyaltyService.getTransactions();
  const rewards = loyaltyService.getRewards();
  const redemptions = loyaltyService.getRedemptions();

  // Calculations
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === 'ACTIVE').length;
  const activePercent = totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0;

  const repeatCustomers = customers.filter((c) => c.purchaseCount > 1).length;
  const repeatPurchaseRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  const totalPointsIssued = transactions
    .filter((t) => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0);

  const totalPointsRedeemed = Math.abs(
    transactions
      .filter((t) => t.points < 0 && t.type === 'REDEEMED')
      .reduce((sum, t) => sum + t.points, 0)
  );

  const redemptionRate =
    totalPointsIssued > 0 ? Math.round((totalPointsRedeemed / totalPointsIssued) * 100) : 0;

  // Outstanding points in customer accounts
  const totalOutstandingPoints = customers.reduce((sum, c) => sum + c.pointsBalance, 0);
  const outstandingLiabilityDollars = totalOutstandingPoints * (business.currencyPerPoint || 0.05);

  // Monthly chart data (mock aggregated)
  const monthlyData = [
    { month: 'Jun', earned: 32000, redeemed: 12000 },
    { month: 'Jul', earned: 41000, redeemed: 19500 },
    { month: 'Aug', earned: 48500, redeemed: 24000 },
    { month: 'Sep', earned: 54000, redeemed: 28000 },
    { month: 'Oct', earned: 62400, redeemed: 34100 },
    { month: 'Nov (Proj)', earned: 71000, redeemed: 39000 },
  ];

  // Tier distribution
  const tierCounts: { [tierId: string]: number } = {};
  customers.forEach((c) => {
    tierCounts[c.tierId] = (tierCounts[c.tierId] || 0) + 1;
  });

  const exportCSV = () => {
    const headers = ['Transaction ID', 'Customer Name', 'Customer Email', 'Type', 'Points', 'Balance After', 'Date', 'Description'];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.customerName}"`,
      t.customerEmail,
      t.type,
      t.points,
      t.balanceAfter,
      t.createdAt,
      `"${t.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auraloyalty_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Loyalty Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time customer engagement, points liability, and redemption performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeRange === r
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {r === 'all' ? 'All Time' : `Last ${r.toUpperCase()}`}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-medium">Total Members</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {totalCustomers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>{activePercent}% active accounts</span>
            </div>
          </div>
        </div>

        {/* Total Points Issued */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-medium">Points Issued</span>
            <Coins className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {totalPointsIssued.toLocaleString()} <span className="text-xs font-normal text-zinc-400">pts</span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Equiv. ${(totalPointsIssued * business.currencyPerPoint).toLocaleString(undefined, { minimumFractionDigits: 2 })} value
            </div>
          </div>
        </div>

        {/* Points Redeemed & Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-medium">Points Redeemed</span>
            <Gift className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {totalPointsRedeemed.toLocaleString()} <span className="text-xs font-normal text-zinc-400">pts</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">{redemptionRate}%</span> redemption velocity
            </div>
          </div>
        </div>

        {/* Outstanding Liability */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-medium">Point Liability ($)</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              ${outstandingLiabilityDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              {totalOutstandingPoints.toLocaleString()} unredeemed pts in wallets
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs">
        <div>
          <div className="text-zinc-500 text-[11px]">Repeat Purchase Rate</div>
          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">{repeatPurchaseRate}%</div>
        </div>
        <div>
          <div className="text-zinc-500 text-[11px]">Active Rewards</div>
          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">{rewards.length} catalog perks</div>
        </div>
        <div>
          <div className="text-zinc-500 text-[11px]">Total Redemptions</div>
          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">{redemptions.length} claimed vouchers</div>
        </div>
        <div>
          <div className="text-zinc-500 text-[11px]">Points Earning Policy</div>
          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">{business.pointsPerCurrency} pt / $1 (12 Mo Exp)</div>
        </div>
      </div>

      {/* Charts Section: Monthly Velocity & Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Points Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Points Velocity & Flow
              </h3>
              <p className="text-xs text-zinc-400">Points earned vs redeemed monthly</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100"></span>
                <span className="text-zinc-600 dark:text-zinc-400">Earned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                <span className="text-zinc-600 dark:text-zinc-400">Redeemed</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Visualizer */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-zinc-100 dark:border-zinc-800">
            {monthlyData.map((d, idx) => {
              const maxVal = 80000;
              const earnedH = Math.max(10, Math.round((d.earned / maxVal) * 180));
              const redeemedH = Math.max(6, Math.round((d.redeemed / maxVal) * 180));
              const isHovered = hoveredMonth === idx;

              return (
                <div
                  key={d.month}
                  onMouseEnter={() => setHoveredMonth(idx)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer relative"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 bg-zinc-950 text-white text-[11px] py-1 px-2.5 rounded-lg shadow-md whitespace-nowrap z-10 pointer-events-none">
                      <div>Earned: {d.earned.toLocaleString()} pts</div>
                      <div>Redeemed: {d.redeemed.toLocaleString()} pts</div>
                    </div>
                  )}

                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    {/* Earned Bar */}
                    <div
                      style={{ height: `${earnedH}px` }}
                      className="w-1/2 max-w-[24px] bg-zinc-900 dark:bg-zinc-100 rounded-t-sm transition-all group-hover:opacity-90"
                    />
                    {/* Redeemed Bar */}
                    <div
                      style={{ height: `${redeemedH}px` }}
                      className="w-1/2 max-w-[24px] bg-zinc-300 dark:bg-zinc-700 rounded-t-sm transition-all group-hover:opacity-90"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-500">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier Distribution Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                VIP Tier Members
              </h3>
              <button
                onClick={() => setActiveView('tiers')}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center"
              >
                Configure <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4">Distribution of customers across tiers</p>

            <div className="space-y-3">
              {tiers.map((tier) => {
                const count = tierCounts[tier.id] || 0;
                const pct = totalCustomers > 0 ? Math.round((count / totalCustomers) * 100) : 0;
                return (
                  <div key={tier.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tier.color }}
                        />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{tier.name}</span>
                        <span className="text-[10px] text-zinc-400">({tier.multiplier}x)</span>
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-300 font-semibold">
                        {count} <span className="text-[10px] text-zinc-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    {/* Progress Track */}
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: tier.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>VIP Upgrade Threshold</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">$3,500 / 3.5k pts</span>
          </div>
        </div>
      </div>

      {/* Quick Launch & Recent Transaction Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="p-5 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-900 border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white mb-1">
              Loyalty Operations
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Instant shortcuts to run frequent loyalty counter actions
            </p>

            <div className="space-y-2">
              <button
                onClick={onOpenRecordPurchase}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-xs font-medium text-zinc-100 transition-colors border border-zinc-800"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <div className="font-semibold">POS: Award Points for Purchase</div>
                    <div className="text-[10px] text-zinc-400">Calculate points with tier & campaign bonuses</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={onOpenAddCustomer}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-xs font-medium text-zinc-100 transition-colors border border-zinc-800"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-sky-400" />
                  <div className="text-left">
                    <div className="font-semibold">Enroll New Member</div>
                    <div className="text-[10px] text-zinc-400">Generate referral code and welcome points</div>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={onOpenCreateReward}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-xs font-medium text-zinc-100 transition-colors border border-zinc-800"
              >
                <div className="flex items-center gap-2.5">
                  <Gift className="w-4 h-4 text-purple-400" />
                  <div className="text-left">
                    <div className="font-semibold">Add Catalog Reward</div>
                    <div className="text-[10px] text-zinc-400">Discounts, free products, cashback credits</div>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Current Branch</span>
            <span className="text-zinc-200 font-medium">SF Flagship (Default)</span>
          </div>
        </div>

        {/* Recent Ledger Activity */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Live Points Ledger
              </h3>
              <p className="text-xs text-zinc-400">Real-time immutable audit trail</p>
            </div>
            <button
              onClick={() => setActiveView('points-engine')}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center font-medium"
            >
              Full Ledger ({transactions.length}) <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-2">Member</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Points</th>
                  <th className="pb-2 text-right">New Balance</th>
                  <th className="pb-2 pl-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition-colors">
                    <td className="py-2.5">
                      <button
                        onClick={() => {
                          onSelectCustomer(t.customerId);
                          setActiveView('customers');
                        }}
                        className="text-left font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
                      >
                        {t.customerName}
                      </button>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[160px]">{t.description}</div>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.type === 'EARNED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : t.type === 'REDEEMED'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : t.type === 'REFERRAL'
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold">
                      <span className={t.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                        {t.points > 0 ? `+${t.points}` : t.points}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {t.balanceAfter.toLocaleString()}
                    </td>
                    <td className="py-2.5 pl-4 text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
