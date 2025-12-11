import { Injectable, signal, computed } from '@angular/core';

/**
 * Subscription & Pricing Service
 * Manages subscription tiers, feature access, and pricing
 */

export type SubscriptionTier = 'free' | 'pro' | 'studio' | 'enterprise';

export type BillingInterval = 'monthly' | 'yearly' | 'lifetime';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  features: string[];
  prices: {
    monthly: number;
    yearly: number;
    lifetime?: number;
  };
  limits: SubscriptionLimits;
  popular?: boolean;
  badge?: string;
}

export interface SubscriptionLimits {
  maxScenes: number;
  maxSources: number;
  cloudStorageGB: number;
  aiBackgroundRemovalMinutes: number; // per month
  maxWorkflows: number;
  maxCustomTemplates: number;
  maxBots: number;
  apiCallsPerMonth: number;
  maxStreamDestinations: number;
  prioritySupport: boolean;
  customBranding: boolean;
  whiteLabel: boolean;
  teamMembers: number;
  advancedAnalytics: boolean;
  exportCapabilities: boolean;
}

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  interval: BillingInterval;
  startDate: Date;
  renewalDate?: Date;
  cancelDate?: Date;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  trialEndsAt?: Date;
  paymentProvider?: string;
  subscriptionId?: string;
}

export interface OneTimePurchase {
  id: string;
  name: string;
  type: 'template-pack' | 'sound-pack' | 'overlay-pack' | 'alert-pack' | 'plugin';
  description: string;
  price: number;
  thumbnailUrl?: string;
  items: number;
  category: string;
  rating?: number;
  downloads?: number;
}

export interface UsageMetrics {
  aiBackgroundRemovalUsed: number; // minutes this month
  cloudStorageUsed: number; // GB
  apiCallsUsed: number; // this month
  workflowsCreated: number;
  customTemplatesCreated: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  // Current user subscription
  readonly currentSubscription = signal<UserSubscription>({
    userId: 'current-user',
    tier: 'free',
    interval: 'monthly',
    startDate: new Date(),
    status: 'active'
  });

  // Usage tracking
  readonly usageMetrics = signal<UsageMetrics>({
    aiBackgroundRemovalUsed: 0,
    cloudStorageUsed: 0,
    apiCallsUsed: 0,
    workflowsCreated: 0,
    customTemplatesCreated: 0
  });

  // One-time purchases owned by user
  readonly ownedPurchases = signal<string[]>([]);

