import {
  Customer,
  LoyaltyTier,
  PointTransaction,
  Reward,
  Redemption,
  Campaign,
  Referral,
  Branch,
  Business,
  CustomerSegment,
} from '../types';
import {
  DEFAULT_BUSINESS,
  DEFAULT_BRANCHES,
  DEFAULT_TIERS,
  DEFAULT_CUSTOMERS,
  DEFAULT_REWARDS,
  DEFAULT_REDEMPTIONS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_CAMPAIGNS,
  DEFAULT_REFERRALS,
} from '../data/mockData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';

const STORAGE_KEY_PREFIX = 'auraloyalty_';

function getStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Storage read error:', e);
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

export class LoyaltyService {
  private static instance: LoyaltyService;

  private business: Business = getStorage('business', DEFAULT_BUSINESS);
  private branches: Branch[] = getStorage('branches', DEFAULT_BRANCHES);
  private tiers: LoyaltyTier[] = getStorage('tiers', DEFAULT_TIERS);
  private customers: Customer[] = getStorage('customers', DEFAULT_CUSTOMERS);
  private rewards: Reward[] = getStorage('rewards', DEFAULT_REWARDS);
  private redemptions: Redemption[] = getStorage('redemptions', DEFAULT_REDEMPTIONS);
  private transactions: PointTransaction[] = getStorage('transactions', DEFAULT_TRANSACTIONS);
  private campaigns: Campaign[] = getStorage('campaigns', DEFAULT_CAMPAIGNS);
  private referrals: Referral[] = getStorage('referrals', DEFAULT_REFERRALS);

  private listeners: (() => void)[] = [];

  private constructor() {
    // initial setup
  }

