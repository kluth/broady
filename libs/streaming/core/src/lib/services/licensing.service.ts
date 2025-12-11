import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { SubscriptionService, SubscriptionTier } from './subscription.service';

/**
 * Licensing & Feature Gating Service
 * Controls access to premium features based on subscription tier
 */

export type FeatureKey =
  // AI Features
  | 'ai-background-removal'
  | 'ai-voice-commands'
  | 'ai-scene-switching'
  | 'ai-chat-moderation'

  // Streaming Features
  | 'multi-streaming'
  | 'ndi-support'
  | 'virtual-camera'
  | 'custom-rtmp'
  | 'stream-delay'

  // Content Features
  | 'premium-templates'
  | 'custom-branding'
  | 'white-label'
  | 'unlimited-scenes'
  | 'unlimited-sources'

  // Automation
  | 'automation-workflows'
  | 'scripting-engine'
  | 'advanced-triggers'
  | 'webhook-integration'

  // Analytics & Data
  | 'advanced-analytics'
  | 'export-analytics'
  | 'viewer-insights'
  | 'performance-metrics'

  // Engagement
  | 'chat-minigames'
  | 'betting-system'
  | 'channel-rewards'
  | 'custom-alerts'

  // Integration
  | 'game-api-integration'
  | 'external-api-access'
  | 'marketplace-selling'

  // Storage & Cloud
  | 'cloud-storage'
  | 'cloud-sync'
  | 'cloud-rendering'

  // Support
  | 'priority-support'
  | 'dedicated-support';

export interface Feature {
  key: FeatureKey;
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
  category: 'ai' | 'streaming' | 'content' | 'automation' | 'analytics' | 'engagement' | 'integration' | 'storage' | 'support';
  limitKey?: keyof import('./subscription.service').SubscriptionLimits;
}

