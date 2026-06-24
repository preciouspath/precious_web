import { Request, Response } from "express";
import { Campaign, CampaignStatus } from "../../models/Campaign";
import {
  createPaymentIntent,
  retrievePaymentIntent,
  getStripePublishableKey,
} from "../../services/stripeService";


export const createAdPaymentIntent = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user.id;
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ success: false, message: "campaignId is required" });
    }

    // Find the draft campaign
    const campaign = await Campaign.findOne({ _id: campaignId, ownerId });
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    if (campaign.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Campaign is already paid" });
    }

    // Amount in cents (USD)
    const amountInCents = Math.round(campaign.totalBudget * 100);

    if (amountInCents < 50) {
      return res.status(400).json({ success: false, message: "Minimum payment amount is $0.50" });
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      amount: amountInCents,
      currency: "usd",
      description: `Ad Campaign: ${campaign.name}`,
      metadata: {
        campaignId: campaign._id.toString(),
        ownerId: ownerId,
        type: "ad_campaign",
      },
    });

    // Save the payment intent ID on the campaign
    campaign.stripePaymentIntentId = paymentIntentId;
    campaign.paymentStatus = "pending";
    await campaign.save();

    // Get publishable key
    const publishableKey = await getStripePublishableKey();

    return res.json({
      success: true,
      data: {
        clientSecret,
        paymentIntentId,
        publishableKey,
        amount: campaign.totalBudget,
      },
    });
  } catch (err: any) {
    console.error("createAdPaymentIntent error:", err);
    return res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * POST /ads/v2/payment/confirm
 * Called after Stripe payment succeeds on the frontend.
 * Verifies with Stripe, updates campaign paymentStatus to 'paid' and status to 'pending'.
 */
export const confirmAdPayment = async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user.id;
    const { campaignId, paymentIntentId } = req.body;

    if (!campaignId || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "campaignId and paymentIntentId are required",
      });
    }

    const campaign = await Campaign.findOne({ _id: campaignId, ownerId });
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    if (campaign.paymentStatus === "paid") {
      return res.json({ success: true, message: "Payment already confirmed" });
    }

    // Verify with Stripe
    const intent = await retrievePaymentIntent(paymentIntentId);

    if (intent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: `Payment not succeeded. Stripe status: ${intent.status}`,
      });
    }

    // Update campaign
    campaign.paymentStatus = "paid";
    campaign.stripePaymentIntentId = paymentIntentId;
    campaign.paidAmount = intent.amount / 100; // Convert cents to dollars
    campaign.status = CampaignStatus.PENDING; // Now ready for admin review
    await campaign.save();

    return res.json({
      success: true,
      message: "Payment confirmed. Campaign submitted for review.",
      data: {
        campaignId: campaign._id,
        paymentStatus: campaign.paymentStatus,
        paidAmount: campaign.paidAmount,
        campaignStatus: campaign.status,
      },
    });
  } catch (err: any) {
    console.error("confirmAdPayment error:", err);
    return res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * GET /ads/v2/payment/config
 * Returns the Stripe publishable key for the frontend.
 */
export const getAdPaymentConfig = async (_req: Request, res: Response) => {
  try {
    const publishableKey = await getStripePublishableKey();
    return res.json({
      success: true,
      data: { publishableKey },
    });
  } catch (err: any) {
    console.error("getAdPaymentConfig error:", err);
    return res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};
