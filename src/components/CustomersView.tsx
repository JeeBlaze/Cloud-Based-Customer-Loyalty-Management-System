import React, { useState } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Coins,
  QrCode,
  History,
  X,
  Check,
  ChevronRight,
  Gift,
  Share2,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { Customer, CustomerSegment, LoyaltyTier } from '../types';

interface CustomersViewProps {
  onRecordPurchaseForCustomer: (customerId: string) => void;
  selectedCustomerId?: string;
  onSelectCustomer: (customerId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onRecordPurchaseForCustomer,
  selectedCustomerId,
  onSelectCustomer,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAdjustPointsModal, setShowAdjustPointsModal] = useState(false);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState<string>('');
  const [adjustPointsReason, setAdjustPointsReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // New Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustBirthday, setNewCustBirthday] = useState('');
  const [newCustReferredByCode, setNewCustReferredByCode] = useState('');

  const customers = loyaltyService.getCustomers();
  const tiers = loyaltyService.getTiers();
  const transactions = loyaltyService.getTransactions();
  const redemptions = loyaltyService.getRedemptions();

  // If selectedCustomerId is provided from outside, set activeCustomer on load
  React.useEffect(() => {
    if (selectedCustomerId) {
      const found = loyaltyService.getCustomerById(selectedCustomerId);
      if (found) setActiveCustomer(found);
    }
  }, [selectedCustomerId]);

  // Filtering
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.referralCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier = tierFilter === 'all' || c.tierId === tierFilter;
    const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter;

    return matchesSearch && matchesTier && matchesSegment;
  });

  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    const delta = parseInt(adjustPointsDelta, 10);
    if (isNaN(delta) || delta === 0) {
      onShowToast('Invalid points', 'Please enter a valid non-zero points adjustment', 'error');
      return;
    }
    if (!adjustPointsReason.trim()) {
      onShowToast('Reason required', 'An audit reason is required for points adjustments', 'error');
      return;
    }

    setIsAdjusting(true);
    try {
      const result = await loyaltyService.adjustPoints({
        customerId: activeCustomer.id,
        pointsDelta: delta,
        reason: adjustPointsReason.trim(),
      });
      setActiveCustomer(result.customer);
      setShowAdjustPointsModal(false);
      setAdjustPointsDelta('');
      setAdjustPointsReason('');
      onShowToast(
        'Points Adjusted',
        `Successfully ${delta > 0 ? 'added' : 'deducted'} ${Math.abs(delta)} points for ${activeCustomer.fullName}`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Adjustment Failed', err.message || 'Error adjusting points', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustEmail.trim()) {
      onShowToast('Required fields missing', 'Please enter both name and email', 'error');
      return;
    }

    try {
      if (newCustReferredByCode.trim()) {
        const result = await loyaltyService.processReferral({
          referrerCode: newCustReferredByCode.trim(),
          newCustomerName: newCustName.trim(),
          newCustomerEmail: newCustEmail.trim(),
          newCustomerPhone: newCustPhone.trim(),
        });
        setActiveCustomer(result.customer);
        onShowToast(
          'Customer Enrolled via Referral',
          `${newCustName} enrolled! Both referrer and referee received bonus points.`,
          'success'
        );
      } else {
        const refCode = `${newCustName.split(' ')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const customer = await loyaltyService.addCustomer({
          businessId: loyaltyService.getBusiness().id,
          fullName: newCustName.trim(),
          email: newCustEmail.trim(),
          phone: newCustPhone.trim(),
          birthday: newCustBirthday,
          tierId: 'tier_bronze',
          referralCode: refCode,
          segment: 'NEW_MEMBER',
          status: 'ACTIVE',
          notificationsEnabled: true,
        });
        setActiveCustomer(customer);
        onShowToast('Customer Enrolled', `${newCustName} has been enrolled in the loyalty program.`, 'success');
      }

      setShowAddCustomerModal(false);
      setNewCustName('');
      setNewCustEmail('');
      setNewCustPhone('');
      setNewCustBirthday('');
      setNewCustReferredByCode('');
    } catch (err: any) {
      onShowToast('Enrollment Failed', err.message || 'Could not register customer', 'error');
    }
  };

  // Customer transactions & vouchers
  const activeCustomerTransactions = activeCustomer
    ? transactions.filter((t) => t.customerId === activeCustomer.id)
    : [];

  const activeCustomerRedemptions = activeCustomer
    ? redemptions.filter((r) => r.customerId === activeCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Customers &amp; CRM
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Member profiles, tiers, segment analytics, and digital loyalty pass generator
          </p>
        </div>

        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Enroll Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, phone, or code..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        {/* Tier Filter */}
        <div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none"
          >
            <option value="all">All Tiers ({tiers.length})</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Segment Filter */}
        <div>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none"
          >
            <option value="all">All Segments</option>
            <option value="VIP">VIP</option>
            <option value="HIGH_VALUE">High Value</option>
            <option value="FREQUENT_SHOPPER">Frequent Shopper</option>
            <option value="AT_RISK">At Risk</option>
            <option value="NEW_MEMBER">New Member</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-850/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3">Segment</th>
                <th className="py-3 px-3 text-right">Points Balance</th>
                <th className="py-3 px-3 text-right">Total Spent</th>
                <th className="py-3 px-3 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No customers match the current filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const tier = loyaltyService.getTierById(cust.tierId);
                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-850/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setActiveCustomer(cust);
                        onSelectCustomer(cust.id);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {cust.avatarUrl ? (
                            <img
                              src={cust.avatarUrl}
                              alt={cust.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                              {cust.fullName[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>{cust.fullName}</span>
                              <span className="font-mono text-[10px] text-zinc-400">#{cust.referralCode}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate">{cust.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: `${tier.color}15`,
                            color: tier.color,
                            border: `1px solid ${tier.color}35`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: tier.color }}
                          />
                          {tier.name}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {cust.segment.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {cust.pointsBalance.toLocaleString()} <span className="text-[10px] text-zinc-400 font-normal">pts</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {cust.lifetimePoints.toLocaleString()} lifetime
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-medium text-zinc-800 dark:text-zinc-200">
                        ${cust.totalSpent.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-zinc-700 dark:text-zinc-300">
                        {cust.purchaseCount}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onRecordPurchaseForCustomer(cust.id)}
                            title="Award Points for Purchase"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setActiveCustomer(cust);
                              setShowAdjustPointsModal(true);
                            }}
                            title="Adjust Points Balance"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                          >
                            <Coins className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setActiveCustomer(cust);
                              onSelectCustomer(cust.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {activeCustomer && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-950 h-full shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeCustomer.avatarUrl ? (
                  <img
                    src={activeCustomer.avatarUrl}
                    alt={activeCustomer.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                    {activeCustomer.fullName[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-zinc-950 dark:text-zinc-50 text-base leading-tight">
                    {activeCustomer.fullName}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Enrolled {new Date(activeCustomer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCustomer(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Virtual Loyalty Card Card */}
              {(() => {
                const tier = loyaltyService.getTierById(activeCustomer.tierId);
                return (
                  <div className="relative rounded-2xl p-5 text-white bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 shadow-lg overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <QrCode className="w-32 h-32" />
                    </div>

                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                          Aura VIP Pass
                        </div>
                        <div className="text-xl font-bold tracking-tight text-white mt-0.5">
                          {tier.name}
                        </div>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
                        style={{ backgroundColor: `${tier.color}30`, color: tier.color, border: `1px solid ${tier.color}50` }}
                      >
                        {tier.multiplier}x Multiplier
                      </span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                          Points Available
                        </div>
                        <div className="text-2xl font-mono font-bold tracking-tight text-white">
                          {activeCustomer.pointsBalance.toLocaleString()}{' '}
                          <span className="text-xs font-normal text-zinc-400">pts</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1">
                          Equiv. ${(activeCustomer.pointsBalance * loyaltyService.getBusiness().currencyPerPoint).toFixed(2)} store credit
                        </div>
                      </div>

                      {/* Barcode Mock */}
                      <div className="flex flex-col items-center">
                        <div className="h-7 flex items-center gap-0.5 bg-white p-1 rounded-sm">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <span
                              key={i}
                              className={`h-full ${i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-1.5 bg-black'}`}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[9px] text-zinc-400 mt-1">
                          {activeCustomer.referralCode}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onRecordPurchaseForCustomer(activeCustomer.id)}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Award Points</span>
                </button>
                <button
                  onClick={() => setShowAdjustPointsModal(true)}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Adjust Points</span>
                </button>
              </div>

              {/* Customer Info Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-400 text-[11px]">Email</span>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{activeCustomer.email}</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px]">Phone</span>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">{activeCustomer.phone || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px]">Lifetime Spend</span>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">${activeCustomer.totalSpent.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px]">Completed Orders</span>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">{activeCustomer.purchaseCount} purchases</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px]">Referral Code</span>
                  <div className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{activeCustomer.referralCode}</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px]">Birthday</span>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">{activeCustomer.birthday || 'Not set'}</div>
                </div>
              </div>

              {/* Claimed Coupons / Active Vouchers */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Claimed Vouchers ({activeCustomerRedemptions.length})
                </h4>
                {activeCustomerRedemptions.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                    No active rewards claimed yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeCustomerRedemptions.map((red) => (
                      <div
                        key={red.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{red.rewardTitle}</div>
                          <div className="font-mono text-[11px] text-zinc-500 mt-0.5">Code: {red.couponCode}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            red.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {red.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Points Ledger */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Points History ({activeCustomerTransactions.length})
                </h4>
                {activeCustomerTransactions.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                    No transactions recorded for this customer.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeCustomerTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-zinc-800 dark:text-zinc-200">{tx.description}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold ${
                              tx.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                            }`}
                          >
                            {tx.points > 0 ? `+${tx.points}` : tx.points}
                          </span>
                          <div className="text-[10px] text-zinc-400">{tx.balanceAfter} bal</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjust Points Modal */}
      {showAdjustPointsModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Adjust Points Balance
                </h3>
                <p className="text-xs text-zinc-400">
                  Target: {activeCustomer.fullName} (Current: {activeCustomer.pointsBalance} pts)
                </p>
              </div>
              <button
                onClick={() => setShowAdjustPointsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Points Delta (e.g. +250 or -100)
                </label>
                <input
                  type="number"
                  required
                  placeholder="+200 or -50"
                  value={adjustPointsDelta}
                  onChange={(e) => setAdjustPointsDelta(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Adjustment (Audit Requirement)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Goodwill customer service compensation, manual tier bonus"
                  value={adjustPointsReason}
                  onChange={(e) => setAdjustPointsReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustPointsModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90"
                >
                  {isAdjusting ? 'Processing...' : 'Apply Points Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Enroll New Loyalty Member
                </h3>
                <p className="text-xs text-zinc-400">Add profile to generate loyalty account</p>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Julian Hayes"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="julian@example.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Birthday (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={newCustBirthday}
                    onChange={(e) => setNewCustBirthday(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Referred by Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SOPHIA-VIP"
                  value={newCustReferredByCode}
                  onChange={(e) => setNewCustReferredByCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  If provided, awards +100 welcome points to member and +200 points to referrer.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90"
                >
                  Enroll Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
