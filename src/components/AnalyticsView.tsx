import React from 'react';
import {
  BarChart3,
  Download,
  ShieldAlert,
  TrendingUp,
  Coins,
  Percent,
  Calendar,
  Layers,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';

interface AnalyticsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onShowToast }) => {
  const business = loyaltyService.getBusiness();
  const customers = loyaltyService.getCustomers();
  const transactions = loyaltyService.getTransactions();
  const rewards = loyaltyService.getRewards();
  const redemptions = loyaltyService.getRedemptions();
  const tiers = loyaltyService.getTiers();

  const totalPoints = customers.reduce((sum, c) => sum + c.pointsBalance, 0);
  const totalLiabilityDollars = totalPoints * (business.currencyPerPoint || 0.05);

  const totalIssued = transactions
    .filter((t) => t.points > 0)
    .reduce((s, t) => s + t.points, 0);

  const totalRedeemed = Math.abs(
    transactions
      .filter((t) => t.points < 0 && t.type === 'REDEEMED')
      .reduce((s, t) => s + t.points, 0)
  );

  const avgClv = customers.length > 0
    ? (customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length).toFixed(2)
    : '0.00';

  // Export full financial audit report
  const handleExportFullReport = () => {
    const headers = [
      'Customer ID',
      'Full Name',
      'Email',
      'Tier',
      'Segment',
      'Points Balance',
      'Liability ($)',
      'Total Spend ($)',
      'Orders Count',
      'Last Purchase Date',
    ];

    const rows = customers.map((c) => {
      const t = loyaltyService.getTierById(c.tierId);
      const liab = (c.pointsBalance * business.currencyPerPoint).toFixed(2);
      return [
        c.id,
        `"${c.fullName}"`,
        c.email,
        t.name,
        c.segment,
        c.pointsBalance,
        liab,
        c.totalSpent.toFixed(2),
        c.purchaseCount,
        c.lastPurchaseDate || 'N/A',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auraloyalty_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('Report Exported', 'Full financial liability CSV downloaded', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Reports &amp; Financial Analytics
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Points liability balance sheet, Customer Lifetime Value (CLV), and retention cohorts
          </p>
        </div>

        <button
          onClick={handleExportFullReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Financial Audit CSV</span>
        </button>
      </div>

      {/* Financial Liability Ledger Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-900 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Outstanding Point Liability</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight font-mono text-white mt-2">
            ${totalLiabilityDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Backed by {totalPoints.toLocaleString()} unredeemed member points @ ${business.currencyPerPoint}/pt
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Average Customer Lifetime Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight font-mono text-zinc-950 dark:text-zinc-50 mt-2">
            ${avgClv}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Across {customers.length} enrolled loyalty profiles
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Redemption Velocity Rate</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight font-mono text-zinc-950 dark:text-zinc-50 mt-2">
            {totalIssued > 0 ? Math.round((totalRedeemed / totalIssued) * 100) : 0}%
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {totalRedeemed.toLocaleString()} redeemed vs {totalIssued.toLocaleString()} issued
          </div>
        </div>
      </div>

      {/* CLV By Membership Tier */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Customer Lifetime Value &amp; Liability by VIP Tier
          </h3>
          <p className="text-xs text-zinc-400">Financial exposure and spending patterns per tier segment</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="pb-2.5 px-3">Tier</th>
                <th className="pb-2.5 px-3 text-center">Members</th>
                <th className="pb-2.5 px-3 text-right">Total Tier Spend</th>
                <th className="pb-2.5 px-3 text-right">Avg Spend / Member</th>
                <th className="pb-2.5 px-3 text-right">Points in Wallets</th>
                <th className="pb-2.5 px-3 text-right">Dollar Liability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tiers.map((tier) => {
                const members = customers.filter((c) => c.tierId === tier.id);
                const count = members.length;
                const spend = members.reduce((s, c) => s + c.totalSpent, 0);
                const pts = members.reduce((s, c) => s + c.pointsBalance, 0);
                const liab = pts * business.currencyPerPoint;
                const avgSpend = count > 0 ? spend / count : 0;

                return (
                  <tr key={tier.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                    <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
                      <span>{tier.name}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-zinc-700 dark:text-zinc-300">
                      {count}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      ${spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-950 dark:text-zinc-50">
                      ${avgSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {pts.toLocaleString()} pts
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      ${liab.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retention Cohort & Expiration Forecast Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Retention Cohort */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Repeat Purchase &amp; Retention Cohorts
          </h3>
          <p className="text-xs text-zinc-400">Customer repurchase probability following enrollment</p>

          <div className="space-y-2 text-xs pt-2">
            <div>
              <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                <span>Month 1 (Immediate Repurchase)</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">68%</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                <span>Month 3 (Quarterly Retention)</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">52%</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-700 dark:bg-zinc-300 rounded-full" style={{ width: '52%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                <span>Month 6 (Mid-Year Loyalty)</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">44%</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-500 dark:bg-zinc-500 rounded-full" style={{ width: '44%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Expiration Forecast */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Points Expiration Forecast (12 Month Rolling)
          </h3>
          <p className="text-xs text-zinc-400">Points projected to expire due to account inactivity</p>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
              <span>Next 30 Days Expirations:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">820 pts ($41.00)</span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
              <span>Next 90 Days Expirations:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">3,400 pts ($170.00)</span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
              <span>Automated Reminder Campaign:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Scheduled 14d prior</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
