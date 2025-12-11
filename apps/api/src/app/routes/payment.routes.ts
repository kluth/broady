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
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Checkout session completed: ${session.id}. Status: ${session.payment_status}`);
      // TODO: Fulfill the purchase, grant access to content, etc.
      // const customerEmail = session.customer_details?.email;
      // const itemId = session.metadata?.itemId;
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // TODO: Update your database
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default paymentRouter;
