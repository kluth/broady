import { Router, Request, Response, NextFunction } from 'express';
import express from 'express'; // Import express
import { StripeService } from '../services/payment.service';
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

        // TODO: Implement your business logic here:
        // 1. Create user account if needed
        // 2. Grant access to premium features
        // 3. Update user subscription status in database
        // 4. Send confirmation email
        // 5. Update analytics

        // Example database update (implement with your database):
        // await db.users.update({
        //   email: customerEmail,
        //   subscription: { active: true, stripeCustomerId: customerId, itemId }
        // });

        // Example email notification:
        // await sendEmail(customerEmail, 'Purchase Confirmed', '...');
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

      // TODO: Implement your database update:
      // await db.payments.create({
      //   paymentIntentId: paymentIntent.id,
      //   amount: paymentIntent.amount,
      //   currency: paymentIntent.currency,
      //   customerId: paymentIntent.customer as string,
      //   status: 'completed',
      //   timestamp: new Date()
      // });
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription ${event.type}:`, subscription.id);

      // TODO: Update subscription status in database
      // await db.subscriptions.upsert({
      //   subscriptionId: subscription.id,
      //   customerId: subscription.customer as string,
      //   status: subscription.status,
      //   currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      // });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Subscription cancelled:', subscription.id);

      // TODO: Revoke access to premium features
      // await db.subscriptions.update({
      //   subscriptionId: subscription.id,
      //   status: 'cancelled',
      //   cancelledAt: new Date()
      // });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Invoice payment failed:', invoice.id);

      // TODO: Notify customer of payment failure
      // await sendEmail(invoice.customer_email, 'Payment Failed', '...');
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default paymentRouter;
