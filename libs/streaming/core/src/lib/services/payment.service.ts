import { Injectable, signal, computed } from '@angular/core';

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
  apiKey?: string;
  secretKey?: string;
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

  /**
   * Initialize payment provider (Stripe example)
   */
  async initializeStripe(publishableKey: string): Promise<void> {
    try {
      // In real implementation, load Stripe.js
      // const stripe = await loadStripe(publishableKey);
      console.log('Stripe initialized with key:', publishableKey);

      this.updateProviderConfig('stripe', {
        apiKey: publishableKey,
        enabled: true
      });
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  /**
   * Initialize PayPal
   */
  async initializePayPal(clientId: string): Promise<void> {
    try {
      // In real implementation, load PayPal SDK
      console.log('PayPal initialized with client ID:', clientId);

      this.updateProviderConfig('paypal', {
        apiKey: clientId,
        enabled: true
      });
    } catch (error) {
      console.error('Failed to initialize PayPal:', error);
      throw error;
    }
  }

  /**
   * Initialize Paddle
   */
  async initializePaddle(vendorId: string): Promise<void> {
    try {
      // In real implementation, load Paddle.js
      console.log('Paddle initialized with vendor ID:', vendorId);

      this.updateProviderConfig('paddle', {
        apiKey: vendorId,
        enabled: true
      });
    } catch (error) {
      console.error('Failed to initialize Paddle:', error);
      throw error;
    }
  }

  /**
   * Initialize Lemon Squeezy
   */
  async initializeLemonSqueezy(storeId: string): Promise<void> {
    try {
      console.log('Lemon Squeezy initialized with store ID:', storeId);

      this.updateProviderConfig('lemon-squeezy', {
        apiKey: storeId,
        enabled: true
      });
    } catch (error) {
      console.error('Failed to initialize Lemon Squeezy:', error);
      throw error;
    }
  }

  /**
   * Initialize Coinbase Commerce
   */
  async initializeCoinbase(apiKey: string): Promise<void> {
    try {
      console.log('Coinbase Commerce initialized');

      this.updateProviderConfig('coinbase', {
        apiKey,
        enabled: true
      });
    } catch (error) {
      console.error('Failed to initialize Coinbase:', error);
      throw error;
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createSubscriptionCheckout(
    provider: PaymentProvider,
    planId: string,
    interval: 'monthly' | 'yearly',
    currency: Currency = 'USD'
  ): Promise<CheckoutSession> {
    const sessionId = crypto.randomUUID();

    const session: CheckoutSession = {
      id: sessionId,
      provider,
      amount: 0, // Will be set by provider
      currency,
      type: 'subscription',
      successUrl: `${window.location.origin}/checkout/success?session_id=${sessionId}`,
      cancelUrl: `${window.location.origin}/checkout/cancel`,
      metadata: {
        planId,
        interval,
        type: 'subscription'
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };

    // In real implementation, create session with provider
    switch (provider) {
      case 'stripe':
        console.log('Creating Stripe checkout session:', session);
        // await stripe.redirectToCheckout({ sessionId });
        break;

      case 'paypal':
        console.log('Creating PayPal subscription:', session);
        // PayPal Subscription API
        break;

      case 'paddle':
        console.log('Opening Paddle checkout:', session);
        // Paddle.Checkout.open({ product: planId });
        break;

      case 'lemon-squeezy':
        console.log('Creating Lemon Squeezy checkout:', session);
        // LemonSqueezy.Setup({ checkout: { ... } });
        break;

      default:
        throw new Error(`Provider ${provider} not supported for subscriptions`);
    }

    return session;
  }

  /**
   * Create checkout for one-time purchase
   */
  async createOneTimeCheckout(
    provider: PaymentProvider,
    itemId: string,
    amount: number,
    currency: Currency = 'USD'
  ): Promise<CheckoutSession> {
    const sessionId = crypto.randomUUID();

    const session: CheckoutSession = {
      id: sessionId,
      provider,
      amount,
      currency,
      type: 'one-time',
      successUrl: `${window.location.origin}/checkout/success?session_id=${sessionId}`,
      cancelUrl: `${window.location.origin}/checkout/cancel`,
      metadata: {
        itemId,
        type: 'one-time'
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    };

    switch (provider) {
      case 'stripe':
      case 'paypal':
      case 'paddle':
      case 'lemon-squeezy':
        console.log(`Creating ${provider} one-time checkout:`, session);
        break;

      case 'coinbase':
        console.log('Creating Coinbase Commerce charge:', session);
        // Create charge for crypto payment
        break;

      case 'apple-pay':
      case 'google-pay':
        console.log(`Initiating ${provider} payment:`, session);
        break;

      default:
        throw new Error(`Provider ${provider} not supported`);
    }

    return session;
  }

  /**
   * Add payment method
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

    // In real implementation, save to provider
    console.log('Payment method added:', method);

    return method;
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(methodId: string): Promise<void> {
    const method = this.paymentMethods().find(m => m.id === methodId);
    if (!method) throw new Error('Payment method not found');

    // In real implementation, remove from provider
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
   * Process payment
   */
  async processPayment(
    amount: number,
    currency: Currency,
    provider: PaymentProvider,
    description: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      id: crypto.randomUUID(),
      amount,
      currency,
      provider,
      status: 'processing',
      description,
      metadata: metadata || {},
      createdAt: new Date()
    };

    this.paymentIntents.update(intents => [...intents, intent]);

    // Simulate payment processing
    setTimeout(() => {
      this.completePayment(intent.id, true);
    }, 2000);

    return intent;
  }

  /**
   * Complete payment
   */
  private completePayment(intentId: string, success: boolean): void {
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

    // Create transaction record
    const intent = this.paymentIntents().find(i => i.id === intentId);
    if (intent && success) {
      this.addTransaction({
        userId: 'current-user',
        type: intent.metadata.type || 'one-time',
        amount: intent.amount,
        currency: intent.currency,
        provider: intent.provider,
        status: 'completed',
        description: intent.description,
        itemId: intent.metadata.itemId,
        metadata: intent.metadata
      });
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<Transaction> {
    const transaction = this.transactions().find(t => t.id === transactionId);
    if (!transaction) throw new Error('Transaction not found');

    const refundAmount = amount || transaction.amount;

    const refund = this.addTransaction({
      userId: transaction.userId,
      type: 'refund',
      amount: -refundAmount,
      currency: transaction.currency,
      provider: transaction.provider,
      status: 'completed',
      description: `Refund for ${transaction.description}`,
      metadata: {
        originalTransactionId: transactionId
      }
    });

    // Update original transaction
    this.transactions.update(transactions =>
      transactions.map(t =>
        t.id === transactionId
          ? { ...t, status: 'refunded' }
          : t
      )
    );

    console.log('Refund processed:', refund);
    return refund;
  }

  /**
   * Add transaction
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
   * Verify webhook signature (provider-specific)
   */
  async verifyWebhook(
    provider: PaymentProvider,
    payload: string,
    signature: string
  ): Promise<boolean> {
    const config = this.providerConfigs().find(p => p.provider === provider);
    if (!config?.webhookSecret) return false;

    // In real implementation, verify signature using provider's method
    console.log('Verifying webhook:', { provider, signature });

    // Example for Stripe:
    // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    // return !!event;

    return true;
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(
    provider: PaymentProvider,
    event: any
  ): Promise<void> {
    console.log('Handling webhook event:', { provider, event });

    // Handle different event types
    switch (event.type) {
      case 'payment.succeeded':
      case 'charge.succeeded':
        // Update subscription or purchase status
        break;

      case 'payment.failed':
      case 'charge.failed':
        // Handle failed payment
        break;

      case 'subscription.created':
      case 'subscription.updated':
        // Update subscription status
        break;

      case 'subscription.cancelled':
      case 'subscription.deleted':
        // Cancel subscription
        break;

      case 'refund.created':
        // Process refund
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }
  }

  /**
   * Generate invoice
   */
  generateInvoice(transactionId: string): string {
    const transaction = this.transactions().find(t => t.id === transactionId);
    if (!transaction) throw new Error('Transaction not found');

    // In real implementation, generate PDF invoice
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
        const csv = this.transactionsToCSV(transactions);
        return csv;

      case 'json':
        return JSON.stringify(transactions, null, 2);

      case 'pdf':
        // In real implementation, generate PDF
        return '/exports/transactions.pdf';

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert transactions to CSV
   */
  private transactionsToCSV(transactions: Transaction[]): string {
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
  }
}