  // Available subscription plans
  readonly plans = signal<SubscriptionPlan[]>([
    {
      id: 'free',
      tier: 'free',
      name: 'Free',
      description: 'Perfect for getting started with streaming',
      features: [
        'Unlimited streaming time',
        '5 scenes',
        '10 sources per scene',
        '1 stream destination',
        'Basic templates (5)',
        'Basic overlays & alerts',
        'Chat integration',
        'Basic analytics',
        'Community support'
      ],
      prices: {
        monthly: 0,
        yearly: 0
      },
      limits: {
        maxScenes: 5,
        maxSources: 10,
        cloudStorageGB: 0,
        aiBackgroundRemovalMinutes: 0,
        maxWorkflows: 0,
        maxCustomTemplates: 3,
        maxBots: 0,
        apiCallsPerMonth: 100,
        maxStreamDestinations: 1,
        prioritySupport: false,
        customBranding: false,
        whiteLabel: false,
        teamMembers: 1,
        advancedAnalytics: false,
        exportCapabilities: false
      }
    },
    {
      id: 'pro',
      tier: 'pro',
      name: 'Pro',
      description: 'For serious streamers and content creators',
      features: [
        'Everything in Free',
        'Unlimited scenes & sources',
        '3 stream destinations (multi-streaming)',
        'All premium templates (50+)',
        'AI background removal (60 min/month)',
        '50GB cloud storage',
        'Advanced overlays & alerts',
        'Chat mini-games & betting',
        'TTS & sound alerts',
        '10 automation workflows',
        'Advanced analytics & exports',
        'Priority email support'
      ],
      prices: {
        monthly: 14.99,
        yearly: 149.99, // ~$12.50/month
        lifetime: 499.99
      },
      limits: {
        maxScenes: -1, // unlimited
        maxSources: -1,
        cloudStorageGB: 50,
        aiBackgroundRemovalMinutes: 60,
        maxWorkflows: 10,
        maxCustomTemplates: 50,
        maxBots: 3,
        apiCallsPerMonth: 10000,
        maxStreamDestinations: 3,
        prioritySupport: true,
        customBranding: false,
        whiteLabel: false,
        teamMembers: 1,
        advancedAnalytics: true,
        exportCapabilities: true
      },
      popular: true,
      badge: 'MOST POPULAR'
    },
    {
      id: 'studio',
      tier: 'studio',
      name: 'Studio',
      description: 'Professional streaming studio features',
      features: [
        'Everything in Pro',
        'Unlimited stream destinations',
        'NDI support',
        'AI background removal (300 min/month)',
        '500GB cloud storage',
        'Unlimited automation workflows',
        'Custom branding & overlays',
        'Game API integrations',
        'Scripting engine access',
        'Channel rewards system',
        'Virtual camera output',
        '24/7 priority support',
        'Early access to new features'
      ],
      prices: {
        monthly: 49.99,
        yearly: 499.99, // ~$41.67/month
        lifetime: 1499.99
      },
      limits: {
        maxScenes: -1,
        maxSources: -1,
        cloudStorageGB: 500,
        aiBackgroundRemovalMinutes: 300,
        maxWorkflows: -1,
        maxCustomTemplates: -1,
        maxBots: 10,
        apiCallsPerMonth: 100000,
        maxStreamDestinations: -1,
        prioritySupport: true,
        customBranding: true,
        whiteLabel: false,
        teamMembers: 3,
        advancedAnalytics: true,
        exportCapabilities: true
      }
    },
    {
      id: 'enterprise',
      tier: 'enterprise',
      name: 'Enterprise',
      description: 'For teams and organizations',
      features: [
        'Everything in Studio',
        'Unlimited everything',
        'White-label solution',
        'Custom domain',
        'Unlimited cloud storage',
        'Unlimited AI usage',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee (99.9%)',
        'On-premise deployment option',
        'Team collaboration (unlimited)',
        'Advanced security & compliance',
        'Custom contract terms'
      ],
      prices: {
        monthly: 199.99,
        yearly: 1999.99 // ~$166.67/month
      },
      limits: {
        maxScenes: -1,
        maxSources: -1,
        cloudStorageGB: -1,
        aiBackgroundRemovalMinutes: -1,
        maxWorkflows: -1,
        maxCustomTemplates: -1,
        maxBots: -1,
        apiCallsPerMonth: -1,
        maxStreamDestinations: -1,
        prioritySupport: true,
        customBranding: true,
        whiteLabel: true,
        teamMembers: -1,
        advancedAnalytics: true,
        exportCapabilities: true
      },
      badge: 'CONTACT SALES'
    }
  ]);

  // One-time purchase items
  readonly availablePurchases = signal<OneTimePurchase[]>([
    {
      id: 'premium-gaming-pack',
      name: 'Premium Gaming Template Pack',
      type: 'template-pack',
      description: '20 additional gaming-themed templates (Apex, Overwatch, Destiny, etc.)',
      price: 19.99,
      items: 20,
      category: 'gaming',
      rating: 4.8,
      downloads: 1234
    },
    {
      id: 'cinematic-overlays',
      name: 'Cinematic Overlay Collection',
      type: 'overlay-pack',
      description: 'Professional movie-style overlays and transitions',
      price: 14.99,
      items: 15,
      category: 'overlays',
      rating: 4.9,
      downloads: 892
    },
    {
      id: 'epic-sound-pack',
      name: 'Epic Sound Effects Pack',
      type: 'sound-pack',
      description: '500+ high-quality sound effects for alerts',
      price: 24.99,
      items: 500,
      category: 'audio',
      rating: 4.7,
      downloads: 2156
    },
    {
      id: 'anime-alert-pack',
      name: 'Anime Alert Animations',
      type: 'alert-pack',
      description: 'Anime-inspired alert animations with sound',
      price: 12.99,
      items: 25,
      category: 'anime',
      rating: 4.9,
      downloads: 1678
    },
    {
      id: 'sports-template-pack',
      name: 'Sports Broadcast Templates',
      type: 'template-pack',
      description: 'Professional sports broadcasting templates',
      price: 29.99,
      items: 12,
      category: 'sports',
      rating: 4.6,
      downloads: 543
    },
    {
      id: 'halloween-seasonal',
      name: 'Halloween Seasonal Pack',
      type: 'template-pack',
      description: 'Spooky templates, overlays, and alerts',
      price: 9.99,
      items: 10,
      category: 'seasonal',
      rating: 4.5,
      downloads: 321
    }
  ]);

