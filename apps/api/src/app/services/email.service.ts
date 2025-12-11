/**
 * Email Service
 * Handles all email notifications
 *
 * SETUP INSTRUCTIONS:
 * 1. Choose an email provider:
 *    - SendGrid: https://sendgrid.com
 *    - AWS SES: https://aws.amazon.com/ses/
 *    - Resend: https://resend.com
 *    - Postmark: https://postmarkapp.com
 *    - Mailgun: https://www.mailgun.com
 *
 * 2. Set environment variables:
 *    EMAIL_PROVIDER=sendgrid|ses|resend|postmark|mailgun
 *    EMAIL_API_KEY=your_api_key
 *    EMAIL_FROM=noreply@yourdomain.com
 *    EMAIL_FROM_NAME=Your App Name
 *
 * 3. Uncomment the provider integration you want to use below
 */

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  fromName?: string;
}

class EmailService {
  private provider: string;
  private apiKey: string;
  private from: string;
  private fromName: string;
  private enabled: boolean;

  constructor() {
    this.provider = process.env['EMAIL_PROVIDER'] || 'console';
    this.apiKey = process.env['EMAIL_API_KEY'] || '';
    this.from = process.env['EMAIL_FROM'] || 'noreply@example.com';
    this.fromName = process.env['EMAIL_FROM_NAME'] || 'Streaming Studio';
    this.enabled = !!this.apiKey || this.provider === 'console';

    if (!this.enabled) {
      console.warn('Email service not configured. Set EMAIL_PROVIDER and EMAIL_API_KEY environment variables.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled) {
      console.log('Email not sent (service not configured):', options.subject);
      return false;
    }

    const from = options.from || this.from;
    const fromName = options.fromName || this.fromName;

    try {
      switch (this.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(options, from, fromName);
        case 'ses':
          return await this.sendWithSES(options, from, fromName);
        case 'resend':
          return await this.sendWithResend(options, from, fromName);
        case 'postmark':
          return await this.sendWithPostmark(options, from, fromName);
        case 'mailgun':
          return await this.sendWithMailgun(options, from, fromName);
        case 'console':
        default:
          return await this.sendToConsole(options);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // SendGrid implementation
  private async sendWithSendGrid(options: EmailOptions, from: string, fromName: string): Promise<boolean> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }]
        }],
        from: { email: from, name: fromName },
        subject: options.subject,
        content: [
          { type: 'text/plain', value: options.text || '' },
          ...(options.html ? [{ type: 'text/html', value: options.html }] : [])
        ]
      })
    });

    return response.ok;
  }

  // AWS SES implementation
  private async sendWithSES(options: EmailOptions, from: string, fromName: string): Promise<boolean> {
    // Requires AWS SDK
    // npm install @aws-sdk/client-ses
    console.warn('AWS SES implementation requires @aws-sdk/client-ses package');
    return this.sendToConsole(options);
  }

  // Resend implementation
  private async sendWithResend(options: EmailOptions, from: string, fromName: string): Promise<boolean> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${fromName} <${from}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      })
    });

    return response.ok;
  }

  // Postmark implementation
  private async sendWithPostmark(options: EmailOptions, from: string, fromName: string): Promise<boolean> {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        From: `${fromName} <${from}>`,
        To: options.to,
        Subject: options.subject,
        TextBody: options.text,
        HtmlBody: options.html
      })
    });

    return response.ok;
  }

  // Mailgun implementation
  private async sendWithMailgun(options: EmailOptions, from: string, fromName: string): Promise<boolean> {
    const domain = process.env['MAILGUN_DOMAIN'] || 'mg.example.com';
    const formData = new FormData();
    formData.append('from', `${fromName} <${from}>`);
    formData.append('to', options.to);
    formData.append('subject', options.subject);
    if (options.text) formData.append('text', options.text);
    if (options.html) formData.append('html', options.html);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`
      },
      body: formData
    });

    return response.ok;
  }

  // Console logging (for development/testing)
  private async sendToConsole(options: EmailOptions): Promise<boolean> {
    console.log('\n========== EMAIL ==========');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('----------------------------');
    console.log(options.text || options.html || '(no content)');
    console.log('===========================\n');
    return true;
  }

  // Predefined email templates
  async sendPurchaseConfirmation(email: string, details: {
    itemName: string;
    amount: number;
    currency: string;
    orderId: string;
  }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Purchase Confirmed - ${details.itemName}`,
      text: `Thank you for your purchase!\n\n` +
        `Item: ${details.itemName}\n` +
        `Amount: ${details.amount / 100} ${details.currency.toUpperCase()}\n` +
        `Order ID: ${details.orderId}\n\n` +
        `Your premium features are now active.`,
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>Your order has been confirmed and your premium features are now active.</p>
        <table>
          <tr><td><strong>Item:</strong></td><td>${details.itemName}</td></tr>
          <tr><td><strong>Amount:</strong></td><td>${details.amount / 100} ${details.currency.toUpperCase()}</td></tr>
          <tr><td><strong>Order ID:</strong></td><td>${details.orderId}</td></tr>
        </table>
        <p>Need help? Contact us at support@example.com</p>
      `
    });
  }

  async sendSubscriptionConfirmation(email: string, details: {
    planName: string;
    amount: number;
    currency: string;
    nextBillingDate: Date;
  }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Subscription Active - ${details.planName}`,
      text: `Your subscription is now active!\n\n` +
        `Plan: ${details.planName}\n` +
        `Amount: ${details.amount / 100} ${details.currency.toUpperCase()}/month\n` +
        `Next billing date: ${details.nextBillingDate.toLocaleDateString()}\n\n` +
        `Thank you for subscribing!`,
      html: `
        <h2>Your subscription is now active!</h2>
        <p>Thank you for subscribing to ${details.planName}.</p>
        <table>
          <tr><td><strong>Plan:</strong></td><td>${details.planName}</td></tr>
          <tr><td><strong>Amount:</strong></td><td>${details.amount / 100} ${details.currency.toUpperCase()}/month</td></tr>
          <tr><td><strong>Next billing:</strong></td><td>${details.nextBillingDate.toLocaleDateString()}</td></tr>
        </table>
      `
    });
  }

  async sendPaymentFailed(email: string, details: {
    invoiceId: string;
    amount: number;
    currency: string;
    reason?: string;
  }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Payment Failed - Action Required',
      text: `We were unable to process your payment.\n\n` +
        `Invoice ID: ${details.invoiceId}\n` +
        `Amount: ${details.amount / 100} ${details.currency.toUpperCase()}\n` +
        `${details.reason ? `Reason: ${details.reason}\n` : ''}\n` +
        `Please update your payment method to continue your subscription.`,
      html: `
        <h2>Payment Failed</h2>
        <p>We were unable to process your payment. Please update your payment method to avoid service interruption.</p>
        <table>
          <tr><td><strong>Invoice ID:</strong></td><td>${details.invoiceId}</td></tr>
          <tr><td><strong>Amount:</strong></td><td>${details.amount / 100} ${details.currency.toUpperCase()}</td></tr>
          ${details.reason ? `<tr><td><strong>Reason:</strong></td><td>${details.reason}</td></tr>` : ''}
        </table>
        <p><a href="https://your-app.com/billing">Update Payment Method</a></p>
      `
    });
  }

  async sendSubscriptionCanceled(email: string, details: {
    planName: string;
    endDate: Date;
  }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Subscription Canceled',
      text: `Your subscription has been canceled.\n\n` +
        `Plan: ${details.planName}\n` +
        `Access until: ${details.endDate.toLocaleDateString()}\n\n` +
        `We're sorry to see you go. You can resubscribe anytime.`,
      html: `
        <h2>Subscription Canceled</h2>
        <p>Your ${details.planName} subscription has been canceled.</p>
        <p>You will continue to have access until ${details.endDate.toLocaleDateString()}.</p>
        <p>We're sorry to see you go. You can <a href="https://your-app.com/pricing">resubscribe anytime</a>.</p>
      `
    });
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Streaming Studio!',
      text: `Welcome${name ? ` ${name}` : ''}!\n\n` +
        `Thank you for joining Streaming Studio. We're excited to have you.\n\n` +
        `Get started: https://your-app.com/get-started\n` +
        `Documentation: https://your-app.com/docs\n` +
        `Support: support@example.com`,
      html: `
        <h2>Welcome${name ? ` ${name}` : ''}!</h2>
        <p>Thank you for joining Streaming Studio. We're excited to have you on board!</p>
        <p><strong>Quick Links:</strong></p>
        <ul>
          <li><a href="https://your-app.com/get-started">Get Started Guide</a></li>
          <li><a href="https://your-app.com/docs">Documentation</a></li>
          <li><a href="https://your-app.com/support">Support</a></li>
        </ul>
        <p>Need help? Reply to this email or contact us at support@example.com</p>
      `
    });
  }
}

export const emailService = new EmailService();