  public static getInstance(): LoyaltyService {
    if (!LoyaltyService.instance) {
      LoyaltyService.instance = new LoyaltyService();
    }
    return LoyaltyService.instance;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // Getters
  public getBusiness(): Business {
    return this.business;
  }

  public getBranches(): Branch[] {
    return this.branches;
  }

  public getTiers(): LoyaltyTier[] {
    return [...this.tiers].sort((a, b) => a.rank - b.rank);
  }

  public getCustomers(): Customer[] {
    return this.customers;
  }

  public getRewards(): Reward[] {
    return this.rewards;
  }

  public getRedemptions(): Redemption[] {
    return this.redemptions;
  }

  public getTransactions(): PointTransaction[] {
    return [...this.transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getCampaigns(): Campaign[] {
    return this.campaigns;
  }

  public getReferrals(): Referral[] {
    return this.referrals;
  }

  // Finders
  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  public getTierById(tierId: string): LoyaltyTier {
    return (
      this.tiers.find((t) => t.id === tierId) ||
      this.tiers[0] ||
      DEFAULT_TIERS[0]
    );
  }

  // Helper for unique coupon codes
  public generateCouponCode(rewardType: string): string {
    const prefix = rewardType.slice(0, 4).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const num = Math.floor(1000 + Math.random() * 9000);
    return `AURA-${prefix}-${rand}${num}`;
  }

  // Calculate points for an order
  public calculatePoints(
    amount: number,
    customerId: string,
    campaignId?: string
  ): {
    basePoints: number;
    tierMultiplier: number;
    campaignMultiplier: number;
    totalPoints: number;
    appliedTier: LoyaltyTier;
  } {
    const customer = this.getCustomerById(customerId);
    const tier = customer ? this.getTierById(customer.tierId) : this.tiers[0];
    const base = Math.floor(amount * (this.business.pointsPerCurrency || 1));
    const tierMult = tier.multiplier || 1.0;

    let campMult = 1.0;
    if (campaignId) {
      const camp = this.campaigns.find((c) => c.id === campaignId && c.status === 'ACTIVE');
      if (camp && camp.bonusMultiplier > 1.0) {
        campMult = camp.bonusMultiplier;
      }
    }

    const total = Math.round(base * tierMult * campMult);
    return {
      basePoints: base,
      tierMultiplier: tierMult,
      campaignMultiplier: campMult,
      totalPoints: total,
      appliedTier: tier,
    };
  }

  // Evaluate Tier upgrade eligibility
  public evaluateTier(customer: Customer): LoyaltyTier {
    const sortedTiers = [...this.tiers].sort((a, b) => b.rank - a.rank);
    for (const tier of sortedTiers) {
      if (
        customer.totalSpent >= tier.minSpend ||
        customer.lifetimePoints >= tier.minPoints
      ) {
        return tier;
      }
    }
    return sortedTiers[sortedTiers.length - 1];
  }

  // Customer Segmentation update
  private evaluateSegment(customer: Customer): CustomerSegment {
    const daysSincePurchase = customer.lastPurchaseDate
      ? (Date.now() - new Date(customer.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (customer.totalSpent >= 3000 || customer.tierId === 'tier_platinum') {
      return 'VIP';
    }
    if (customer.totalSpent >= 1500) {
      return 'HIGH_VALUE';
    }
    if (customer.purchaseCount >= 6) {
      return 'FREQUENT_SHOPPER';
    }
    if (daysSincePurchase > 60 && customer.purchaseCount > 0) {
      return 'AT_RISK';
    }
    return 'NEW_MEMBER';
  }

  // Core Points Engine: Award Points for Purchase
  public async recordPurchase(params: {
    customerId: string;
    purchaseAmount: number;
    branchId?: string;
    invoiceNumber?: string;
    notes?: string;
    campaignId?: string;
  }): Promise<{ transaction: PointTransaction; customer: Customer; upgradedTier?: LoyaltyTier }> {
    const customer = this.getCustomerById(params.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Idempotency check if invoice provided
    if (params.invoiceNumber) {
      const exists = this.transactions.some(
        (t) => t.invoiceNumber === params.invoiceNumber && t.customerId === customer.id
      );
      if (exists) {
        throw new Error(`Transaction with invoice ${params.invoiceNumber} already processed.`);
      }
    }

    const { totalPoints, appliedTier, campaignMultiplier } = this.calculatePoints(
      params.purchaseAmount,
      customer.id,
      params.campaignId
    );

    const newBalance = customer.pointsBalance + totalPoints;
    const newLifetime = customer.lifetimePoints + totalPoints;
    const newSpent = customer.totalSpent + params.purchaseAmount;
    const newCount = customer.purchaseCount + 1;
    const nowIso = new Date().toISOString();

    const branch = this.branches.find((b) => b.id === params.branchId);

    // Build ledger transaction
    const transaction: PointTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: this.business.id,
      branchId: params.branchId,
      branchName: branch?.name || 'In-Store',
      customerId: customer.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      type: 'EARNED',
      points: totalPoints,
      balanceAfter: newBalance,
      purchaseAmount: params.purchaseAmount,
      invoiceNumber: params.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      description: `Purchase of $${params.purchaseAmount.toFixed(2)} (${appliedTier.name} ${appliedTier.multiplier}x${
        campaignMultiplier > 1 ? ` + Camp ${campaignMultiplier}x` : ''
      })${params.notes ? ` - ${params.notes}` : ''}`,
      createdAt: nowIso,
    };

    // Evaluate tier upgrade
    const tempUpdated: Customer = {
      ...customer,
      pointsBalance: newBalance,
      lifetimePoints: newLifetime,
      totalSpent: newSpent,
      purchaseCount: newCount,
      lastPurchaseDate: nowIso,
    };

    const newTier = this.evaluateTier(tempUpdated);
    const hasUpgraded = newTier.rank > this.getTierById(customer.tierId).rank;

    const finalCustomer: Customer = {
      ...tempUpdated,
      tierId: newTier.id,
      segment: this.evaluateSegment(tempUpdated),
    };

    // Update state
    this.customers = this.customers.map((c) => (c.id === finalCustomer.id ? finalCustomer : c));
    this.transactions = [transaction, ...this.transactions];

    setStorage('customers', this.customers);
    setStorage('transactions', this.transactions);

    // Fire off async background sync to Cloud Firestore
    this.syncToFirestore('transactions', transaction.id, transaction);
    this.syncToFirestore('customers', finalCustomer.id, finalCustomer);

    this.notify();

    return {
      transaction,
      customer: finalCustomer,
      upgradedTier: hasUpgraded ? newTier : undefined,
    };
  }

  // Adjust Points manually (by Admin)
  public async adjustPoints(params: {
    customerId: string;
    pointsDelta: number;
    reason: string;
  }): Promise<{ transaction: PointTransaction; customer: Customer }> {
    const customer = this.getCustomerById(params.customerId);
    if (!customer) throw new Error('Customer not found');

    const newBalance = customer.pointsBalance + params.pointsDelta;
    if (newBalance < 0) {
      throw new Error(`Insufficient points balance. Current: ${customer.pointsBalance}, Adjustment: ${params.pointsDelta}`);
    }

    const nowIso = new Date().toISOString();
    const transaction: PointTransaction = {
      id: `tx_adj_${Date.now()}`,
      businessId: this.business.id,
      customerId: customer.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      type: 'ADJUSTED',
      points: params.pointsDelta,
      balanceAfter: newBalance,
      description: `Manual adjustment by admin: ${params.reason}`,
      createdAt: nowIso,
    };

    const updatedCustomer: Customer = {
      ...customer,
      pointsBalance: newBalance,
      lifetimePoints:
        params.pointsDelta > 0
          ? customer.lifetimePoints + params.pointsDelta
          : customer.lifetimePoints,
    };

    this.customers = this.customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c));
    this.transactions = [transaction, ...this.transactions];

    setStorage('customers', this.customers);
    setStorage('transactions', this.transactions);

    this.syncToFirestore('transactions', transaction.id, transaction);
    this.syncToFirestore('customers', updatedCustomer.id, updatedCustomer);

    this.notify();

    return { transaction, customer: updatedCustomer };
  }

  // Redeem Reward
  public async redeemReward(params: {
    customerId: string;
    rewardId: string;
  }): Promise<{ redemption: Redemption; transaction: PointTransaction; customer: Customer }> {
    const customer = this.getCustomerById(params.customerId);
    if (!customer) throw new Error('Customer not found');

    const reward = this.rewards.find((r) => r.id === params.rewardId);
    if (!reward) throw new Error('Reward not found');

    if (!reward.isActive) throw new Error('This reward is currently unavailable');
    if (reward.stock <= 0) throw new Error('This reward is out of stock');

    // Tier eligibility check
    const custTier = this.getTierById(customer.tierId);
    const minTier = this.getTierById(reward.minTier);
    if (custTier.rank < minTier.rank) {
      throw new Error(`Requires ${minTier.name} or higher. You are ${custTier.name}.`);
    }

    // Points balance check
    if (customer.pointsBalance < reward.pointsCost) {
      throw new Error(
        `Insufficient points. Required: ${reward.pointsCost}, Balance: ${customer.pointsBalance}`
      );
    }

    const nowIso = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (reward.expiryDays || 30));

    const couponCode = this.generateCouponCode(reward.type);
    const newBalance = customer.pointsBalance - reward.pointsCost;

    // Create redemption voucher
    const redemption: Redemption = {
      id: `red_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: this.business.id,
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardType: reward.type,
      discountValue: reward.discountValue,
      customerId: customer.id,
      customerName: customer.fullName,
      couponCode,
      pointsSpent: reward.pointsCost,
      status: 'ACTIVE',
      expiresAt: expiryDate.toISOString(),
      createdAt: nowIso,
    };

    // Ledger transaction
    const transaction: PointTransaction = {
      id: `tx_red_${Date.now()}`,
      businessId: this.business.id,
      customerId: customer.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      type: 'REDEEMED',
      points: -reward.pointsCost,
      balanceAfter: newBalance,
      description: `Redeemed: ${reward.title} (Voucher: ${couponCode})`,
      createdAt: nowIso,
    };

    const updatedCustomer: Customer = {
      ...customer,
      pointsBalance: newBalance,
    };

    const updatedReward: Reward = {
      ...reward,
      stock: Math.max(0, reward.stock - 1),
      redeemedCount: reward.redeemedCount + 1,
    };

    this.customers = this.customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c));
    this.rewards = this.rewards.map((r) => (r.id === updatedReward.id ? updatedReward : r));
    this.redemptions = [redemption, ...this.redemptions];
    this.transactions = [transaction, ...this.transactions];

    setStorage('customers', this.customers);
    setStorage('rewards', this.rewards);
    setStorage('redemptions', this.redemptions);
    setStorage('transactions', this.transactions);

    this.syncToFirestore('redemptions', redemption.id, redemption);
    this.syncToFirestore('transactions', transaction.id, transaction);
    this.syncToFirestore('customers', updatedCustomer.id, updatedCustomer);
    this.syncToFirestore('rewards', updatedReward.id, updatedReward);

    this.notify();

    return { redemption, transaction, customer: updatedCustomer };
  }

  // Validate and Mark Coupon as Used (at POS checkout)
  public async markCouponUsed(couponCode: string, branchId?: string): Promise<Redemption> {
    const trimmed = couponCode.trim().toUpperCase();
    const item = this.redemptions.find((r) => r.couponCode === trimmed);
    if (!item) {
      throw new Error(`Coupon "${trimmed}" was not found.`);
    }

    if (item.status === 'USED') {
      throw new Error(`Coupon "${trimmed}" was already used on ${new Date(item.usedAt || '').toLocaleDateString()}.`);
    }

    if (new Date(item.expiresAt).getTime() < Date.now()) {
      item.status = 'EXPIRED';
      setStorage('redemptions', this.redemptions);
      this.notify();
      throw new Error(`Coupon "${trimmed}" expired on ${new Date(item.expiresAt).toLocaleDateString()}.`);
    }

    const updated: Redemption = {
      ...item,
      status: 'USED',
      usedAt: new Date().toISOString(),
      usedBranchId: branchId,
    };

    this.redemptions = this.redemptions.map((r) => (r.id === updated.id ? updated : r));
    setStorage('redemptions', this.redemptions);
    this.syncToFirestore('redemptions', updated.id, updated);
    this.notify();

    return updated;
  }

  // Referral processing with fraud guard
  public async processReferral(params: {
    referrerCode: string;
    newCustomerEmail: string;
    newCustomerName: string;
    newCustomerPhone?: string;
  }): Promise<{ customer: Customer; referral: Referral }> {
    const cleanCode = params.referrerCode.trim().toUpperCase();
    const referrer = this.customers.find((c) => c.referralCode.toUpperCase() === cleanCode);
    if (!referrer) {
      throw new Error(`Invalid referral code "${cleanCode}".`);
    }

    // Anti-self-referral guard
    if (referrer.email.toLowerCase() === params.newCustomerEmail.toLowerCase()) {
      throw new Error('Self-referrals are prohibited.');
    }

    // Check duplicate email
    if (this.customers.some((c) => c.email.toLowerCase() === params.newCustomerEmail.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }

    const nowIso = new Date().toISOString();
    const newCustId = `cust_${Date.now()}`;
    const generatedRefCode = `${params.newCustomerName.split(' ')[0].toUpperCase()}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    // Welcome bonus for referee (e.g. 100 points)
    const refereeBonus = 100;
    const referrerBonus = 200;

    const newCustomer: Customer = {
      id: newCustId,
      businessId: this.business.id,
      fullName: params.newCustomerName,
      email: params.newCustomerEmail,
      phone: params.newCustomerPhone || '',
      pointsBalance: refereeBonus,
      lifetimePoints: refereeBonus,
      tierId: 'tier_bronze',
      referralCode: generatedRefCode,
      referredBy: referrer.id,
      segment: 'NEW_MEMBER',
      totalSpent: 0,
      purchaseCount: 0,
      lastPurchaseDate: '',
      status: 'ACTIVE',
      createdAt: nowIso,
      notificationsEnabled: true,
    };

    const referralRecord: Referral = {
      id: `ref_${Date.now()}`,
      businessId: this.business.id,
      referrerCustomerId: referrer.id,
      referrerName: referrer.fullName,
      refereeEmail: params.newCustomerEmail,
      refereeCustomerId: newCustId,
      refereeName: params.newCustomerName,
      referralCode: cleanCode,
      status: 'REWARDED',
      referrerRewardPoints: referrerBonus,
      refereeRewardPoints: refereeBonus,
      createdAt: nowIso,
      completedAt: nowIso,
    };

    // Ledger entry for Referee
    const refereeTx: PointTransaction = {
      id: `tx_referee_${Date.now()}`,
      businessId: this.business.id,
      customerId: newCustomer.id,
      customerName: newCustomer.fullName,
      customerEmail: newCustomer.email,
      type: 'REFERRAL',
      points: refereeBonus,
      balanceAfter: refereeBonus,
      description: `Welcome bonus for using invitation code ${cleanCode}`,
      createdAt: nowIso,
    };

    // Ledger entry for Referrer
    const newReferrerBalance = referrer.pointsBalance + referrerBonus;
    const referrerTx: PointTransaction = {
      id: `tx_referrer_${Date.now()}`,
      businessId: this.business.id,
      customerId: referrer.id,
      customerName: referrer.fullName,
      customerEmail: referrer.email,
      type: 'REFERRAL',
      points: referrerBonus,
      balanceAfter: newReferrerBalance,
      description: `Referral award: ${params.newCustomerName} registered via your code`,
      createdAt: nowIso,
    };

    const updatedReferrer: Customer = {
      ...referrer,
      pointsBalance: newReferrerBalance,
      lifetimePoints: referrer.lifetimePoints + referrerBonus,
    };

    this.customers = [...this.customers, newCustomer].map((c) =>
      c.id === updatedReferrer.id ? updatedReferrer : c
    );
    this.referrals = [referralRecord, ...this.referrals];
    this.transactions = [refereeTx, referrerTx, ...this.transactions];

    setStorage('customers', this.customers);
    setStorage('referrals', this.referrals);
    setStorage('transactions', this.transactions);

    this.syncToFirestore('customers', newCustomer.id, newCustomer);
    this.syncToFirestore('customers', updatedReferrer.id, updatedReferrer);
    this.syncToFirestore('referrals', referralRecord.id, referralRecord);
    this.syncToFirestore('transactions', refereeTx.id, refereeTx);
    this.syncToFirestore('transactions', referrerTx.id, referrerTx);

    this.notify();

    return { customer: newCustomer, referral: referralRecord };
  }

  // Create new customer
  public async addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'pointsBalance' | 'lifetimePoints' | 'totalSpent' | 'purchaseCount' | 'lastPurchaseDate'>): Promise<Customer> {
    const id = `cust_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id,
      pointsBalance: 0,
      lifetimePoints: 0,
      totalSpent: 0,
      purchaseCount: 0,
      lastPurchaseDate: '',
      createdAt: nowIso,
    };

    this.customers = [newCustomer, ...this.customers];
    setStorage('customers', this.customers);
    this.syncToFirestore('customers', newCustomer.id, newCustomer);
    this.notify();
    return newCustomer;
  }

  // Add/Update Reward
  public async saveReward(reward: Reward): Promise<Reward> {
    const isNew = !this.rewards.some((r) => r.id === reward.id);
    if (isNew) {
      this.rewards = [reward, ...this.rewards];
    } else {
      this.rewards = this.rewards.map((r) => (r.id === reward.id ? reward : r));
    }
    setStorage('rewards', this.rewards);
    this.syncToFirestore('rewards', reward.id, reward);
    this.notify();
    return reward;
  }

  // Add/Update Campaign
  public async saveCampaign(campaign: Campaign): Promise<Campaign> {
    const isNew = !this.campaigns.some((c) => c.id === campaign.id);
    if (isNew) {
      this.campaigns = [campaign, ...this.campaigns];
    } else {
      this.campaigns = this.campaigns.map((c) => (c.id === campaign.id ? campaign : c));
    }
    setStorage('campaigns', this.campaigns);
    this.syncToFirestore('campaigns', campaign.id, campaign);
    this.notify();
    return campaign;
  }

  // Add/Update Branch
  public async saveBranch(branch: Branch): Promise<Branch> {
    const isNew = !this.branches.some((b) => b.id === branch.id);
    if (isNew) {
      this.branches = [...this.branches, branch];
    } else {
      this.branches = this.branches.map((b) => (b.id === branch.id ? branch : b));
    }
    setStorage('branches', this.branches);
    this.syncToFirestore('branches', branch.id, branch);
    this.notify();
    return branch;
  }

  // Update Tiers
  public async updateTier(tier: LoyaltyTier): Promise<LoyaltyTier> {
    this.tiers = this.tiers.map((t) => (t.id === tier.id ? tier : t));
    setStorage('tiers', this.tiers);
    this.syncToFirestore('tiers', tier.id, tier);
    this.notify();
    return tier;
  }

  // Update Business Settings
  public async updateBusiness(business: Business): Promise<Business> {
    this.business = business;
    setStorage('business', business);
    this.syncToFirestore('businesses', business.id, business);
    this.notify();
    return business;
  }

  // Seed / Reset Demo Data
  public async seedDemoDataToFirestore(): Promise<{ count: number }> {
    this.business = DEFAULT_BUSINESS;
    this.branches = DEFAULT_BRANCHES;
    this.tiers = DEFAULT_TIERS;
    this.customers = DEFAULT_CUSTOMERS;
    this.rewards = DEFAULT_REWARDS;
    this.redemptions = DEFAULT_REDEMPTIONS;
    this.transactions = DEFAULT_TRANSACTIONS;
    this.campaigns = DEFAULT_CAMPAIGNS;
    this.referrals = DEFAULT_REFERRALS;

    setStorage('business', this.business);
    setStorage('branches', this.branches);
    setStorage('tiers', this.tiers);
    setStorage('customers', this.customers);
    setStorage('rewards', this.rewards);
    setStorage('redemptions', this.redemptions);
    setStorage('transactions', this.transactions);
    setStorage('campaigns', this.campaigns);
    setStorage('referrals', this.referrals);

    let synced = 0;
    try {
      const batch = writeBatch(db);

      batch.set(doc(db, 'businesses', this.business.id), this.business);
      this.branches.forEach((b) => batch.set(doc(db, 'branches', b.id), b));
      this.tiers.forEach((t) => batch.set(doc(db, 'tiers', t.id), t));
      this.customers.forEach((c) => batch.set(doc(db, 'customers', c.id), c));
      this.rewards.forEach((r) => batch.set(doc(db, 'rewards', r.id), r));
      this.redemptions.forEach((rd) => batch.set(doc(db, 'redemptions', rd.id), rd));
      this.campaigns.forEach((cmp) => batch.set(doc(db, 'campaigns', cmp.id), cmp));

      await batch.commit();
      synced = this.customers.length + this.rewards.length + this.transactions.length;
    } catch (err) {
      console.warn('Firestore bulk seed warning (continuing with local cache):', err);
    }

    this.notify();
    return { count: synced };
  }

  // Background Firestore sync helper
  private async syncToFirestore(collectionName: string, docId: string, data: any) {
    try {
      await setDoc(doc(db, collectionName, docId), data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  }

  // Load from Firestore if online
  public async pullFromFirestore(): Promise<boolean> {
    try {
      const custSnap = await getDocs(collection(db, 'customers'));
      if (!custSnap.empty) {
        const loaded: Customer[] = [];
        custSnap.forEach((d) => loaded.push(d.data() as Customer));
        this.customers = loaded;
        setStorage('customers', loaded);
      }

      const txSnap = await getDocs(collection(db, 'transactions'));
      if (!txSnap.empty) {
        const loaded: PointTransaction[] = [];
        txSnap.forEach((d) => loaded.push(d.data() as PointTransaction));
        this.transactions = loaded;
        setStorage('transactions', loaded);
      }

      const rewSnap = await getDocs(collection(db, 'rewards'));
      if (!rewSnap.empty) {
        const loaded: Reward[] = [];
        rewSnap.forEach((d) => loaded.push(d.data() as Reward));
        this.rewards = loaded;
        setStorage('rewards', loaded);
      }

      this.notify();
      return true;
    } catch (err) {
      console.info('Using local cache (Firestore pull deferred):', err);
      return false;
    }
  }
}

export const loyaltyService = LoyaltyService.getInstance();
