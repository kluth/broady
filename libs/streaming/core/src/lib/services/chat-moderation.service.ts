import { Injectable, signal, inject } from '@angular/core';
import { AIService } from './ai.service';
import * as tf from '@tensorflow/tfjs';
import * as toxicity from '@tensorflow-models/toxicity';

/**
 * Chat Moderation Service
 * AI-powered chat moderation with spam detection, toxic content filtering, and auto-moderation
 */

export interface ModerationRule {
  id: string;
  name: string;
  type: 'spam' | 'toxic' | 'caps' | 'links' | 'emotes' | 'custom';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  action: 'warn' | 'timeout' | 'ban' | 'delete';
  duration?: number; // timeout duration in seconds
  pattern?: string; // regex pattern for custom rules
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  flagged: boolean;
  flagReason?: string;
  moderated: boolean;
  moderationAction?: string;
}

export interface ModerationAction {
  id: string;
  messageId: string;
  userId: string;
  action: 'warn' | 'timeout' | 'ban' | 'delete';
  reason: string;
  timestamp: Date;
  automated: boolean;
}

export interface ToxicityAnalysis {
  score: number; // 0-1
  categories: {
    toxicity: number;
    severeToxicity: number;
    obscene: number;
    threat: number;
    insult: number;
    identityAttack: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatModerationService {
  private ai = inject(AIService);

  readonly isEnabled = signal(true);
  readonly autoModerate = signal(true);
  
  readonly rules = signal<ModerationRule[]>([
    { id: '1', name: 'Spam Detection', type: 'spam', enabled: true, severity: 'medium', action: 'timeout', duration: 300 },
    { id: '2', name: 'Toxic Language', type: 'toxic', enabled: true, severity: 'high', action: 'timeout', duration: 600 },
    { id: '3', name: 'Excessive Caps', type: 'caps', enabled: true, severity: 'low', action: 'warn' },
    { id: '4', name: 'Link Spam', type: 'links', enabled: true, severity: 'medium', action: 'delete' },
    { id: '5', name: 'Emote Spam', type: 'emotes', enabled: true, severity: 'low', action: 'warn' },
  ]);

  readonly flaggedMessages = signal<ChatMessage[]>([]);
  readonly moderationActions = signal<ModerationAction[]>([]);
  readonly bannedUsers = signal<Set<string>>(new Set());
  readonly timeoutUsers = signal<Map<string, Date>>(new Map());

  readonly statistics = signal({
    totalMessages: 0,
    flaggedMessages: 0,
    autoModerated: 0,
    manualModerated: 0,
    bannedCount: 0,
    timeoutCount: 0
  });

  // Spam detection state
  private messageHistory = new Map<string, string[]>();
  private messageCounts = new Map<string, number>();
  private toxicityModel: toxicity.ToxicityClassifier | null = null;

  constructor() {
    this.loadToxicityModel();
  }

  private async loadToxicityModel() {
    try {
      // Threshold of 0.7
      this.toxicityModel = await toxicity.load(0.7, []);
      console.log('Toxicity model loaded');
    } catch (error) {
      console.error('Failed to load toxicity model:', error);
    }
  }

  async moderateMessage(message: ChatMessage): Promise<boolean> {
    if (!this.isEnabled()) return true;

    // Check if user is banned
    if (this.bannedUsers().has(message.userId)) {
      return false;
    }

    // Check if user is timed out
    const timeoutUntil = this.timeoutUsers().get(message.userId);
    if (timeoutUntil && timeoutUntil > new Date()) {
      return false;
    }

    let flagged = false;
    let flagReason = '';

    // Run moderation checks
    for (const rule of this.rules()) {
      if (!rule.enabled) continue;

      const violated = await this.checkRule(message, rule);
      if (violated) {
        flagged = true;
        flagReason = rule.name;

        if (this.autoModerate()) {
          this.performModeration(message, rule);
        }
        break;
      }
    }

    if (flagged) {
      this.flaggedMessages.update(m => [{
        ...message,
        flagged: true,
        flagReason,
        moderated: this.autoModerate()
      }, ...m].slice(0, 100));

      this.statistics.update(s => ({
        ...s,
        totalMessages: s.totalMessages + 1,
        flaggedMessages: s.flaggedMessages + 1,
        autoModerated: this.autoModerate() ? s.autoModerated + 1 : s.autoModerated
      }));
    } else {
      this.statistics.update(s => ({
        ...s,
        totalMessages: s.totalMessages + 1
      }));
    }

    return !flagged || !this.autoModerate();
  }

  private async checkRule(message: ChatMessage, rule: ModerationRule): Promise<boolean> {
    switch (rule.type) {
      case 'spam':
        return this.detectSpam(message);
      
      case 'toxic':
        return await this.detectToxicity(message);
      
      case 'caps':
        return this.detectExcessiveCaps(message);
      
      case 'links':
        return this.detectLinks(message);
      
      case 'emotes':
        return this.detectEmoteSpam(message);
      
      case 'custom':
        return this.checkCustomPattern(message, rule.pattern || '');
      
      default:
        return false;
    }
  }

  private detectSpam(message: ChatMessage): boolean {
    const userId = message.userId;
    const now = Date.now();

    // Track message history
    if (!this.messageHistory.has(userId)) {
      this.messageHistory.set(userId, []);
      this.messageCounts.set(userId, 0);
    }

    const history = this.messageHistory.get(userId)!;
    history.push(message.message);

    // Check for duplicate messages
    const recentMessages = history.slice(-5);
    const duplicates = recentMessages.filter(m => m === message.message).length;
    if (duplicates >= 3) {
      return true; // Spam: Same message repeated
    }

    // Check message rate
    const count = (this.messageCounts.get(userId) || 0) + 1;
    this.messageCounts.set(userId, count);

    setTimeout(() => {
      const newCount = (this.messageCounts.get(userId) || 0) - 1;
      this.messageCounts.set(userId, Math.max(0, newCount));
    }, 5000); // Reset after 5 seconds

    if (count > 5) {
      return true; // Spam: Too many messages
    }

    return false;
  }

  private async detectToxicity(message: ChatMessage): Promise<boolean> {
    // Use AI service to detect toxicity
    const analysis = await this.analyzeToxicity(message.message);
    
    // Consider toxic if any category exceeds threshold
    const threshold = 0.7;
    return analysis.score > threshold || 
           Object.values(analysis.categories).some(score => score > threshold);
  }

  private async analyzeToxicity(text: string): Promise<ToxicityAnalysis> {
    if (this.toxicityModel) {
      try {
        const predictions = await this.toxicityModel.classify([text]);
        // predictions is an array of objects { label, results: [{ match, probabilities }] }
        
        const categories: any = {};
        let maxScore = 0;

        predictions.forEach(prediction => {
          const probability = prediction.results[0].probabilities[1]; // probability of being true (toxic)
          categories[prediction.label] = probability;
          if (probability > maxScore) maxScore = probability;
        });

        // Map TensorFlow labels to our categories structure
        return {
          score: maxScore,
          categories: {
            toxicity: categories['toxicity'] || 0,
            severeToxicity: categories['severe_toxicity'] || 0,
            obscene: categories['obscene'] || 0,
            threat: categories['threat'] || 0,
            insult: categories['insult'] || 0,
            identityAttack: categories['identity_attack'] || 0
          }
        };
      } catch (error) {
        console.error('Toxicity analysis failed:', error);
      }
    }

    // Fallback if model not loaded or error
    const hasBadWords = /\b(hate|stupid|idiot|dumb)\b/i.test(text);
    const hasThreats = /\b(kill|hurt|attack)\b/i.test(text);
    const hasInsults = /\b(loser|trash|garbage)\b/i.test(text);

    const baseScore = (hasBadWords ? 0.3 : 0) + (hasThreats ? 0.5 : 0) + (hasInsults ? 0.3 : 0);

    return {
      score: Math.min(1, baseScore + Math.random() * 0.2),
      categories: {
        toxicity: hasBadWords ? 0.7 + Math.random() * 0.3 : Math.random() * 0.3,
        severeToxicity: hasThreats ? 0.8 + Math.random() * 0.2 : Math.random() * 0.2,
        obscene: Math.random() * 0.4,
        threat: hasThreats ? 0.75 + Math.random() * 0.25 : Math.random() * 0.2,
        insult: hasInsults ? 0.7 + Math.random() * 0.3 : Math.random() * 0.3,
        identityAttack: Math.random() * 0.2
      }
    };
  }

  private detectExcessiveCaps(message: ChatMessage): boolean {
    const text = message.message;
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const totalLetters = (text.match(/[a-zA-Z]/g) || []).length;

    if (totalLetters < 10) return false; // Too short to judge

    const capsPercentage = capsCount / totalLetters;
    return capsPercentage > 0.7; // More than 70% caps
  }

  private detectLinks(message: ChatMessage): boolean {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9]+\.(com|net|org|io|tv|gg))/gi;
    return urlRegex.test(message.message);
  }

