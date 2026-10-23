import React from 'react';
import {
  LayoutDashboard,
  Users,
  Coins,
  Gift,
  Crown,
  Share2,
  Megaphone,
  Store,
  BarChart3,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const customers = loyaltyService.getCustomers();
  const rewards = loyaltyService.getRewards();
  const campaigns = loyaltyService.getCampaigns();
  const activeCampaignsCount = campaigns.filter((c) => c.status === 'ACTIVE').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'customers',
      label: 'Customers & CRM',
      icon: Users,
      badge: customers.length.toString(),
    },
    {
      id: 'points-engine',
      label: 'Points Engine & POS',
      icon: Coins,
      badge: null,
    },
    {
      id: 'rewards',
      label: 'Rewards & Redemptions',
      icon: Gift,
      badge: rewards.length.toString(),
    },
    {
      id: 'tiers',
      label: 'Membership & VIP Tiers',
      icon: Crown,
      badge: '4 Tiers',
    },
    {
      id: 'referrals',
      label: 'Referral Program',
      icon: Share2,
      badge: null,
    },
    {
      id: 'campaigns',
      label: 'Campaigns & Automation',
      icon: Megaphone,
      badge: activeCampaignsCount > 0 ? `${activeCampaignsCount} Active` : null,
    },
    {
      id: 'branches',
      label: 'Stores & Branches',
      icon: Store,
      badge: null,
    },
    {
      id: 'analytics',
      label: 'Reports & Liabilities',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-6 min-h-[calc(100vh-4rem)]">
      <div>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
          Management
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-inherit' : 'text-zinc-400 dark:text-zinc-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                        : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
          Experience
        </p>
        <button
          onClick={() => setActiveView('portal')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
            activeView === 'portal'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white shadow-sm'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-900/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <div className="text-left">
              <div className="font-semibold leading-tight">Customer Portal</div>
              <div className="text-[10px] text-zinc-400">Preview member pass & perks</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Program Summary Pill */}
      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
          <span>Earning Rate</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">1 pt / $1</span>
        </div>
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
          <span>Redemption Rate</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">$0.05 / pt</span>
        </div>
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
          <span>Expiry Policy</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">12 Months</span>
        </div>
      </div>
    </aside>
  );
};
