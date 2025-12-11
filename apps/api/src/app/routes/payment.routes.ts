import { Router, Request, Response, NextFunction } from 'express';
import express from 'express'; // Import express
import { StripeService } from '../services/payment.service';
import { databaseService } from '../services/database.service';
import { emailService } from '../services/email.service';
import Stripe from 'stripe';

const paymentRouter = Router();
const stripeService = new StripeService();

// Middleware to parse raw body for webhook verification
function rawBodyMiddleware() {
  return function (req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl === '/api/payment/webhook') {
      express.raw({ type: 'application/json' })(req, res, next);
    } else {
      next();
    }
  };
}

// Apply raw body middleware before JSON parsing for the webhook route
paymentRouter.use(rawBodyMiddleware());

paymentRouter.post('/create-checkout-session', async (req: Request, res: Response) => {
  const { amount, currency, type, itemId, successUrl, cancelUrl } = req.body;

  try {
    const session = await stripeService.createCheckoutSession(
      [{
        price_data: {
          currency: currency,
          product_data: {
            name: itemId || 'Product/Service',
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      type, // 'payment' or 'subscription'
      successUrl,
      cancelUrl,
      { itemId: itemId }
    );
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

paymentRouter.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    event = await stripeService.constructWebhookEvent(req.body, sig as string);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Checkout session completed: ${session.id}. Status: ${session.payment_status}`);

      // Fulfill the purchase
      if (session.payment_status === 'paid') {
        const customerEmail = session.customer_details?.email;
        const itemId = session.metadata?.itemId;
        const customerId = session.customer as string;

        // Log fulfillment details
        console.log('Fulfilling order:', {
          sessionId: session.id,
          customerEmail,
          customerId,
          itemId,
          amount: session.amount_total,
          currency: session.currency
        });

        // 1. Create or update user account
        if (customerEmail) {
          let user = await databaseService.findUserByEmail(customerEmail);

          if (!user) {
            // Create new user
            user = await databaseService.createUser({
              email: customerEmail,
              stripeCustomerId: customerId,
              itemId: itemId
            });

            // Send welcome email
            await emailService.sendWelcomeEmail(customerEmail);
          } else {
            // Update existing user
            await databaseService.updateUser(user.id, {
              stripeCustomerId: customerId
            });
          }

          // 2. Grant access to premium features
          if (itemId) {
            await databaseService.grantPremiumAccess(user.id, itemId);
          }

          // 3. Create payment record
          await databaseService.createPayment({
            userId: user.id,
            stripePaymentIntentId: session.payment_intent as string || '',
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            itemId: itemId,
            metadata: { sessionId: session.id }
          });

          // 4. Send confirmation email
          await emailService.sendPurchaseConfirmation(customerEmail, {
            itemName: itemId || 'Premium Features',
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            orderId: session.id
          });
        }
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);

      // Update database with payment confirmation
      console.log('Payment confirmed:', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customerId: paymentIntent.customer,
        status: paymentIntent.status
      });

      // Find user and create payment record
      if (paymentIntent.customer) {
        const user = await databaseService.findUserByStripeCustomerId(paymentIntent.customer as string);
        if (user) {
          await databaseService.createPayment({
            userId: user.id,
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: { status: paymentIntent.status }
          });
        }
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;
      console.log(`Subscription ${event.type}:`, subscription.id);

      // Find or create user and update subscription
      const user = await databaseService.findUserByStripeCustomerId(subscription.customer as string);
      if (user) {
        // Create or update subscription record
        await databaseService.createSubscription({
          userId: user.id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          status: subscription.status as any,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        });

        // Grant premium access
        const itemId = subscription.items.data[0]?.price.product as string;
        if (itemId) {
          await databaseService.grantPremiumAccess(user.id, itemId);
        }

        // Send confirmation email for new subscriptions
        if (event.type === 'customer.subscription.created') {
          await emailService.sendSubscriptionConfirmation(user.email, {
            planName: itemId || 'Premium Plan',
            amount: subscription.items.data[0]?.price.unit_amount || 0,
            currency: subscription.currency || 'usd',
            nextBillingDate: new Date(subscription.current_period_end * 1000)
          });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      console.log('Subscription cancelled:', subscription.id);

      // Cancel subscription and revoke access
      const user = await databaseService.findUserByStripeCustomerId(subscription.customer as string);
      if (user) {
        // Update subscription status
        await databaseService.cancelSubscription(subscription.id);

        // Revoke premium access
        await databaseService.revokePremiumAccess(user.id);

        // Send cancellation email
        await emailService.sendSubscriptionCanceled(user.email, {
          planName: subscription.items.data[0]?.price.product as string || 'Premium Plan',
          endDate: new Date(subscription.current_period_end * 1000)
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Invoice payment failed:', invoice.id);

      // Notify customer of payment failure
      if (invoice.customer_email) {
        await emailService.sendPaymentFailed(invoice.customer_email, {
          invoiceId: invoice.id,
          amount: invoice.amount_due || 0,
          currency: invoice.currency || 'usd',
          reason: invoice.last_finalization_error?.message
        });
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default paymentRouter;
