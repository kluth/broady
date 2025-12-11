/**
 * Email Service
 * Handles sending transactional emails
 */

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export class EmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    // In production, integrate with SendGrid, Mailgun, AWS SES, etc.
    console.log('Sending email:', {
      to: options.to,
      subject: options.subject,
      template: options.template,
      context: options.context
    });
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Broady!',
      template: 'welcome',
      context: {
        loginUrl: 'https://broady.app/login'
      }
    });
  }

  async sendPurchaseConfirmation(email: string, details: {
    itemName: string;
    amount: number;
    currency: string;
    orderId: string;
  }): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Purchase Confirmation',
      template: 'purchase_confirmation',
      context: details
    });
  }

  async sendSubscriptionConfirmation(email: string, details: {
    planName: string;
    amount: number;
    currency: string;
    nextBillingDate: Date;
  }): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Subscription Confirmation',
      template: 'subscription_confirmation',
      context: details
    });
  }

  async sendSubscriptionCanceled(email: string, details: {
    planName: string;
    endDate: Date;
  }): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Subscription Canceled',
      template: 'subscription_canceled',
      context: details
    });
  }

  async sendPaymentFailed(email: string, details: {
    invoiceId: string;
    amount: number;
    currency: string;
    reason?: string;
  }): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Payment Failed',
      template: 'payment_failed',
      context: details
    });
  }
}

export const emailService = new EmailService();