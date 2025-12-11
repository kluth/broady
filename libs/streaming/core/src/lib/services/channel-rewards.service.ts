import { Injectable, signal, computed } from '@angular/core';

/**
 * Channel Rewards Service
 * Custom channel points rewards that viewers can redeem
 * Integrates with all stream features for max engagement!
 */

export interface ChannelReward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  color: string;
  enabled: boolean;
  requiresInput: boolean;
  inputPrompt?: string;
  cooldown: number; // seconds
  maxRedemptions?: number; // per stream
  category: RewardCategory;
  action: RewardAction;
  soundEffect?: string;
  alertMessage?: string;
  redemptionCount: number;
  lastRedeemed?: Date;
  createdAt: Date;
}

export type RewardCategory =
  | 'scene'
  | 'sound'
  | 'visual'
  | 'game'
  | 'chat'
  | 'challenge'
  | 'custom';

export interface RewardAction {
  type: RewardActionType;
  params: Record<string, any>;
}

export type RewardActionType =
  | 'switch-scene'
  | 'play-sound'
  | 'show-alert'
  | 'tts-message'
  | 'trigger-effect'
  | 'start-poll'
  | 'hydrate-reminder'
  | 'change-game'
  | 'enable-emote-only'
  | 'sub-only-mode'
  | 'highlight-message'
  | 'modify-title'
  | 'timeout-streamer'
  | 'choose-game'
  | 'add-overlay'
  | 'screen-shake'
  | 'color-change'
  | 'custom-script';

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  viewerId: string;
  viewerName: string;
  userInput?: string;
  redeemedAt: Date;
  status: 'pending' | 'fulfilled' | 'refunded' | 'cancelled';
  fulfilledAt?: Date;
}

