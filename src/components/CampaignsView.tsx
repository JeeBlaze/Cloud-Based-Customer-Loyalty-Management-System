import React, { useState } from 'react';
import {
  Megaphone,
  Mail,
  MessageSquare,
  Smartphone,
  Calendar,
  Sparkles,
  Plus,
  X,
  Send,
  Users,
  TrendingUp,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { Campaign, CampaignChannel, CampaignType, CustomerSegment } from '../types';

interface CampaignsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ onShowToast }) => {
  const campaigns = loyaltyService.getCampaigns();
  const business = loyaltyService.getBusiness();

  const [activeTab, setActiveTab] = useState<'all' | 'ACTIVE' | 'SCHEDULED'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign>(campaigns[0]);

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [campType, setCampType] = useState<CampaignType>('BONUS_POINTS');
  const [channel, setChannel] = useState<CampaignChannel>('EMAIL');
  const [targetSegment, setTargetSegment] = useState<CustomerSegment | 'ALL'>('ALL');
  const [bonusMultiplier, setBonusMultiplier] = useState('2.0');
  const [flatBonus, setFlatBonus] = useState('0');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-15');

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      onShowToast('Validation error', 'Please provide a campaign name and message content', 'error');
      return;
    }

    const newCampaign: Campaign = {
      id: `camp_${Date.now()}`,
      businessId: business.id,
      name: name.trim(),
      type: campType,
      channel,
      targetSegment,
      bonusMultiplier: parseFloat(bonusMultiplier) || 1.0,
      flatBonusPoints: parseInt(flatBonus, 10) || 0,
      status: 'ACTIVE',
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      subjectLine: subject.trim(),
      messageContent: message.trim(),
      sentCount: 1450,
      conversionCount: 182,
      pointsAwarded: 36400,
      createdAt: new Date().toISOString(),
    };

    await loyaltyService.saveCampaign(newCampaign);
    setSelectedCampaign(newCampaign);
    setShowCreateModal(false);
    onShowToast('Campaign Launched', `Campaign "${newCampaign.name}" is now live and broadcasting.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Campaigns &amp; Automation
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automated birthday bonus points, win-back reactivation, multi-channel broadcast previews
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Campaign List & Channel Simulator Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Campaigns Selector */}
        <div className="lg:col-span-6 space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs">
            {(['all', 'ACTIVE', 'SCHEDULED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {tab === 'all' ? 'All Campaigns' : tab}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredCampaigns.map((camp) => {
              const isSelected = selectedCampaign?.id === camp.id;
              const convRate = camp.sentCount > 0 ? Math.round((camp.conversionCount / camp.sentCount) * 100) : 0;

              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCampaign(camp)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-zinc-900 dark:border-white bg-zinc-50/80 dark:bg-zinc-900/90 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            camp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {camp.status}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          {camp.channel}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 leading-tight">
                        {camp.name}
                      </h3>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      {camp.bonusMultiplier > 1 ? `${camp.bonusMultiplier}x Bonus` : `+${camp.flatBonusPoints} pts`}
                    </span>
                  </div>

                  {/* Metrics preview */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 gap-2 text-[11px] text-zinc-500">
                    <div>
                      <span className="text-zinc-400">Target:</span>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">{camp.targetSegment}</div>
                    </div>
                    <div>
                      <span className="text-zinc-400">Sent:</span>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">{camp.sentCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-zinc-400">Conversion:</span>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {camp.conversionCount} ({convRate}%)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Multi-Channel Live Preview Simulator */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-900 border border-zinc-800 shadow-md flex flex-col justify-between">
          {selectedCampaign ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  {selectedCampaign.channel === 'EMAIL' && <Mail className="w-4 h-4 text-sky-400" />}
                  {selectedCampaign.channel === 'SMS' && <MessageSquare className="w-4 h-4 text-emerald-400" />}
                  {selectedCampaign.channel === 'WHATSAPP' && <MessageSquare className="w-4 h-4 text-green-400" />}
                  {selectedCampaign.channel === 'PUSH' && <Smartphone className="w-4 h-4 text-purple-400" />}
                  <span className="text-xs font-semibold text-white tracking-wide">
                    Live Channel Simulator ({selectedCampaign.channel})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">Customer View</span>
              </div>

              {/* Email Card Simulator */}
              {selectedCampaign.channel === 'EMAIL' && (
                <div className="rounded-xl bg-white text-zinc-900 p-5 shadow-lg border border-zinc-200 space-y-3">
                  <div className="border-b border-zinc-200 pb-2 text-xs">
                    <div className="text-[11px] text-zinc-400">
                      From: <span className="text-zinc-800 font-medium">VIP Concierge &lt;rewards@luminarybrands.com&gt;</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Subject:{' '}
                      <span className="text-zinc-950 font-semibold">
                        {selectedCampaign.subjectLine || selectedCampaign.name}
                      </span>
                    </div>
                  </div>

                  <div className="py-2 space-y-2">
                    <div className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">
                      Luminary Loyalty Club
                    </div>
                    <h4 className="text-base font-bold text-zinc-950 leading-snug">
                      {selectedCampaign.name}
                    </h4>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {selectedCampaign.messageContent}
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-4 py-2 rounded-lg bg-zinc-950 text-white font-semibold text-xs shadow-xs">
                        {selectedCampaign.bonusMultiplier > 1
                          ? `Activate ${selectedCampaign.bonusMultiplier}x Multiplier`
                          : 'Claim Bonus Points'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-400 border-t border-zinc-100 pt-2 text-center">
                    Valid through {new Date(selectedCampaign.endDate).toLocaleDateString()} for segment: {selectedCampaign.targetSegment}
                  </div>
                </div>
              )}

              {/* SMS Simulator */}
              {selectedCampaign.channel === 'SMS' && (
                <div className="max-w-xs mx-auto p-4 rounded-3xl bg-zinc-900 border border-zinc-700 shadow-xl space-y-3">
                  <div className="text-center text-[10px] text-zinc-400">iMessage / SMS</div>
                  <div className="p-3.5 rounded-2xl bg-zinc-800 text-zinc-100 text-xs leading-relaxed space-y-1">
                    <p>{selectedCampaign.messageContent}</p>
                    <div className="text-[10px] text-zinc-400 text-right">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Simulator */}
              {selectedCampaign.channel === 'WHATSAPP' && (
                <div className="max-w-xs mx-auto p-4 rounded-3xl bg-zinc-900 border border-zinc-700 shadow-xl space-y-2">
                  <div className="text-center text-[10px] text-emerald-400 font-semibold">WhatsApp Business</div>
                  <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-100 text-xs leading-relaxed space-y-2">
                    <div className="font-bold text-white">{selectedCampaign.name}</div>
                    <p>{selectedCampaign.messageContent}</p>
                    <div className="text-[10px] text-emerald-400 text-right">
                      ✓✓ Delivered
                    </div>
                  </div>
                </div>
              )}

              {/* Push Notification Simulator */}
              {selectedCampaign.channel === 'PUSH' && (
                <div className="max-w-sm mx-auto p-3.5 rounded-2xl bg-zinc-800/90 border border-zinc-700 shadow-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-semibold text-white">AuraLoyalty</span>
                    <span>now</span>
                  </div>
                  <div className="text-xs font-bold text-white">{selectedCampaign.name}</div>
                  <p className="text-xs text-zinc-300 leading-snug">{selectedCampaign.messageContent}</p>
                </div>
              )}

              {/* Performance Stats */}
              <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 text-[11px]">Total Points Credited:</span>
                  <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                    {selectedCampaign.pointsAwarded.toLocaleString()} pts
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px]">Active Window:</span>
                  <div className="text-zinc-200 text-xs mt-0.5">
                    {new Date(selectedCampaign.startDate).toLocaleDateString()} - {new Date(selectedCampaign.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs">Select a campaign to view preview</div>
          )}

          <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Broadcast Engine:</span>
            <span className="text-zinc-200">Firebase Cloud Messaging &amp; Omnichannel Webhooks</span>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Launch Promotional Campaign
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Holiday Flash Double Points"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Campaign Type
                  </label>
                  <select
                    value={campType}
                    onChange={(e) => setCampType(e.target.value as CampaignType)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                  >
                    <option value="BONUS_POINTS">Points Multiplier</option>
                    <option value="BIRTHDAY">Birthday Gift</option>
                    <option value="SEASONAL">Seasonal Flash</option>
                    <option value="WIN_BACK">Win-Back Inactive</option>
                    <option value="ANNIVERSARY">Anniversary</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as CampaignChannel)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                  >
                    <option value="EMAIL">Email Newsletter</option>
                    <option value="SMS">SMS Text Message</option>
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="PUSH">App Push Notification</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Target Segment
                  </label>
                  <select
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value as CustomerSegment | 'ALL')}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                  >
                    <option value="ALL">All Members</option>
                    <option value="VIP">VIP Tier Only</option>
                    <option value="HIGH_VALUE">High Value</option>
                    <option value="FREQUENT_SHOPPER">Frequent Shoppers</option>
                    <option value="AT_RISK">At Risk (Reactivation)</option>
                    <option value="NEW_MEMBER">New Members</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Bonus Multiplier (e.g. 2.0x)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={bonusMultiplier}
                    onChange={(e) => setBonusMultiplier(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>
              </div>

              {channel === 'EMAIL' && (
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exclusive Double Points Weekend Starts Now"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Body copy of message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