  private detectEmoteSpam(message: ChatMessage): boolean {
    // Count emotes (simplified - in production would check platform-specific emotes)
    const emoteRegex = /:[a-zA-Z0-9_]+:|<:[a-zA-Z0-9_]+:[0-9]+>/g;
    const emotes = message.message.match(emoteRegex) || [];
    
    return emotes.length > 10; // More than 10 emotes is spam
  }

  private checkCustomPattern(message: ChatMessage, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(message.message);
    } catch {
      return false;
    }
  }

  private performModeration(message: ChatMessage, rule: ModerationRule): void {
    const action: ModerationAction = {
      id: crypto.randomUUID(),
      messageId: message.id,
      userId: message.userId,
      action: rule.action,
      reason: rule.name,
      timestamp: new Date(),
      automated: true
    };

    switch (rule.action) {
      case 'ban':
        this.bannedUsers.update(set => new Set([...set, message.userId]));
        this.statistics.update(s => ({ ...s, bannedCount: s.bannedCount + 1 }));
        break;

      case 'timeout':
        const timeoutUntil = new Date(Date.now() + (rule.duration || 300) * 1000);
        this.timeoutUsers.update(map => new Map([...map, [message.userId, timeoutUntil]]));
        this.statistics.update(s => ({ ...s, timeoutCount: s.timeoutCount + 1 }));
        break;

      case 'delete':
        // Message is blocked from being displayed
        break;

      case 'warn':
        // Send warning to user
        console.log(`Warning user ${message.username}: ${rule.name}`);
        break;
    }

    this.moderationActions.update(a => [action, ...a].slice(0, 100));
  }

  manualModerate(messageId: string, action: ModerationAction['action'], reason: string): void {
    const message = this.flaggedMessages().find(m => m.id === messageId);
    if (!message) return;

    const moderationAction: ModerationAction = {
      id: crypto.randomUUID(),
      messageId,
      userId: message.userId,
      action,
      reason,
      timestamp: new Date(),
      automated: false
    };

    this.moderationActions.update(a => [moderationAction, ...a].slice(0, 100));
    this.statistics.update(s => ({ ...s, manualModerated: s.manualModerated + 1 }));

    // Perform the action
    if (action === 'ban') {
      this.bannedUsers.update(set => new Set([...set, message.userId]));
    } else if (action === 'timeout') {
      const timeoutUntil = new Date(Date.now() + 600000); // 10 minutes
      this.timeoutUsers.update(map => new Map([...map, [message.userId, timeoutUntil]]));
    }
  }

  unban(userId: string): void {
    this.bannedUsers.update(set => {
      const newSet = new Set(set);
      newSet.delete(userId);
      return newSet;
    });
  }

  clearTimeout(userId: string): void {
    this.timeoutUsers.update(map => {
      const newMap = new Map(map);
      newMap.delete(userId);
      return newMap;
    });
  }

  addRule(rule: Omit<ModerationRule, 'id'>): void {
    const newRule: ModerationRule = {
      ...rule,
      id: crypto.randomUUID()
    };
    this.rules.update(r => [...r, newRule]);
  }

  removeRule(id: string): void {
    this.rules.update(r => r.filter(rule => rule.id !== id));
  }

  toggleRule(id: string): void {
    this.rules.update(r =>
      r.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)
    );
  }
}
