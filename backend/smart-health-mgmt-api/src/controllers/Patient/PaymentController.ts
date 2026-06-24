import { Request, Response } from "express";
import { SystemSetting } from "../../models/SystemSetting";
import asyncHandler from "../../utils/asyncHandler";
import { STATUS_CODE } from "../../utils/statusCode";
import { Payment, PaymentStatus } from "../../models/Payment";
import { Coupon } from "../../models/Coupon";
import { SubscriptionPlan } from "../../models/SubscriptionPlan";
import { Subscription, SubscriptionStatus, PlanType } from "../../models/Subscription";
import User from "../../models/user";
import {
  createPaymentIntent,
  retrievePaymentIntent,
  confirmPaymentIntent,
  createRefund,
  constructWebhookEvent,
  getStripePublishableKey,
  createCheckoutSession,
  retrieveCheckoutSession,
} from "../../services/stripeService";
// import stripe from "../../services/stripeService"; // Removed invalid default import
import * as stripeService from "../../services/stripeService"; 


// ─── Create Payment Intent (Generic) ────────────────────────────────────────
export const createIntent = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { amount, currency = "usd", description, metadata } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "A valid amount (positive integer in cents) is required",
      });
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      amount,
      currency,
      description,
      metadata: { userId, ...metadata },
    });

    // Persist a pending payment record
    const payment = await Payment.create({
      userId,
      stripePaymentIntentId: paymentIntentId,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      description,
      metadata,
    });

    return res.status(STATUS_CODE.CREATED).json({
      success: true,
      message: "Payment intent created",
      data: {
        clientSecret,
        paymentIntentId,
        paymentId: payment._id,
        amount,
        currency,
      },
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to create payment intent",
    });
  }
});