  // Computed values
  readonly currentPlan = computed(() => {
    const tier = this.currentSubscription().tier;
    return this.plans().find(p => p.tier === tier);
  });

  readonly currentLimits = computed(() => {
    return this.currentPlan()?.limits;
  });

  readonly isTrialing = computed(() => {
    const sub = this.currentSubscription();
    return sub.status === 'trial' && sub.trialEndsAt && sub.trialEndsAt > new Date();
  });

  readonly trialDaysRemaining = computed(() => {
    const sub = this.currentSubscription();
    if (!this.isTrialing() || !sub.trialEndsAt) return 0;
    const diff = sub.trialEndsAt.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  readonly canUpgrade = computed(() => {
    const currentTier = this.currentSubscription().tier;
    return currentTier !== 'enterprise';
  });

  /**
   * Check if user has access to a feature
   */
  hasFeature(feature: string): boolean {
    const tier = this.currentSubscription().tier;
    const plan = this.plans().find(p => p.tier === tier);
    if (!plan) return false;

    // Check if feature is in the plan's features list
    return plan.features.some(f =>
      f.toLowerCase().includes(feature.toLowerCase())
    );
  }

  /**
   * Check if user can perform action based on limits
   */
  canPerformAction(action: keyof SubscriptionLimits, currentCount: number): {
    allowed: boolean;
    limit: number;
    remaining: number;
  } {
    const limits = this.currentLimits();
    if (!limits) return { allowed: false, limit: 0, remaining: 0 };

    const limit = limits[action] as number;

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, limit: -1, remaining: -1 };
    }

    const remaining = limit - currentCount;
    return {
      allowed: remaining > 0,
      limit,
      remaining
    };
  }

