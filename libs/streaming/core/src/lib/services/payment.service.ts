import { Injectable, signal, computed } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js'; // Import Stripe.js

/**
 * Payment Service
 * Integrates with multiple payment providers
 */

export type PaymentProvider =
  | 'stripe'
  | 'paypal'
  | 'paddle'
  | 'lemon-squeezy'
  | 'coinbase'
  | 'apple-pay'
  | 'google-pay';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'BTC' | 'ETH';

export interface PaymentMethod {
  id: string;
  provider: PaymentProvider;
  type: 'card' | 'paypal' | 'bank' | 'crypto' | 'wallet';
  last4?: string;
  brand?: string; // 'visa', 'mastercard', etc.
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingEmail?: string;
  billingAddress?: BillingAddress;
}

export interface BillingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  provider: PaymentProvider;
  status: PaymentStatus;
  description: string;
  metadata: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'subscription' | 'one-time' | 'refund';
  amount: number;
  currency: Currency;
  provider: PaymentProvider;
  status: PaymentStatus;
  description: string;
  itemId?: string; // subscription or purchase ID
  invoiceUrl?: string;
  receiptUrl?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface ProviderConfig {
  provider: PaymentProvider;
  enabled: boolean;
  publishableKey?: string; // Changed from apiKey to publishableKey for frontend
  webhookSecret?: string;
  sandbox: boolean;
  supportedCurrencies: Currency[];
  supportedPaymentTypes: string[];
  fees: {
    percentage: number;
    fixed: number;
  };
}

export interface CheckoutSession {
  id: string;
  provider: PaymentProvider;
  amount: number;
  currency: Currency;
  type: 'subscription' | 'one-time';
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, any>;
  expiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private stripePromise: Promise<Stripe | null>;

  // Payment methods
  readonly paymentMethods = signal<PaymentMethod[]>([]);

  // Transaction history
  readonly transactions = signal<Transaction[]>([]);

  // Active payment intents
  readonly paymentIntents = signal<PaymentIntent[]>([]);

  // Provider configurations
  readonly providerConfigs = signal<ProviderConfig[]>([
    {
      provider: 'stripe',
      enabled: true,
      sandbox: true,
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      supportedPaymentTypes: ['card', 'bank', 'wallet'],
      fees: {
        percentage: 2.9,
        fixed: 0.30
      }
    },
    {
      provider: 'paypal',
      enabled: true,
      sandbox: true,
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      supportedPaymentTypes: ['paypal', 'card'],
      fees: {
        percentage: 3.49,
        fixed: 0.49
      }
    },
    {
      provider: 'paddle',
      enabled: true,
      sandbox: true,
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      supportedPaymentTypes: ['card', 'paypal'],
      fees: {
        percentage: 5.0,
        fixed: 0.50
      }
    },
    {
      provider: 'lemon-squeezy',
      enabled: true,
      sandbox: true,
      supportedCurrencies: ['USD', 'EUR'],
      supportedPaymentTypes: ['card', 'paypal'],
      fees: {
        percentage: 5.0,
        fixed: 0.50
      }
    },
    {
      provider: 'coinbase',
      enabled: true,
      sandbox: true,
      supportedCurrencies: ['BTC', 'ETH', 'USD'],
      supportedPaymentTypes: ['crypto'],
      fees: {
        percentage: 1.0,
        fixed: 0
      }
    },
    {
      provider: 'apple-pay',
      enabled: true,
      sandbox: true,
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
      supportedPaymentTypes: ['wallet'],
      fees: {
        percentage: 2.9,
        fixed: 0.30
      }
    },
    {
      provider: 'google-pay',
      enabled: true,
      sandbox: true,
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
      supportedPaymentTypes: ['wallet'],
      fees: {
        percentage: 2.9,
        fixed: 0.30
      }
    }
  ]);

  // Computed values
  readonly defaultPaymentMethod = computed(() =>
    this.paymentMethods().find(pm => pm.isDefault)
  );

