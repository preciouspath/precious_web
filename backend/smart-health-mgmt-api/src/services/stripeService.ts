import Stripe from "stripe";
import { SystemSetting } from "../models/SystemSetting";

// Cache the instances so we don't re-instantiate on every call
let testStripeClient: Stripe | null = null;
let liveStripeClient: Stripe | null = null;


const getStripeClient = async (): Promise<Stripe> => {
  // 1. Fetch current mode from DB (default to "test" if not found)
  let mode = "test";
  try {
    const setting = await SystemSetting.findOne({ key: "stripe_mode" });
    if (setting && setting.value === "live") {
      mode = "live";
    }
  } catch (error) {
    console.error("Error fetching stripe_mode setting, falling back to test.", error);
  }

  // 2. Return cached instance if available
  if (mode === "test") {
    if (testStripeClient) return testStripeClient;
    const testKey = process.env.STRIPE_TEST_SECRET_KEY;
    if (!testKey) throw new Error("STRIPE_TEST_SECRET_KEY is missing in .env");
    testStripeClient = new Stripe(testKey, { apiVersion: "2026-03-25.dahlia" as any });
    return testStripeClient;
  } else {
    if (liveStripeClient) return liveStripeClient;
    const liveKey = process.env.STRIPE_LIVE_SECRET_KEY;
    if (!liveKey) throw new Error("STRIPE_LIVE_SECRET_KEY is missing in .env");
    liveStripeClient = new Stripe(liveKey, { apiVersion: "2026-03-25.dahlia" as any });
    return liveStripeClient;
  }
};

export const getStripePublishableKey = async (): Promise<string> => {
  let mode = "test";
  try {
    const setting = await SystemSetting.findOne({ key: "stripe_mode" });
    if (setting && setting.value === "live") {
      mode = "live";
    }
  } catch (error) {}

  const key = mode === "live" 
    ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY 
    : process.env.STRIPE_TEST_PUBLISHABLE_KEY;
    
  if (!key) throw new Error(`STRIPE_${mode.toUpperCase()}_PUBLISHABLE_KEY is missing in .env`);
  
  return key;
};

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Creates a Stripe PaymentIntent.
 * Returns clientSecret (used by the frontend to complete payment) and paymentIntentId.
 */
export const createPaymentIntent = async ({
  amount,
  currency = "usd",
  description,
  metadata,
}: CreatePaymentIntentParams): Promise<{
  clientSecret: string;
  paymentIntentId: string;
}> => {
  const stripe = await getStripeClient();
  const intent = await stripe.paymentIntents.create({
    amount,
    currency,
    description,
    metadata: metadata || {},
    payment_method_types: ['card'],
  });

  return {
    clientSecret: intent.client_secret as string,
    paymentIntentId: intent.id,
  };
};

/**
 * Creates a Stripe Checkout Session.
 * Returns checkoutUrl (used to redirect the user) and sessionId.
 */
export const createCheckoutSession = async ({
  amount,
  currency = "usd",
  description,
  metadata,
  successUrl,
  cancelUrl,
}: {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}): Promise<{
  checkoutUrl: string;
  sessionId: string;
}> => {
  const stripe = await getStripeClient();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: description || "Payment",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: metadata || {},
    payment_intent_data: {
      metadata: metadata || {},
    },
  });

  return {
    checkoutUrl: session.url as string,
    sessionId: session.id,
  };
};

/**
 * Retrieves a PaymentIntent from Stripe by ID.
 */
export const retrievePaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  const stripe = await getStripeClient();
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

/**
 * Confirms a PaymentIntent server-side (for server-driven payment flows).
 */
export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentIntent> => {
  const stripe = await getStripeClient();
  return stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });
};

/**
 * Issues a full or partial refund for a PaymentIntent.
 */
export const createRefund = async (
  paymentIntentId: string,
  amount?: number // optional – omit for full refund
): Promise<Stripe.Refund> => {
  const stripe = await getStripeClient();
  const params: Stripe.RefundCreateParams = { payment_intent: paymentIntentId };
  if (amount) params.amount = amount;
  return stripe.refunds.create(params);
};

/**
 * Constructs and validates a Stripe Webhook event from the raw request body.
 */
export const constructWebhookEvent = async (
  rawBody: Buffer,
  signature: string
): Promise<Stripe.Event> => {
  const stripe = await getStripeClient();
  
  // Also fetch the correct webhook secret
  let mode = "test";
  try {
    const setting = await SystemSetting.findOne({ key: "stripe_mode" });
    if (setting && setting.value === "live") mode = "live";
  } catch (e) {}

  const secret = mode === "live" 
    ? process.env.STRIPE_LIVE_WEBHOOK_SECRET 
    : process.env.STRIPE_TEST_WEBHOOK_SECRET;

  if (!secret) throw new Error(`STRIPE_${mode.toUpperCase()}_WEBHOOK_SECRET missing.`);
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
};
/**
 * Retrieves a Checkout Session from Stripe by ID.
 */
export const retrieveCheckoutSession = async (
  sessionId: string
): Promise<Stripe.Checkout.Session> => {
  const stripe = await getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId);
};
