import { Router } from "express";
import { handleWebhook } from "../controllers/Patient/PaymentController";
import express from "express";

const router = Router();

/**
 * POST /api/stripe/webhook
 *
 * IMPORTANT: This route must receive the RAW request body (Buffer),
 * NOT JSON-parsed, so Stripe can verify the webhook signature.
 * The raw body middleware is mounted before express.json() in app.ts.
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

export default router;