  readonly totalSpent = computed(() =>
    this.transactions()
      .filter(t => t.status === 'completed' && t.type !== 'refund')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  readonly enabledProviders = computed(() =>
    this.providerConfigs().filter(p => p.enabled)
  );

  constructor() {
    // Load Stripe.js if Stripe is enabled
    const stripeConfig = this.providerConfigs().find(p => p.provider === 'stripe' && p.enabled);
    if (stripeConfig?.publishableKey) {
      this.stripePromise = loadStripe(stripeConfig.publishableKey);
    } else {
      this.stripePromise = Promise.resolve(null);
    }
  }

  /**
   * Initializes a payment provider with its publishable key.
   * Only needed for client-side SDKs like Stripe.js.
   */
  async initializeProvider(provider: PaymentProvider, publishableKey: string): Promise<void> {
    const config = this.providerConfigs().find(p => p.provider === provider);
    if (!config) {
      console.error(`Provider ${provider} not found in configuration.`);
      return;
    }

    // For Stripe, load Stripe.js
    if (provider === 'stripe') {
      this.stripePromise = loadStripe(publishableKey);
      this.updateProviderConfig(provider, { publishableKey, enabled: true });
    } else {
      // For other providers, we just store the key (if applicable)
      this.updateProviderConfig(provider, { publishableKey, enabled: true });
    }
    console.log(`${provider} initialized with key:`, publishableKey);
  }

  /**
   * Create checkout session for subscription (Stripe only for now)
   */
  async createSubscriptionCheckout(
    provider: PaymentProvider,
    planId: string,
    interval: 'monthly' | 'yearly',
    currency: Currency = 'USD'
  ): Promise<void> { // Changed return type to void as it redirects
    if (provider !== 'stripe') {
      throw new Error(`Provider ${provider} not supported for subscriptions via direct checkout flow.`);
    }

    try {
      // Call backend to create a Stripe Checkout Session
      const response = await fetch('http://localhost:3333/api/payment/create-checkout-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: this.getPlanPrice(planId, interval), // You'll need to implement this
            currency: currency,
            type: 'subscription',
            itemId: planId,
            successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/checkout/cancel`,
          }),
        });
      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await this.stripePromise;
      if (stripe) {
        const { error } = await (stripe as any).redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe Checkout Error:', error);
          throw new Error(error.message || 'Stripe checkout failed.');
        }
      } else {
        throw new Error('Stripe.js not loaded.');
      }
    } catch (error) {
      console.error('Failed to create subscription checkout:', error);
      throw error;
    }
  }

  /**
   * Create checkout for one-time purchase (Stripe only for now)
   */
  async createOneTimeCheckout(
    provider: PaymentProvider,
    itemId: string,
    amount: number,
    currency: Currency = 'USD'
  ): Promise<void> { // Changed return type to void as it redirects
    if (provider !== 'stripe') {
      throw new Error(`Provider ${provider} not supported for one-time payments via direct checkout flow.`);
    }

    try {
      // Call backend to create a Stripe Checkout Session
      const response = await fetch('http://localhost:3333/api/payment/create-checkout-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency: currency,
            type: 'payment', // Changed from 'one-time' to 'payment' for Stripe session mode
            itemId: itemId,
            successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/checkout/cancel`,
          }),
        });
      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await this.stripePromise;
      if (stripe) {
        const { error } = await (stripe as any).redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe Checkout Error:', error);
          throw new Error(error.message || 'Stripe checkout failed.');
        }
      } else {
        throw new Error('Stripe.js not loaded.');
      }
    } catch (error) {
      console.error('Failed to create one-time checkout:', error);
      throw error;
    }
  }

  // Helper to get plan price (you'll need to implement this based on your plan definitions)
  private getPlanPrice(planId: string, interval: 'monthly' | 'yearly'): number {
    // This is a placeholder. You should fetch actual plan prices from your subscription service
    // or pass them down. For Stripe, amount should be in cents.
    switch (planId) {
      case 'pro-plan':
        return interval === 'monthly' ? 1499 : 14999; // $14.99 or $149.99
      case 'studio-plan':
        return interval === 'monthly' ? 4999 : 49999; // $49.99 or $499.99
      default:
        return 0;
    }
  }

  /**
   * Add payment method (Frontend-only mock for now, ideally handled by provider UI)
   */
  async addPaymentMethod(
    provider: PaymentProvider,
    methodData: Partial<PaymentMethod>
  ): Promise<PaymentMethod> {
    const method: PaymentMethod = {
      id: crypto.randomUUID(),
      provider,
      type: methodData.type || 'card',
      last4: methodData.last4,
      brand: methodData.brand,
      expiryMonth: methodData.expiryMonth,
      expiryYear: methodData.expiryYear,
      isDefault: this.paymentMethods().length === 0, // First method is default
      billingEmail: methodData.billingEmail,
      billingAddress: methodData.billingAddress
    };

    this.paymentMethods.update(methods => [...methods, method]);

    console.log('Payment method added:', method);

    return method;
  }

  /**
   * Remove payment method (Frontend-only mock for now)
   */
  async removePaymentMethod(methodId: string): Promise<void> {
    const method = this.paymentMethods().find(m => m.id === methodId);
    if (!method) throw new Error('Payment method not found');

    console.log('Removing payment method:', methodId);

    this.paymentMethods.update(methods =>
      methods.filter(m => m.id !== methodId)
    );
  }

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod(methodId: string): void {
    this.paymentMethods.update(methods =>
      methods.map(m => ({
        ...m,
        isDefault: m.id === methodId
      }))
    );
  }

  /**
   * Process payment - No longer used for Stripe checkout flow
   * Direct Stripe Checkout will handle the payment intent creation and confirmation.
   */
  async processPayment(
    amount: number,
    currency: Currency,
    provider: PaymentProvider,
    description: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    throw new Error('processPayment is deprecated for Stripe Checkout flow. Use createSubscriptionCheckout or createOneTimeCheckout.');
  }

  /**
   * Complete payment (private helper, likely handled by backend webhooks now)
   */
  private completePayment(intentId: string, success: boolean): void {
    // This logic is mostly handled by backend webhooks.
    console.warn(`Frontend completePayment called for intent ${intentId}. This should ideally be driven by backend webhook confirmation.`);
    this.paymentIntents.update(intents =>
      intents.map(i =>
        i.id === intentId
          ? {
              ...i,
              status: success ? 'completed' : 'failed',
              completedAt: new Date()
            }
          : i
      )
    );

    const intent = this.paymentIntents().find(i => i.id === intentId);
    if (intent && success) {
      this.addTransaction({
        userId: 'current-user', // TODO: Get actual user ID
        type: intent.metadata['type'] || 'one-time',
        amount: intent.amount,
        currency: intent.currency,
        provider: intent.provider,
        status: 'completed',
        description: intent.description,
        itemId: intent.metadata['itemId'],
        metadata: intent.metadata
      });
    }
  }

  /**
   * Refund payment (Backend only)
   */
  async refundPayment(transactionId: string, amount?: number): Promise<Transaction> {
    // This should ideally be a backend call to Stripe API
    throw new Error('Refunds must be initiated from the backend to prevent client-side manipulation.');
  }

  /**
   * Add transaction (private helper, mostly for backend-driven transactions)
   */
  private addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date()
    };

    this.transactions.update(t => [...t, transaction]);
    return transaction;
  }

  /**
   * Get transactions by date range
   */
  getTransactionsByDateRange(startDate: Date, endDate: Date): Transaction[] {
    return this.transactions().filter(
      t => t.createdAt >= startDate && t.createdAt <= endDate
    );
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: Transaction['type']): Transaction[] {
    return this.transactions().filter(t => t.type === type);
  }

  /**
   * Calculate fees for amount
   */
  calculateFees(provider: PaymentProvider, amount: number): number {
    const config = this.providerConfigs().find(p => p.provider === provider);
    if (!config) return 0;

    return (amount * config.fees.percentage / 100) + config.fees.fixed;
  }

  /**
   * Get net amount after fees
   */
  getNetAmount(provider: PaymentProvider, grossAmount: number): number {
    const fees = this.calculateFees(provider, grossAmount);
    return grossAmount - fees;
  }

  /**
   * Update provider config
   */
  private updateProviderConfig(
    provider: PaymentProvider,
    updates: Partial<ProviderConfig>
  ): void {
    this.providerConfigs.update(configs =>
      configs.map(c =>
        c.provider === provider
          ? { ...c, ...updates }
          : c
      )
    );
  }

  /**
   * Verify webhook signature (no longer applicable on frontend)
   */
  async verifyWebhook(
    provider: PaymentProvider,
    payload: string,
    signature: string
  ): Promise<boolean> {
    console.error('Frontend should not verify webhooks. This is a backend task.');
    return false;
  }

  /**
   * Handle webhook event (no longer applicable on frontend)
   */
  async handleWebhook(
    provider: PaymentProvider,
    event: any
  ): Promise<void> {
    console.error('Frontend should not handle webhooks. This is a backend task.');
  }

  /**
   * Generate invoice
   */
  generateInvoice(transactionId: string): string {
    const transaction = this.transactions().find(t => t.id === transactionId);
    if (!transaction) throw new Error('Transaction not found');

    // In real implementation, generate PDF invoice (often backend driven)
    const invoiceUrl = `/invoices/${transaction.id}.pdf`;

    this.transactions.update(transactions =>
      transactions.map(t =>
        t.id === transactionId
          ? { ...t, invoiceUrl }
          : t
      )
    );

    return invoiceUrl;
  }

  /**
   * Export transaction history
   */
  exportTransactions(format: 'csv' | 'json' | 'pdf' = 'csv'): string {
    const transactions = this.transactions();

    switch (format) {
      case 'csv':
        const headers = ['Date', 'Type', 'Description', 'Amount', 'Currency', 'Status', 'Provider'];
        const rows = transactions.map(t => [
          t.createdAt.toISOString(),
          t.type,
          t.description,
          t.amount.toString(),
          t.currency,
          t.status,
          t.provider
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');

      case 'json':
        return JSON.stringify(transactions, null, 2);

      case 'pdf':
        // In real implementation, generate PDF (often backend driven)
        return '/exports/transactions.pdf';

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}