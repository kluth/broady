import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string | undefined;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey) {
      console.warn('STRIPE_SECRET_KEY environment variable not set. Stripe Service will not be fully functional.');
      // Provide a mock or throw error in production
      this.stripe = new Stripe('sk_test_mock_key', { apiVersion: '2025-11-17.clover' });
    } else {
      this.stripe = new Stripe(secretKey, { apiVersion: '2025-11-17.clover' });
    }
  }

  async createCheckoutSession(
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    mode: 'payment' | 'subscription',
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: metadata,
      });
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async constructWebhookEvent(payload: string | Buffer, signature: string | string[]): Promise<Stripe.Event> {
    if (!this.webhookSecret) {
      throw new Error('Stripe Webhook Secret not configured.');
    }
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return event;
    } catch (error) {
      console.error('Error constructing webhook event:', error);
      throw error;
    }
  }

  // Add more Stripe API methods as needed (e.g., managing subscriptions, refunds)
}