export interface FeatureCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionTier;
  limitReached?: boolean;
  currentUsage?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LicensingService {
  private subscriptionService = inject(SubscriptionService);

  // Feature definitions
  readonly features = signal<Feature[]>([
    // AI Features
    {
      key: 'ai-background-removal',
      name: 'AI Background Removal',
      description: 'Remove background without green screen using AI',
      requiredTier: 'pro',
      category: 'ai',
      limitKey: 'aiBackgroundRemovalMinutes'
    },
    {
      key: 'ai-voice-commands',
      name: 'AI Voice Commands',
      description: 'Control stream with voice commands',
      requiredTier: 'pro',
      category: 'ai'
    },
    {
      key: 'ai-scene-switching',
      name: 'AI Auto Scene Switching',
      description: 'Automatic scene switching based on content',
      requiredTier: 'studio',
      category: 'ai'
    },
    {
      key: 'ai-chat-moderation',
      name: 'AI Chat Moderation',
      description: 'AI-powered chat moderation and filtering',
      requiredTier: 'pro',
      category: 'ai'
    },

    // Streaming Features
    {
      key: 'multi-streaming',
      name: 'Multi-Platform Streaming',
      description: 'Stream to multiple platforms simultaneously',
      requiredTier: 'pro',
      category: 'streaming',
      limitKey: 'maxStreamDestinations'
    },
    {
      key: 'ndi-support',
      name: 'NDI Support',
      description: 'Network Device Interface support',
      requiredTier: 'studio',
      category: 'streaming'
    },
    {
      key: 'virtual-camera',
      name: 'Virtual Camera Output',
      description: 'Use Broady as virtual camera in other apps',
      requiredTier: 'studio',
      category: 'streaming'
    },
    {
      key: 'custom-rtmp',
      name: 'Custom RTMP Servers',
      description: 'Add unlimited custom RTMP destinations',
      requiredTier: 'pro',
      category: 'streaming'
    },
    {
      key: 'stream-delay',
      name: 'Stream Delay Control',
      description: 'Advanced stream delay settings',
      requiredTier: 'pro',
      category: 'streaming'
    },

    // Content Features
    {
      key: 'premium-templates',
      name: 'Premium Templates',
      description: 'Access to all premium stream templates',
      requiredTier: 'pro',
      category: 'content'
    },
    {
      key: 'custom-branding',
      name: 'Custom Branding',
      description: 'Remove Broady branding and add your own',
      requiredTier: 'studio',
      category: 'content',
      limitKey: 'customBranding'
    },
    {
      key: 'white-label',
      name: 'White Label',
      description: 'Complete white-label solution',
      requiredTier: 'enterprise',
      category: 'content',
      limitKey: 'whiteLabel'
    },
    {
      key: 'unlimited-scenes',
      name: 'Unlimited Scenes',
      description: 'Create unlimited scenes',
      requiredTier: 'pro',
      category: 'content',
      limitKey: 'maxScenes'
    },
    {
      key: 'unlimited-sources',
      name: 'Unlimited Sources',
      description: 'Add unlimited sources per scene',
      requiredTier: 'pro',
      category: 'content',
      limitKey: 'maxSources'
    },

    // Automation
    {
      key: 'automation-workflows',
      name: 'Automation Workflows',
      description: 'Create automated workflows',
      requiredTier: 'pro',
      category: 'automation',
      limitKey: 'maxWorkflows'
    },
    {
      key: 'scripting-engine',
      name: 'Scripting Engine',
      description: 'Advanced scripting capabilities',
      requiredTier: 'studio',
      category: 'automation'
    },
    {
      key: 'advanced-triggers',
      name: 'Advanced Triggers',
      description: 'Complex trigger conditions and actions',
      requiredTier: 'studio',
      category: 'automation'
    },
    {
      key: 'webhook-integration',
      name: 'Webhook Integration',
      description: 'Integrate with external services via webhooks',
      requiredTier: 'studio',
      category: 'automation'
    },

    // Analytics
    {
      key: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Detailed analytics and insights',
      requiredTier: 'pro',
      category: 'analytics',
      limitKey: 'advancedAnalytics'
    },
    {
      key: 'export-analytics',
      name: 'Export Analytics',
      description: 'Export analytics data to CSV/PDF',
      requiredTier: 'pro',
      category: 'analytics',
      limitKey: 'exportCapabilities'
    },
    {
      key: 'viewer-insights',
      name: 'Viewer Insights',
      description: 'Detailed viewer behavior insights',
      requiredTier: 'studio',
      category: 'analytics'
    },
    {
      key: 'performance-metrics',
      name: 'Performance Metrics',
      description: 'Stream performance and quality metrics',
      requiredTier: 'pro',
      category: 'analytics'
    },

    // Engagement
    {
      key: 'chat-minigames',
      name: 'Chat Mini-Games',
      description: 'Interactive chat games for viewers',
      requiredTier: 'pro',
      category: 'engagement'
    },
    {
      key: 'betting-system',
      name: 'Betting System',
      description: 'Viewer betting and predictions',
      requiredTier: 'pro',
      category: 'engagement'
    },
    {
      key: 'channel-rewards',
      name: 'Channel Rewards',
      description: 'Custom channel points rewards',
      requiredTier: 'pro',
      category: 'engagement'
    },
    {
      key: 'custom-alerts',
      name: 'Custom Alerts',
      description: 'Create unlimited custom alerts',
      requiredTier: 'pro',
      category: 'engagement'
    },

    // Integration
    {
      key: 'game-api-integration',
      name: 'Game API Integration',
      description: 'Integrate with game APIs (Steam, Riot, etc.)',
      requiredTier: 'studio',
      category: 'integration'
    },
    {
      key: 'external-api-access',
      name: 'External API Access',
      description: 'Access external APIs (weather, crypto, etc.)',
      requiredTier: 'pro',
      category: 'integration',
      limitKey: 'apiCallsPerMonth'
    },
    {
      key: 'marketplace-selling',
      name: 'Marketplace Selling',
      description: 'Sell your creations on marketplace',
      requiredTier: 'pro',
      category: 'integration'
    },

    // Storage
    {
      key: 'cloud-storage',
      name: 'Cloud Storage',
      description: 'Store recordings and assets in cloud',
      requiredTier: 'pro',
      category: 'storage',
      limitKey: 'cloudStorageGB'
    },
    {
      key: 'cloud-sync',
      name: 'Cloud Sync',
      description: 'Sync settings across devices',
      requiredTier: 'pro',
      category: 'storage'
    },
    {
      key: 'cloud-rendering',
      name: 'Cloud Rendering',
      description: 'Render clips and highlights in cloud',
      requiredTier: 'studio',
      category: 'storage'
    },

    // Support
    {
      key: 'priority-support',
      name: 'Priority Support',
      description: 'Priority email support',
      requiredTier: 'pro',
      category: 'support',
      limitKey: 'prioritySupport'
    },
    {
      key: 'dedicated-support',
      name: 'Dedicated Support',
      description: '24/7 dedicated support',
      requiredTier: 'enterprise',
      category: 'support'
    }
  ]);

  // Usage tracking
  readonly usageWarnings = signal<{
    feature: FeatureKey;
    message: string;
    timestamp: Date;
  }[]>([]);

  // Computed
  readonly currentTier = computed(() =>
    this.subscriptionService.currentSubscription().tier
  );

  readonly availableFeatures = computed(() => {
    const tier = this.currentTier();
    return this.features().filter(f =>
      this.isTierSufficient(tier, f.requiredTier)
    );
  });

  readonly lockedFeatures = computed(() => {
    const tier = this.currentTier();
    return this.features().filter(f =>
      !this.isTierSufficient(tier, f.requiredTier)
    );
  });

  constructor() {
    // Monitor usage and show warnings
    effect(() => {
      const usage = this.subscriptionService.usageMetrics();
      const limits = this.subscriptionService.currentLimits();

      if (!limits) return;

      // Check AI usage (90% warning)
      if (limits.aiBackgroundRemovalMinutes > 0) {
        const percentage = usage.aiBackgroundRemovalUsed / limits.aiBackgroundRemovalMinutes;
        if (percentage >= 0.9 && percentage < 1) {
          this.addUsageWarning(
            'ai-background-removal',
            `You've used ${Math.round(percentage * 100)}% of your AI background removal minutes this month`
          );
        }
      }

      // Check cloud storage (90% warning)
      if (limits.cloudStorageGB > 0) {
        const percentage = usage.cloudStorageUsed / limits.cloudStorageGB;
        if (percentage >= 0.9 && percentage < 1) {
          this.addUsageWarning(
            'cloud-storage',
            `You've used ${Math.round(percentage * 100)}% of your cloud storage`
          );
        }
      }
    });
  }

  /**
   * Check if user can access a feature
   */
  canAccessFeature(featureKey: FeatureKey): FeatureCheckResult {
    const feature = this.features().find(f => f.key === featureKey);
    if (!feature) {
      return {
        allowed: false,
        reason: 'Feature not found'
      };
    }

    const currentTier = this.currentTier();

    // Check tier requirement
    if (!this.isTierSufficient(currentTier, feature.requiredTier)) {
      return {
        allowed: false,
        reason: `This feature requires ${this.getTierName(feature.requiredTier)} or higher`,
        upgradeRequired: feature.requiredTier
      };
    }

    // Check specific limits if applicable
    if (feature.limitKey) {
      const limitCheck = this.checkLimit(feature.limitKey);
      if (!limitCheck.allowed) {
        return {
          allowed: false,
          reason: limitCheck.reason || 'Limit reached',
          limitReached: true,
          currentUsage: limitCheck.currentUsage,
          limit: limitCheck.limit
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if current usage is within limits
   */
  private checkLimit(limitKey: keyof import('./subscription.service').SubscriptionLimits): {
    allowed: boolean;
    reason?: string;
    currentUsage?: number;
    limit?: number;
  } {
    const limits = this.subscriptionService.currentLimits();
    const usage = this.subscriptionService.usageMetrics();

    if (!limits) return { allowed: false, reason: 'No subscription found' };

    const limit = limits[limitKey];

    // Boolean limits
    if (typeof limit === 'boolean') {
      return {
        allowed: limit,
        reason: limit ? undefined : 'Not available in your plan'
      };
    }

    // Numeric limits
    if (typeof limit === 'number') {
      // -1 means unlimited
      if (limit === -1) return { allowed: true };

      // 0 means not available
      if (limit === 0) {
        return {
          allowed: false,
          reason: 'Not available in your plan',
          limit: 0
        };
      }

      // Check specific usage
      let currentUsage = 0;
      switch (limitKey) {
        case 'aiBackgroundRemovalMinutes':
          currentUsage = usage.aiBackgroundRemovalUsed;
          break;
        case 'cloudStorageGB':
          currentUsage = usage.cloudStorageUsed;
          break;
        case 'apiCallsPerMonth':
          currentUsage = usage.apiCallsUsed;
          break;
        case 'maxWorkflows':
          currentUsage = usage.workflowsCreated;
          break;
        case 'maxCustomTemplates':
          currentUsage = usage.customTemplatesCreated;
          break;
        // Add more as needed
      }

      const allowed = currentUsage < limit;
      return {
        allowed,
        reason: allowed ? undefined : `You've reached your ${limitKey} limit`,
        currentUsage,
        limit
      };
    }

    return { allowed: true };
  }

  /**
   * Check if tier is sufficient
   */
  private isTierSufficient(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
    const tierOrder: SubscriptionTier[] = ['free', 'pro', 'studio', 'enterprise'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const requiredIndex = tierOrder.indexOf(requiredTier);
    return currentIndex >= requiredIndex;
  }

  /**
   * Get human-readable tier name
   */
  private getTierName(tier: SubscriptionTier): string {
    const names: Record<SubscriptionTier, string> = {
      'free': 'Free',
      'pro': 'Pro',
      'studio': 'Studio',
      'enterprise': 'Enterprise'
    };
    return names[tier];
  }

  /**
   * Get features by category
   */
  getFeaturesByCategory(category: Feature['category']): Feature[] {
    return this.features().filter(f => f.category === category);
  }

  /**
   * Get locked features that would be available in next tier
   */
  getUpgradeFeatures(): Feature[] {
    const currentTier = this.currentTier();
    const recommended = this.subscriptionService.getRecommendedUpgrade();

    if (!recommended) return [];

    return this.features().filter(f =>
      !this.isTierSufficient(currentTier, f.requiredTier) &&
      this.isTierSufficient(recommended.tier, f.requiredTier)
    );
  }

  /**
   * Show upgrade prompt
   */
  showUpgradePrompt(featureKey: FeatureKey): {
    feature: Feature;
    requiredTier: SubscriptionTier;
    tierName: string;
    message: string;
  } | null {
    const feature = this.features().find(f => f.key === featureKey);
    if (!feature) return null;

    const check = this.canAccessFeature(featureKey);
    if (check.allowed) return null;

    return {
      feature,
      requiredTier: feature.requiredTier,
      tierName: this.getTierName(feature.requiredTier),
      message: check.reason || 'Upgrade required'
    };
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureKey: FeatureKey, metadata?: Record<string, any>): void {
    console.log('Feature used:', featureKey, metadata);

    // In real implementation, send analytics
    // analytics.track('feature_used', { feature: featureKey, ...metadata });
  }

  /**
   * Add usage warning
   */
  private addUsageWarning(feature: FeatureKey, message: string): void {
    // Don't duplicate recent warnings
    const recent = this.usageWarnings().find(w =>
      w.feature === feature &&
      Date.now() - w.timestamp.getTime() < 60 * 60 * 1000 // 1 hour
    );

    if (recent) return;

    this.usageWarnings.update(warnings => [
      ...warnings,
      { feature, message, timestamp: new Date() }
    ]);
  }

  /**
   * Clear old warnings
   */
  clearOldWarnings(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.usageWarnings.update(warnings =>
      warnings.filter(w => w.timestamp.getTime() > oneDayAgo)
    );
  }

  /**
   * Quick checks for common features
   */
  canUseAI(): boolean {
    return this.canAccessFeature('ai-background-removal').allowed;
  }

  canMultiStream(): boolean {
    return this.canAccessFeature('multi-streaming').allowed;
  }

  canUseScripting(): boolean {
    return this.canAccessFeature('scripting-engine').allowed;
  }

  canSellOnMarketplace(): boolean {
    return this.canAccessFeature('marketplace-selling').allowed;
  }

  hasCloudStorage(): boolean {
    return this.canAccessFeature('cloud-storage').allowed;
  }

  hasPrioritySupport(): boolean {
    return this.canAccessFeature('priority-support').allowed;
  }
}
