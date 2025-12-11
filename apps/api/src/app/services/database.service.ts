import { Injectable } from '@nestjs/common';

/**
 * Database Service
 * Handles all database operations for users, payments, and subscriptions
 *
 * NOTE: This is a reference implementation. In production, replace with your actual database:
 * - PostgreSQL with TypeORM or Prisma
 * - MongoDB with Mongoose
 * - MySQL with Sequelize
 * - Or any other database of your choice
 */

export interface User {
  id: string;
  email: string;
  stripeCustomerId?: string;
  subscription?: {
    active: boolean;
    stripeSubscriptionId?: string;
    itemId?: string;
    status?: string;
    currentPeriodEnd?: Date;
    cancelAt?: Date;
  };
  premium: {
    active: boolean;
    features: string[];
    tier: 'free' | 'basic' | 'pro' | 'enterprise';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  itemId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DatabaseService {
  // In-memory storage for demo purposes
  // Replace with actual database calls in production
  private users: Map<string, User> = new Map();
  private payments: Map<string, Payment> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();

  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    const users = Array.from(this.users.values());
    return users.find(u => u.email === email) || null;
  }

  async findUserByStripeCustomerId(customerId: string): Promise<User | null> {
    const users = Array.from(this.users.values());
    return users.find(u => u.stripeCustomerId === customerId) || null;
  }

  async createUser(data: {
    email: string;
    stripeCustomerId?: string;
    itemId?: string;
  }): Promise<User> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id: userId,
      email: data.email,
      stripeCustomerId: data.stripeCustomerId,
      subscription: data.itemId ? {
        active: true,
        itemId: data.itemId,
        status: 'active'
      } : undefined,
      premium: {
        active: !!data.itemId,
        features: data.itemId ? this.getFeaturesForItem(data.itemId) : [],
        tier: data.itemId ? this.getTierForItem(data.itemId) : 'free'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(userId, user);
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(userId, updated);
    return updated;
  }

  async grantPremiumAccess(userId: string, itemId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    user.premium = {
      active: true,
      features: this.getFeaturesForItem(itemId),
      tier: this.getTierForItem(itemId)
    };
    user.updatedAt = new Date();
    this.users.set(userId, user);
  }

  async revokePremiumAccess(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    user.premium = {
      active: false,
      features: [],
      tier: 'free'
    };
    user.updatedAt = new Date();
    this.users.set(userId, user);
  }

  // Payment operations
  async createPayment(data: {
    userId: string;
    stripePaymentIntentId: string;
    amount: number;
    currency: string;
    itemId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Payment> {
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payment: Payment = {
      id: paymentId,
      userId: data.userId,
      stripePaymentIntentId: data.stripePaymentIntentId,
      amount: data.amount,
      currency: data.currency,
      status: 'completed',
      itemId: data.itemId,
      metadata: data.metadata,
      timestamp: new Date()
    };

    this.payments.set(paymentId, payment);
    return payment;
  }

  async updatePaymentStatus(
    paymentIntentId: string,
    status: Payment['status']
  ): Promise<Payment | null> {
    const payments = Array.from(this.payments.values());
    const payment = payments.find(p => p.stripePaymentIntentId === paymentIntentId);
    if (!payment) return null;

    payment.status = status;
    this.payments.set(payment.id, payment);
    return payment;
  }

  // Subscription operations
  async createSubscription(data: {
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    status: Subscription['status'];
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): Promise<Subscription> {
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subscription: Subscription = {
      id: subId,
      userId: data.userId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCustomerId: data.stripeCustomerId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.subscriptions.set(subId, subscription);
    return subscription;
  }

  async updateSubscription(
    stripeSubscriptionId: string,
    updates: Partial<Subscription>
  ): Promise<Subscription | null> {
    const subs = Array.from(this.subscriptions.values());
    const subscription = subs.find(s => s.stripeSubscriptionId === stripeSubscriptionId);
    if (!subscription) return null;

    const updated = { ...subscription, ...updates, updatedAt: new Date() };
    this.subscriptions.set(subscription.id, updated);
    return updated;
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<Subscription | null> {
    const subs = Array.from(this.subscriptions.values());
    const subscription = subs.find(s => s.stripeSubscriptionId === stripeSubscriptionId);
    if (!subscription) return null;

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    subscription.updatedAt = new Date();
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  // Helper methods
  private getFeaturesForItem(itemId: string): string[] {
    // Map item IDs to feature lists
    const featureMap: Record<string, string[]> = {
      'basic': ['hd_streaming', 'basic_overlays', 'chat_integration'],
      'pro': ['hd_streaming', 'basic_overlays', 'chat_integration', '4k_streaming', 'advanced_overlays', 'scene_collections', 'multistream'],
      'enterprise': ['hd_streaming', 'basic_overlays', 'chat_integration', '4k_streaming', 'advanced_overlays', 'scene_collections', 'multistream', 'priority_support', 'custom_branding', 'api_access']
    };

    return featureMap[itemId] || [];
  }

  private getTierForItem(itemId: string): User['premium']['tier'] {
    if (itemId.includes('enterprise')) return 'enterprise';
    if (itemId.includes('pro')) return 'pro';
    if (itemId.includes('basic')) return 'basic';
    return 'free';
  }
}

export const databaseService = new DatabaseService();