export interface RewardTemplate {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  defaultCost: number;
  icon: string;
  color: string;
  action: RewardAction;
  popular: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChannelRewardsService {
  readonly rewards = signal<ChannelReward[]>([]);
  readonly redemptions = signal<RewardRedemption[]>([]);

  readonly enabledRewards = computed(() =>
    this.rewards().filter(r => r.enabled)
  );

  readonly pendingRedemptions = computed(() =>
    this.redemptions().filter(r => r.status === 'pending')
  );

  readonly statistics = computed(() => ({
    totalRewards: this.rewards().length,
    enabledRewards: this.enabledRewards().length,
    totalRedemptions: this.redemptions().length,
    pendingRedemptions: this.pendingRedemptions().length,
    totalPointsSpent: this.redemptions()
      .filter(r => r.status === 'fulfilled')
      .reduce((sum, r) => {
        const reward = this.rewards().find(rw => rw.id === r.rewardId);
        return sum + (reward?.cost || 0);
      }, 0)
  }));

  // Pre-built reward templates
  readonly templates = signal<RewardTemplate[]>([
    // Scene Rewards
    {
      id: 'hydrate',
      name: 'Hydrate!',
      description: 'Force streamer to drink water',
      category: 'scene',
      defaultCost: 500,
      icon: '💧',
      color: '#4a90e2',
      action: {
        type: 'hydrate-reminder',
        params: {}
      },
      popular: true
    },
    {
      id: 'cam-off',
      name: 'Cam Off 1min',
      description: 'Turn off webcam for 1 minute',
      category: 'scene',
      defaultCost: 5000,
      icon: '📷',
      color: '#ff6b6b',
      action: {
        type: 'switch-scene',
        params: { scene: 'no-cam', duration: 60 }
      },
      popular: false
    },

    // Sound Rewards
    {
      id: 'airhorn',
      name: 'Airhorn',
      description: 'Play loud airhorn sound',
      category: 'sound',
      defaultCost: 300,
      icon: '📯',
      color: '#ffa500',
      action: {
        type: 'play-sound',
        params: { sound: 'airhorn', volume: 1.0 }
      },
      popular: true
    },
    {
      id: 'sad-trombone',
      name: 'Sad Trombone',
      description: 'Play when streamer fails',
      category: 'sound',
      defaultCost: 200,
      icon: '🎺',
      color: '#888888',
      action: {
        type: 'play-sound',
        params: { sound: 'sad-trombone' }
      },
      popular: true
    },
    {
      id: 'victory',
      name: 'Victory Music',
      description: 'Epic victory sound',
      category: 'sound',
      defaultCost: 400,
      icon: '🏆',
      color: '#ffd700',
      action: {
        type: 'play-sound',
        params: { sound: 'victory' }
      },
      popular: true
    },

    // Visual Effects
    {
      id: 'screen-shake',
      name: 'Screen Shake',
      description: 'Shake the entire screen',
      category: 'visual',
      defaultCost: 1000,
      icon: '📳',
      color: '#9b59b6',
      action: {
        type: 'screen-shake',
        params: { intensity: 5, duration: 3 }
      },
      popular: true
    },
    {
      id: 'rainbow-mode',
      name: 'Rainbow Mode',
      description: 'Rainbow colors for 30 seconds',
      category: 'visual',
      defaultCost: 800,
      icon: '🌈',
      color: '#e74c3c',
      action: {
        type: 'color-change',
        params: { effect: 'rainbow', duration: 30 }
      },
      popular: false
    },
    {
      id: 'confetti',
      name: 'Confetti Explosion',
      description: 'Celebrate with confetti',
      category: 'visual',
      defaultCost: 600,
      icon: '🎉',
      color: '#ff69b4',
      action: {
        type: 'trigger-effect',
        params: { effect: 'confetti' }
      },
      popular: true
    },

    // Game Rewards
    {
      id: 'choose-game',
      name: 'Choose Next Game',
      description: 'Pick what game we play next',
      category: 'game',
      defaultCost: 10000,
      icon: '🎮',
      color: '#2ecc71',
      action: {
        type: 'choose-game',
        params: { requiresInput: true }
      },
      popular: true
    },
    {
      id: 'increase-difficulty',
      name: 'Increase Difficulty',
      description: 'Make game harder',
      category: 'game',
      defaultCost: 2000,
      icon: '⚡',
      color: '#e74c3c',
      action: {
        type: 'custom-script',
        params: { script: 'increase-difficulty' }
      },
      popular: false
    },

    // Chat Rewards
    {
      id: 'highlight',
      name: 'Highlight Message',
      description: 'Highlight your message',
      category: 'chat',
      defaultCost: 400,
      icon: '✨',
      color: '#f39c12',
      action: {
        type: 'highlight-message',
        params: {}
      },
      popular: true
    },
    {
      id: 'emote-only',
      name: 'Emote Only 5min',
      description: 'Emote only mode for 5 minutes',
      category: 'chat',
      defaultCost: 3000,
      icon: '😀',
      color: '#95a5a6',
      action: {
        type: 'enable-emote-only',
        params: { duration: 300 }
      },
      popular: false
    },

    // Challenge Rewards
    {
      id: 'no-kill-challenge',
      name: 'Pacifist Mode',
      description: 'Win without killing anyone',
      category: 'challenge',
      defaultCost: 5000,
      icon: '☮️',
      color: '#27ae60',
      action: {
        type: 'custom-script',
        params: { script: 'no-kill-challenge' }
      },
      popular: false
    },
    {
      id: 'one-hand',
      name: 'One Hand Challenge',
      description: 'Play with one hand for 5 min',
      category: 'challenge',
      defaultCost: 4000,
      icon: '🖐️',
      color: '#d35400',
      action: {
        type: 'show-alert',
        params: { message: 'ONE HAND CHALLENGE ACTIVATED!' }
      },
      popular: true
    },

    // Custom TTS
    {
      id: 'tts-message',
      name: 'TTS Message',
      description: 'Text-to-speech your message',
      category: 'chat',
      defaultCost: 500,
      icon: '🗣️',
      color: '#3498db',
      action: {
        type: 'tts-message',
        params: { requiresInput: true }
      },
      popular: true
    },

    // Title/Category
    {
      id: 'modify-title',
      name: 'Modify Stream Title',
      description: 'Add text to stream title',
      category: 'custom',
      defaultCost: 8000,
      icon: '📝',
      color: '#8e44ad',
      action: {
        type: 'modify-title',
        params: { requiresInput: true }
      },
      popular: false
    }
  ]);

  /**
   * Create reward
   */
  createReward(config: Partial<ChannelReward>): ChannelReward {
    const reward: ChannelReward = {
      id: crypto.randomUUID(),
      title: config.title || 'New Reward',
      description: config.description || '',
      cost: config.cost || 1000,
      icon: config.icon || '⭐',
      color: config.color || '#4a90e2',
      enabled: config.enabled !== false,
      requiresInput: config.requiresInput || false,
      inputPrompt: config.inputPrompt,
      cooldown: config.cooldown || 0,
      maxRedemptions: config.maxRedemptions,
      category: config.category || 'custom',
      action: config.action || { type: 'show-alert', params: {} },
      soundEffect: config.soundEffect,
      alertMessage: config.alertMessage,
      redemptionCount: 0,
      createdAt: new Date()
    };

    this.rewards.update(r => [...r, reward]);
    return reward;
  }

  /**
   * Create from template
   */
  createFromTemplate(templateId: string, customConfig?: Partial<ChannelReward>): ChannelReward | null {
    const template = this.templates().find(t => t.id === templateId);
    if (!template) return null;

    return this.createReward({
      title: template.name,
      description: template.description,
      cost: template.defaultCost,
      icon: template.icon,
      color: template.color,
      category: template.category,
      action: template.action,
      requiresInput: template.action.params['requiresInput'] || false,
      ...customConfig
    });
  }

  /**
   * Redeem reward
   */
  async redeemReward(
    rewardId: string,
    viewerId: string,
    viewerName: string,
    userInput?: string
  ): Promise<RewardRedemption | null> {
    const reward = this.rewards().find(r => r.id === rewardId);
    if (!reward || !reward.enabled) {
      console.error('Reward not available');
      return null;
    }

    // Check cooldown
    if (reward.lastRedeemed && reward.cooldown > 0) {
      const timeSince = (Date.now() - reward.lastRedeemed.getTime()) / 1000;
      if (timeSince < reward.cooldown) {
        console.error('Reward on cooldown');
        return null;
      }
    }

    // Check max redemptions
    if (reward.maxRedemptions && reward.redemptionCount >= reward.maxRedemptions) {
      console.error('Max redemptions reached');
      return null;
    }

    // Create redemption
    const redemption: RewardRedemption = {
      id: crypto.randomUUID(),
      rewardId,
      rewardTitle: reward.title,
      viewerId,
      viewerName,
      userInput,
      redeemedAt: new Date(),
      status: 'pending'
    };

    this.redemptions.update(r => [...r, redemption]);

    // Update reward stats
    this.rewards.update(rewards =>
      rewards.map(r =>
        r.id === rewardId
          ? { ...r, redemptionCount: r.redemptionCount + 1, lastRedeemed: new Date() }
          : r
      )
    );

    // Execute action
    await this.executeRewardAction(reward, redemption);

    return redemption;
  }

  /**
   * Execute reward action
   */
  private async executeRewardAction(reward: ChannelReward, redemption: RewardRedemption): Promise<void> {
    try {
      // Lazy load StreamActionsService
      const { StreamActionsService } = await import('./stream-actions.service');
      const actionsService = new StreamActionsService();

      // Play sound effect if specified
      if (reward.soundEffect) {
        await actionsService.playSound(reward.soundEffect);
      }

      // Show alert if specified
      if (reward.alertMessage) {
        await actionsService.showAlert({
          message: reward.alertMessage,
          title: reward.title,
          duration: 5000
        });
      }

      // Execute specific action
      switch (reward.action.type) {
        case 'play-sound':
          await actionsService.playSound(reward.action.params['sound']);
          break;

        case 'switch-scene':
          await actionsService.switchScene(reward.action.params['scene']);
          break;

        case 'show-alert':
          await actionsService.showAlert({
            message: reward.alertMessage || `${redemption.viewerName} redeemed ${reward.title}!`,
            title: reward.title,
            duration: reward.action.params['duration'] || 5000
          });
          break;

        case 'tts-message':
          const ttsText = redemption.userInput || `${redemption.viewerName} redeemed ${reward.title}`;
          await actionsService.speak(ttsText);
          break;

        case 'highlight-message':
          actionsService.highlightMessage(redemption.viewerName, redemption.userInput);
          break;

        case 'trigger-effect':
          const effect = reward.action.params['effect'];
          if (effect === 'screen-shake') {
            actionsService.triggerScreenShake();
          } else {
            actionsService.applyColorEffect(effect);
          }
          break;

        case 'hydrate-reminder':
          await actionsService.showAlert({
            message: '💧 Time to Hydrate! 💧',
            title: 'Hydration Break',
            duration: 8000,
            sound: '/assets/sounds/hydrate.mp3'
          });
          break;

        case 'screen-shake':
          actionsService.triggerScreenShake(
            reward.action.params['intensity'] || 10,
            reward.action.params['duration'] || 500
          );
          break;

        case 'color-change':
          actionsService.applyColorEffect(
            reward.action.params['effect'] || 'hue-rotate',
            reward.action.params['duration'] || 3000
          );
          break;

        default:
          console.log('Custom action:', reward.action.type);
      }
    } catch (error) {
      console.error('Failed to execute reward action:', error);
      throw error;
    }

    // Mark as fulfilled
    this.fulfillRedemption(redemption.id);
  }

  /**
   * Fulfill redemption
   */
  fulfillRedemption(redemptionId: string): void {
    this.redemptions.update(redemptions =>
      redemptions.map(r =>
        r.id === redemptionId
          ? { ...r, status: 'fulfilled' as const, fulfilledAt: new Date() }
          : r
      )
    );
  }

  /**
   * Refund redemption
   */
  refundRedemption(redemptionId: string): void {
    const redemption = this.redemptions().find(r => r.id === redemptionId);
    if (!redemption) return;

    this.redemptions.update(redemptions =>
      redemptions.map(r =>
        r.id === redemptionId
          ? { ...r, status: 'refunded' as const }
          : r
      )
    );

    // Decrement reward count
    this.rewards.update(rewards =>
      rewards.map(r =>
        r.id === redemption.rewardId
          ? { ...r, redemptionCount: Math.max(0, r.redemptionCount - 1) }
          : r
      )
    );
  }

  /**
   * Update reward
   */
  updateReward(rewardId: string, updates: Partial<ChannelReward>): void {
    this.rewards.update(rewards =>
      rewards.map(r => r.id === rewardId ? { ...r, ...updates } : r)
    );
  }

  /**
   * Toggle reward
   */
  toggleReward(rewardId: string): void {
    this.rewards.update(rewards =>
      rewards.map(r =>
        r.id === rewardId ? { ...r, enabled: !r.enabled } : r
      )
    );
  }

  /**
   * Delete reward
   */
  deleteReward(rewardId: string): void {
    this.rewards.update(r => r.filter(reward => reward.id !== rewardId));
  }

  /**
   * Get reward redemptions
   */
  getRewardRedemptions(rewardId: string): RewardRedemption[] {
    return this.redemptions().filter(r => r.rewardId === rewardId);
  }

  /**
   * Get viewer redemptions
   */
  getViewerRedemptions(viewerId: string): RewardRedemption[] {
    return this.redemptions().filter(r => r.viewerId === viewerId);
  }

  /**
   * Reset redemption counts
   */
  resetRedemptionCounts(): void {
    this.rewards.update(rewards =>
      rewards.map(r => ({ ...r, redemptionCount: 0 }))
    );
  }

  /**
   * Get popular templates
   */
  getPopularTemplates(): RewardTemplate[] {
    return this.templates().filter(t => t.popular);
  }

  /**
   * Export rewards
   */
  exportRewards(): string {
    return JSON.stringify(this.rewards(), null, 2);
  }

  /**
   * Import rewards
   */
  importRewards(json: string): boolean {
    try {
      const rewards = JSON.parse(json) as ChannelReward[];
      rewards.forEach(r => r.id = crypto.randomUUID());
      this.rewards.set(rewards);
      return true;
    } catch {
      return false;
    }
  }
}
