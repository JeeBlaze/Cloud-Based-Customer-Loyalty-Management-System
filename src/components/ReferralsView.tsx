import React, { useState } from 'react';
import {
  Share2,
  Users,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  Copy,
  Plus,
  Send,
  Sparkles,
  Link,
  ShieldCheck,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { Customer } from '../types';

interface ReferralsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReferralsView: React.FC<ReferralsViewProps> = ({ onShowToast }) => {
  const referrals = loyaltyService.getReferrals();
  const customers = loyaltyService.getCustomers();

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedCust = loyaltyService.getCustomerById(selectedCustomerId);
  const referralLink = selectedCust
    ? `https://luminarybrands.com/vip-join?ref=${selectedCust.referralCode}`
    : '';

  // Statistics
  const totalInvites = referrals.length;
  const rewardedReferrals = referrals.filter((r) => r.status === 'REWARDED').length;
  const pendingReferrals = referrals.filter((r) => r.status === 'PENDING').length;
  const conversionRate = totalInvites > 0 ? Math.round((rewardedReferrals / totalInvites) * 100) : 0;
  const pointsPaidOut = referrals.reduce(
    (sum, r) => sum + r.referrerRewardPoints + r.refereeRewardPoints,
    0
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('Copied to Clipboard', text, 'info');
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || !inviteEmail.trim() || !inviteName.trim()) {
      onShowToast('Fields required', 'Please provide referee name and email', 'error');
      return;
    }

    setIsSending(true);
    try {
      await loyaltyService.processReferral({
        referrerCode: selectedCust.referralCode,
        newCustomerName: inviteName.trim(),
        newCustomerEmail: inviteEmail.trim(),
      });

      onShowToast(
        'Referral Invitation Completed',
        `Successfully registered ${inviteName}. +200 pts credited to ${selectedCust.fullName} and +100 welcome pts to ${inviteName}.`,
        'success'
      );
      setInviteEmail('');
      setInviteName('');
    } catch (err: any) {
      onShowToast('Referral Error', err.message || 'Error processing referral', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Referral Program &amp; Fraud Prevention
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Viral customer acquisition engine, dual-reward payouts, and anti-fraud enforcement
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Total Referral Invitations</div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
            {totalInvites}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{pendingReferrals} pending qualification</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Successful Conversions</div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
            {rewardedReferrals}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Completed 1st purchase</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Conversion Rate</div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
            {conversionRate}%
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Industry benchmark ~18%</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Referral Points Issued</div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
            {pointsPaidOut.toLocaleString()} <span className="text-xs font-normal text-zinc-400">pts</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Dual 200 / 100 pt payout model</div>
        </div>
      </div>

      {/* Simulator: Member Link & Referral Invitation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Generate and Dispatch Invitation */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Simulate Referral Link &amp; Friend Sign-Up
              </h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">Dual Reward: 200 / 100</span>
          </div>

          <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Select Existing Member (Referrer)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} (Code: {c.referralCode}) - {c.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Generated Link Display */}
            {selectedCust && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <span className="text-[11px] text-zinc-400">Unique Shareable Referral Link:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 bg-transparent border-none text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(referralLink)}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Friend Sign-Up Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Invited Friend's Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Price"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Invited Friend's Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="jordan.p@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Validating...' : 'Submit Referral & Award Dual Points'}</span>
            </button>
          </form>
        </div>

        {/* Right: Fraud Prevention & Protection Rules */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-900 border border-zinc-800 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                Fraud Prevention Guard
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Anti-Self-Referral Barrier
                </div>
                <p className="text-[11px] text-zinc-400">
                  Strictly rejects registrations where the referee email or device fingerprint matches the referrer.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Single Use Idempotency Guard
                </div>
                <p className="text-[11px] text-zinc-400">
                  Accounts cannot claim multiple referral codes. Existing emails are automatically barred from referral welcome points.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Dual Reward Mechanism
                </div>
                <p className="text-[11px] text-zinc-400">
                  Referrer receives <span className="text-white font-mono font-bold">+200 pts</span> upon first order; referee gets <span className="text-white font-mono font-bold">+100 pts</span> instant welcome credit.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Enforcement Engine:</span>
            <span className="text-emerald-400 font-semibold">Active &amp; Armed</span>
          </div>
        </div>
      </div>

      {/* Referrals History Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Referral Activity Log
            </h3>
            <p className="text-xs text-zinc-400">Tracking invitations, qualifying purchases, and rewards</p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">Count: {referrals.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="pb-2.5 px-2">Referrer</th>
                <th className="pb-2.5 px-2">Code</th>
                <th className="pb-2.5 px-2">Referee</th>
                <th className="pb-2.5 px-2 text-center">Status</th>
                <th className="pb-2.5 px-2 text-right">Points Paid</th>
                <th className="pb-2.5 px-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {referrals.map((ref) => (
                <tr key={ref.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                  <td className="py-2.5 px-2 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    {ref.referrerName}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-zinc-500">{ref.referralCode}</td>
                  <td className="py-2.5 px-2 text-zinc-700 dark:text-zinc-300">
                    <div>{ref.refereeName || ref.refereeEmail}</div>
                    <div className="text-[10px] text-zinc-400">{ref.refereeEmail}</div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ref.status === 'REWARDED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : ref.status === 'QUALIFIED'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                          : ref.status === 'FRAUD_REJECTED'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {ref.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    +{ref.referrerRewardPoints + ref.refereeRewardPoints} pts
                  </td>
                  <td className="py-2.5 px-2 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
