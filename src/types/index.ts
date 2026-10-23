export type Role = 'PLATFORM_ADMIN' | 'BUSINESS_OWNER' | 'STORE_MANAGER' | 'STAFF' | 'CUSTOMER';

export type CustomerSegment = 'VIP' | 'HIGH_VALUE' | 'FREQUENT_SHOPPER' | 'AT_RISK' | 'NEW_MEMBER';

export type TransactionType = 'EARNED' | 'REDEEMED' | 'BONUS' | 'EXPIRED' | 'ADJUSTED' | 'REFERRAL';

export type RewardType = 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED' | 'FREE_PRODUCT' | 'CASHBACK' | 'GIFT_CARD';

export type RedemptionStatus = 'ACTIVE' | 'USED' | 'EXPIRED';

export type CampaignType = 'BIRTHDAY' | 'BONUS_POINTS' | 'SEASONAL' | 'WIN_BACK' | 'ANNIVERSARY';

export type CampaignChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';

export type ReferralStatus = 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'FRAUD_REJECTED';

export interface Business {
  id: string;
  name: string;
  currency: string;
  pointsPerCurrency: number; // e.g. 1 point per $1
  currencyPerPoint: number; // e.g. $0.05 per point for redemption
  pointExpiryMonths: number;
  ownerEmail: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  code: string;
  location: string;
  managerName: string;
  isActive: boolean;
  createdAt: string;
  revenueThisMonth?: number;
  transactionsCount?: number;
}

export interface LoyaltyTier {
  id: string;
  name: string; // Bronze, Silver, Gold, Platinum
  color: string;
  minSpend: number;
  minPoints: number;
  multiplier: number; // 1.0x, 1.25x, 1.5x, 2.0x
  benefits: string[];
  rank: number;
}

export interface Customer {
  id: string;
  businessId: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  pointsBalance: number;
  lifetimePoints: number;
  tierId: string;
  referralCode: string;
  referredBy?: string;
  segment: CustomerSegment;
  totalSpent: number;
  purchaseCount: number;
  lastPurchaseDate: string;
  birthday?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  preferredBranchId?: string;
  createdAt: string;
  notificationsEnabled: boolean;
}

export interface PointTransaction {
  id: string;
  businessId: string;
  branchId?: string;
  branchName?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  type: TransactionType;
  points: number; // positive for earned/bonus, negative for redeemed/expired
  balanceAfter: number;
  purchaseAmount?: number;
  invoiceNumber?: string;
  description: string;
  idempotencyKey?: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  businessId: string;
  title: string;
  description: string;
  type: RewardType;
  pointsCost: number;
  discountValue: number; // 15% or $10 off
  minTier: string;
  stock: number;
  redeemedCount: number;
  expiryDays: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
}

export interface Redemption {
  id: string;
  businessId: string;
  rewardId: string;
  rewardTitle: string;
  rewardType: RewardType;
  discountValue: number;
  customerId: string;
  customerName: string;
  couponCode: string;
  pointsSpent: number;
  status: RedemptionStatus;
  expiresAt: string;
  usedAt?: string;
  usedBranchId?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  businessId: string;
  name: string;
  type: CampaignType;
  targetSegment: CustomerSegment | 'ALL';
  channel: CampaignChannel;
  bonusMultiplier: number;
  flatBonusPoints: number;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  subjectLine?: string;
  messageContent: string;
  sentCount: number;
  conversionCount: number;
  pointsAwarded: number;
  createdAt: string;
}

export interface Referral {
  id: string;
  businessId: string;
  referrerCustomerId: string;
  referrerName: string;
  refereeEmail: string;
  refereeCustomerId?: string;
  refereeName?: string;
  referralCode: string;
  status: ReferralStatus;
  referrerRewardPoints: number;
  refereeRewardPoints: number;
  createdAt: string;
  completedAt?: string;
  firstPurchaseAmount?: number;
}