  /**
   * Check if AI background removal is available
   */
  canUseAIBackgroundRemoval(additionalMinutes: number = 1): {
    allowed: boolean;
    minutesRemaining: number;
  } {
    const limits = this.currentLimits();
    const usage = this.usageMetrics();

    if (!limits) return { allowed: false, minutesRemaining: 0 };

    const limit = limits.aiBackgroundRemovalMinutes;

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, minutesRemaining: -1 };
    }

    // No access at all
    if (limit === 0) {
      return { allowed: false, minutesRemaining: 0 };
    }

    const remaining = limit - usage.aiBackgroundRemovalUsed;
    return {
      allowed: remaining >= additionalMinutes,
      minutesRemaining: Math.max(0, remaining)
    };
  }

  /**
   * Check cloud storage availability
   */
  canUseCloudStorage(additionalGB: number = 0): {
    allowed: boolean;
    storageRemaining: number;
  } {
    const limits = this.currentLimits();
    const usage = this.usageMetrics();

    if (!limits) return { allowed: false, storageRemaining: 0 };

    const limit = limits.cloudStorageGB;

    if (limit === -1) {
      return { allowed: true, storageRemaining: -1 };
    }

    if (limit === 0) {
      return { allowed: false, storageRemaining: 0 };
    }

    const remaining = limit - usage.cloudStorageUsed;
    return {
      allowed: remaining >= additionalGB,
      storageRemaining: Math.max(0, remaining)
    };
  }

  /**
   * Start trial (14 days for any paid tier)
   */
  startTrial(tier: SubscriptionTier): UserSubscription {
    if (tier === 'free') {
      throw new Error('Cannot start trial for free tier');
    }

    const trialSub: UserSubscription = {
      userId: this.currentSubscription().userId,
      tier,
      interval: 'monthly',
      startDate: new Date(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      status: 'trial'
    };

    this.currentSubscription.set(trialSub);
    return trialSub;
  }

  /**
   * Upgrade/Downgrade subscription
   */
  changeSubscription(
    tier: SubscriptionTier,
    interval: BillingInterval
  ): void {
    const currentSub = this.currentSubscription();

    this.currentSubscription.set({
      ...currentSub,
      tier,
      interval,
      status: 'active',
      renewalDate: interval === 'lifetime'
        ? undefined
        : new Date(Date.now() + (interval === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
      trialEndsAt: undefined
    });
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(): void {
    const currentSub = this.currentSubscription();

    this.currentSubscription.set({
      ...currentSub,
      status: 'cancelled',
      cancelDate: new Date()
    });
  }

  /**
   * Purchase one-time item
   */
  purchaseItem(itemId: string): boolean {
    const item = this.availablePurchases().find(p => p.id === itemId);
    if (!item) return false;

    if (this.ownedPurchases().includes(itemId)) {
      console.error('Already purchased');
      return false;
    }

    this.ownedPurchases.update(owned => [...owned, itemId]);
    return true;
  }

  /**
   * Check if user owns a purchase
   */
  ownsPurchase(itemId: string): boolean {
    return this.ownedPurchases().includes(itemId);
  }

  /**
   * Track AI usage
   */
  trackAIUsage(minutes: number): void {
    this.usageMetrics.update(usage => ({
      ...usage,
      aiBackgroundRemovalUsed: usage.aiBackgroundRemovalUsed + minutes
    }));
  }

  /**
   * Track cloud storage usage
   */
  trackCloudStorage(gb: number): void {
    this.usageMetrics.update(usage => ({
      ...usage,
      cloudStorageUsed: gb
    }));
  }

  /**
   * Track API calls
   */
  trackAPICall(): void {
    this.usageMetrics.update(usage => ({
      ...usage,
      apiCallsUsed: usage.apiCallsUsed + 1
    }));
  }

  /**
   * Get pricing with discount (yearly saves ~17%)
   */
  getPriceWithDiscount(plan: SubscriptionPlan, interval: BillingInterval): {
    price: number;
    originalPrice?: number;
    discount?: number;
  } {
    const price = plan.prices[interval] ?? 0;

    if (interval === 'yearly') {
      const monthlyTotal = plan.prices.monthly * 12;
      const discount = Math.round(((monthlyTotal - price) / monthlyTotal) * 100);
      return {
        price,
        originalPrice: monthlyTotal,
        discount
      };
    }

    return { price };
  }

  /**
   * Get recommended upgrade
   */
  getRecommendedUpgrade(): SubscriptionPlan | null {
    const currentTier = this.currentSubscription().tier;
    const tierOrder: SubscriptionTier[] = ['free', 'pro', 'studio', 'enterprise'];
    const currentIndex = tierOrder.indexOf(currentTier);

    if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
      return null;
    }

    const nextTier = tierOrder[currentIndex + 1];
    return this.plans().find(p => p.tier === nextTier) || null;
  }

  /**
   * Calculate savings for yearly vs monthly
   */
  calculateYearlySavings(plan: SubscriptionPlan): number {
    const monthlyTotal = plan.prices.monthly * 12;
    return monthlyTotal - plan.prices.yearly;
  }

  /**
   * Reset monthly usage metrics
   */
  resetMonthlyUsage(): void {
    this.usageMetrics.update(usage => ({
      ...usage,
      aiBackgroundRemovalUsed: 0,
      apiCallsUsed: 0
    }));
  }
}