// ─── Create Subscription Payment ─────────────────────────────────────────────
// This is the main endpoint for the subscription upgrade flow.
// It validates the coupon server-side, calculates the final discounted amount,
// creates a Stripe PaymentIntent, and returns the clientSecret for Stripe Elements.
export const createSubscriptionPayment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { planId, couponCode } = req.body;

    if (!planId) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "planId is required",
      });
    }

    // 1. Look up the subscription plan
    const plan = await SubscriptionPlan.findOne({ planId, isActive: true });
    if (!plan) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Subscription plan not found or inactive",
      });
    }

    const originalPlanPrice = plan.price; // fallback
    let dynamicPrice = originalPlanPrice;

    // ─── Override Premium Price from System Settings ──────────────────
    if (planId === 'premium') {
      const premiumPriceSetting = await SystemSetting.findOne({ key: "premium_plan_monthly_price" });
      if (premiumPriceSetting && premiumPriceSetting.value) {
        const parsedPrice = parseFloat(premiumPriceSetting.value);
        if (!isNaN(parsedPrice)) {
          dynamicPrice = parsedPrice;
        }
      }
    }

    if (dynamicPrice <= 0 && planId !== 'free') {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Cannot create payment for a free plan",
      });
    }

    const originalAmountDollars = dynamicPrice; // e.g. 10 (dollars)
    let discountDollars = 0;
    let appliedCouponCode: string | undefined;

    // 2. Validate coupon (server-side — never trust frontend amounts)
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      if (!coupon) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          success: false,
          message: "Invalid coupon code",
        });
      }

      if (!coupon.active) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          success: false,
          message: "This coupon is no longer active",
        });
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validTo) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          success: false,
          message: "This coupon has expired",
        });
      }

      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          success: false,
          message: "This coupon has reached its usage limit",
        });
      }

      if (userId && coupon.usedByUsers.includes(userId)) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          success: false,
          message: "You have already used this coupon",
        });
      }

      // Calculate discount
      if (coupon.discountType === "flat") {
        discountDollars = Math.min(coupon.discountAmount, originalAmountDollars);
      } else {
        discountDollars = (originalAmountDollars * coupon.discountPercentage) / 100;
      }

      discountDollars = Math.round(discountDollars * 100) / 100;
      appliedCouponCode = coupon.code;
    }

    // 3. Calculate final amount in cents (Stripe works in smallest currency unit)
    const finalAmountDollars = Math.max(0, originalAmountDollars - discountDollars);
    const finalAmountCents = Math.round(finalAmountDollars * 100);

    // Minimum Stripe charge is $0.50 (50 cents) — if amount is too low, make it free
    if (finalAmountCents > 0 && finalAmountCents < 50) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "The discounted amount is too low for payment processing. Contact support.",
      });
    }

    // 4. If final amount is 0 (100% discount), skip Stripe and directly activate
    if (finalAmountCents === 0) {
      // Mark coupon as used
      if (appliedCouponCode) {
        await Coupon.findOneAndUpdate(
          { code: appliedCouponCode },
          { $inc: { usedCount: 1 }, $addToSet: { usedByUsers: userId } }
        );
      }

      // Activate subscription directly
      await activateSubscription(userId, planId, originalAmountDollars, appliedCouponCode);

      return res.status(STATUS_CODE.OK).json({
        success: true,
        message: "Subscription activated with 100% discount!",
        data: {
          requiresPayment: false,
          planId,
          originalAmount: originalAmountDollars,
          discountAmount: discountDollars,
          finalAmount: 0,
        },
      });
    }

    // 5. Create Stripe Checkout Session
    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    
    // Support custom pass-through URLs for mobile apps
    const providedSuccessUrl = req.body.successUrl;
    const providedCancelUrl = req.body.cancelUrl;
    
    const successUrl = providedSuccessUrl || `${origin}/subscription?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = providedCancelUrl || `${origin}/subscription?payment=cancel`;

    const { checkoutUrl, sessionId } = await createCheckoutSession({
      amount: finalAmountCents,
      currency: plan.currency?.toLowerCase() || "usd",
      description: `${plan.name} subscription`,
      successUrl,
      cancelUrl,
      metadata: {
        userId,
        planId,
        couponCode: appliedCouponCode || "",
        originalAmountCents: String(Math.round(originalAmountDollars * 100)),
        discountAmountCents: String(Math.round(discountDollars * 100)),
      },
    });

    // 6. Persist a pending payment record
    const payment = await Payment.create({
      userId,
      stripeSessionId: sessionId,
      amount: finalAmountCents,
      originalAmount: Math.round(originalAmountDollars * 100),
      discountAmount: Math.round(discountDollars * 100),
      couponCode: appliedCouponCode,
      planId,
      currency: plan.currency?.toLowerCase() || "usd",
      status: PaymentStatus.PENDING,
      description: `${plan.name} subscription`,
    });

    console.log(`💳 Subscription checkout session created: ${sessionId} | Plan: ${planId} | Amount: $${finalAmountDollars}`);

    return res.status(STATUS_CODE.CREATED).json({
      success: true,
      message: "Checkout session created",
      data: {
        requiresPayment: true,
        checkoutUrl,
        sessionId,
        paymentId: payment._id,
        planId,
        originalAmount: originalAmountDollars,
        discountAmount: discountDollars,
        finalAmount: finalAmountDollars,
        currency: plan.currency?.toLowerCase() || "usd",
        publishableKey: await getStripePublishableKey(),
      },
    });
  } catch (error: any) {
    console.error("Create subscription payment error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to create subscription payment",
    });
  }
});

// ─── Verify Subscription Payment ───────────────────────────────────────────
// This allows the frontend to explicitly confirm a payment succeeded (e.g. if webhook delayed)
export const verifySubscriptionPayment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { paymentIntentId, sessionId } = req.body;

    if (!paymentIntentId && !sessionId) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "paymentIntentId or sessionId is required",
      });
    }

    let payment;
    let intentStatus = "pending";
    let intentId = paymentIntentId;

    if (sessionId) {
      payment = await Payment.findOne({ stripeSessionId: sessionId, userId });
      if (!payment) {
        return res.status(STATUS_CODE.NOT_FOUND).json({
          success: false,
          message: "Payment record not found for this session",
        });
      }
      
      // Fetch session from Stripe to check status and get payment intent
      const session = await retrieveCheckoutSession(sessionId);
      if (session.payment_status === "paid") {
        intentStatus = "succeeded";
        intentId = session.payment_intent as string;
      } else {
        intentStatus = session.payment_status;
      }
    } else if (paymentIntentId) {
      payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId, userId });
      if (!payment) {
        return res.status(STATUS_CODE.NOT_FOUND).json({
          success: false,
          message: "Payment record not found",
        });
      }

      // Always fetch latest status from Stripe
      const intent = await retrievePaymentIntent(paymentIntentId);
      intentStatus = intent.status;
      intentId = intent.id;
    }

    if (!payment) {
       return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (intentStatus === "succeeded") {
      // If it hasn't been processed by the webhook yet, process it now
      if (payment.status !== PaymentStatus.SUCCEEDED) {
        payment.status = PaymentStatus.SUCCEEDED;

        if (payment.planId) {
          const planId = payment.planId;
          const couponCode = payment.couponCode;
          const originalAmountCents = payment.originalAmount || payment.amount;

          // Activate subscription
          const subscription = await activateSubscription(
            userId,
            planId,
            originalAmountCents / 100, // Convert cents to dollars for the helper
            couponCode,
            intentId || payment.stripePaymentIntentId || payment.stripeSessionId
          );

          payment.subscriptionId = subscription._id;
          if (intentId) payment.stripePaymentIntentId = intentId;

          // Mark coupon as used (if applicable)
          if (couponCode) {
            await Coupon.findOneAndUpdate(
              { code: couponCode },
              {
                $inc: { usedCount: 1 },
                $addToSet: { usedByUsers: userId },
              }
            );
          }
        }
        await payment.save();
      }

      return res.status(STATUS_CODE.OK).json({
        success: true,
        message: "Payment verified successfully",
        data: { status: "succeeded" }
      });
    }

    return res.status(STATUS_CODE.BAD_REQUEST).json({
      success: false,
      message: `Payment not completed. Current status: ${intentStatus}`,
    });

  } catch (error: any) {
    console.error("Verify payment error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to verify payment",
    });
  }
});

// ─── Helper: Activate Subscription ──────────────────────────────────────────
async function activateSubscription(
  userId: string,
  planId: string,
  amount: number,
  couponCode?: string,
  transactionId?: string
) {
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month subscription

  // Create or update subscription record
  const subscription = await Subscription.findOneAndUpdate(
    { userId, userModel: "User" },
    {
      planType: planId === "premium" ? PlanType.PREMIUM : PlanType.FREE,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      expiryDate,
      amount: Math.round(amount * 100), // Store in cents
      currency: "USD",
      paymentStatus: "Paid",
      transactionId: transactionId || `FREE_${Date.now()}`,
    },
    { upsert: true, new: true }
  );

  // Update user's embedded subscription field
  await User.findByIdAndUpdate(userId, {
    subscription: {
      type: planId === "premium" ? "premium" : "free",
      startDate: now,
      endDate: expiryDate,
      status: "active",
    },
  });

  console.log(`✅ Subscription activated for user ${userId} | Plan: ${planId} | Expires: ${expiryDate.toISOString()}`);

  return subscription;
}

// ─── Confirm Payment (server-driven) ─────────────────────────────────────────
export const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "paymentIntentId and paymentMethodId are required",
      });
    }

    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId, userId });
    if (!payment) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Payment record not found",
      });
    }

    const intent = await confirmPaymentIntent(paymentIntentId, paymentMethodId);

    const statusMap: Record<string, PaymentStatus> = {
      succeeded: PaymentStatus.SUCCEEDED,
      requires_payment_method: PaymentStatus.FAILED,
      canceled: PaymentStatus.CANCELLED,
    };

    payment.status = statusMap[intent.status] || PaymentStatus.PENDING;
    await payment.save();

    return res.status(STATUS_CODE.OK).json({
      success: true,
      message: "Payment confirmed",
      data: {
        status: intent.status,
        paymentIntentId: intent.id,
        payment,
      },
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to confirm payment",
    });
  }
});

// ─── Get Payment History (for logged-in user) ────────────────────────────────
export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { page = "1", limit = "10", status } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const filters: any = { userId };
    if (status) filters.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(filters)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Payment.countDocuments(filters),
    ]);

    return res.status(STATUS_CODE.OK).json({
      success: true,
      data: payments,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to fetch payment history",
    });
  }
});

// ─── Refund Payment ───────────────────────────────────────────────────────────
export const refundPayment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { paymentId } = req.params;
    const { amount } = req.body; // optional – omit for full refund

    const payment = await Payment.findOne({ _id: paymentId, userId });
    if (!payment) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Only succeeded payments can be refunded",
      });
    }

    if (!payment.stripePaymentIntentId) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Stripe payment intent ID missing, cannot refund",
      });
    }

    const refund = await createRefund(payment.stripePaymentIntentId, amount);

    payment.status = PaymentStatus.REFUNDED;
    payment.refundId = refund.id;
    payment.refundedAmount = refund.amount;
    await payment.save();

    return res.status(STATUS_CODE.OK).json({
      success: true,
      message: "Payment refunded successfully",
      data: {
        refundId: refund.id,
        refundedAmount: refund.amount,
        currency: refund.currency,
        payment,
      },
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to process refund",
    });
  }
});

// ─── Stripe Webhook Handler ───────────────────────────────────────────────────
export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: any;

  try {
    event = await constructWebhookEvent(req.body as Buffer, sig);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(STATUS_CODE.BAD_REQUEST).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      // ─── Payment Succeeded ─────────────────────────────────────────────
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        console.log(`✅ Webhook: payment_intent.succeeded – ${intent.id}`);

        // Update payment record
        const payment = await Payment.findOneAndUpdate(
          { stripePaymentIntentId: intent.id },
          { status: PaymentStatus.SUCCEEDED },
          { new: true }
        );

        if (payment && payment.planId) {
          // This is a subscription payment — activate the subscription
          const metadata = intent.metadata || {};
          const userId = metadata.userId || payment.userId.toString();
          const planId = metadata.planId || payment.planId;
          const couponCode = metadata.couponCode || payment.couponCode;
          const originalAmountCents = payment.originalAmount || payment.amount;

          // Activate subscription
          const subscription = await activateSubscription(
            userId,
            planId,
            originalAmountCents / 100, // Convert cents to dollars for the helper
            couponCode,
            intent.id
          );

          // Link subscription to payment
          payment.subscriptionId = subscription._id;
          await payment.save();

          // Mark coupon as used (if applicable)
          if (couponCode) {
            await Coupon.findOneAndUpdate(
              { code: couponCode },
              {
                $inc: { usedCount: 1 },
                $addToSet: { usedByUsers: userId },
              }
            );
            console.log(`🎟️ Coupon ${couponCode} marked as used by user ${userId}`);
          }

          console.log(`🎉 Subscription activated via webhook for user ${userId}`);
        }
        break;
      }

      // ─── Payment Failed ────────────────────────────────────────────────
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        console.log(`❌ Webhook: payment_intent.payment_failed – ${intent.id}`);

        const payment = await Payment.findOneAndUpdate(
          { stripePaymentIntentId: intent.id },
          { status: PaymentStatus.FAILED },
          { new: true }
        );

        if (payment && payment.planId) {
          // Update subscription status to Failed if one exists
          const metadata = intent.metadata || {};
          const userId = metadata.userId || payment.userId.toString();

          await Subscription.findOneAndUpdate(
            { userId, userModel: "User", status: SubscriptionStatus.PENDING },
            { status: SubscriptionStatus.FAILED, paymentStatus: "Failed" }
          );

          console.log(`❌ Subscription payment failed for user ${userId}`);
        }
        break;
      }

      // ─── Checkout Session Completed ────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(`✅ Webhook: checkout.session.completed – ${session.id}`);

        if (session.payment_status === 'paid') {
          // Find payment by session ID and process it
          let payment = await Payment.findOneAndUpdate(
            { stripeSessionId: session.id },
            { 
              status: PaymentStatus.SUCCEEDED,
              ...(session.payment_intent ? { stripePaymentIntentId: session.payment_intent } : {})
            },
            { new: true }
          );

          if (payment && payment.planId && payment.status === PaymentStatus.SUCCEEDED) {
            // Check if subscription was already activated (to avoid duplicate activation)
            if (!payment.subscriptionId) {
              const metadata = session.metadata || {};
              const userId = metadata.userId || payment.userId.toString();
              const planId = metadata.planId || payment.planId;
              const couponCode = metadata.couponCode || payment.couponCode;
              const originalAmountCents = payment.originalAmount || payment.amount;

              // Activate subscription
              const subscription = await activateSubscription(
                userId,
                planId,
                originalAmountCents / 100, // Convert cents to dollars for the helper
                couponCode,
                (session.payment_intent as string) || session.id
              );

              // Link subscription to payment
              payment.subscriptionId = subscription._id;
              await payment.save();

              // Mark coupon as used (if applicable)
              if (couponCode) {
                await Coupon.findOneAndUpdate(
                  { code: couponCode },
                  {
                    $inc: { usedCount: 1 },
                    $addToSet: { usedByUsers: userId },
                  }
                );
                console.log(`🎟️ Coupon ${couponCode} marked as used by user ${userId}`);
              }

              console.log(`🎉 Subscription activated via checkout session webhook for user ${userId}`);
            }
          }
        }
        break;
      }

      // ─── Charge Refunded ───────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object;
        const refund = charge.refunds?.data?.[0];
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: charge.payment_intent },
          {
            status: PaymentStatus.REFUNDED,
            refundId: refund?.id,
            refundedAmount: charge.amount_refunded,
          }
        );
        console.log(`💸 Webhook: charge.refunded – ${charge.payment_intent}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event type: ${event.type}`);
    }

    return res.status(STATUS_CODE.OK).json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
});
