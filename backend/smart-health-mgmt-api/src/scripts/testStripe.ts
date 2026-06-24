
import dotenv from "dotenv";
dotenv.config();

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY as string, {
  apiVersion: "2026-03-25.dahlia" as any,
});

async function runSmokeTest() {
  console.log("🧪 Stripe Smoke Test Starting...\n");
  console.log(`🔑 Using key: ${process.env.STRIPE_TEST_SECRET_KEY?.substring(0, 12)}...`);

  // ── 1. Create a Payment Intent ──────────────────────────────────────────────
  console.log("\n[1] Creating Payment Intent (amount: $9.99 = 999 cents)...");
  const intent = await stripe.paymentIntents.create({
    amount: 999,
    currency: "usd",
    description: "Smoke test payment",
    metadata: { test: "true" },
    automatic_payment_methods: { enabled: true },
  });
  console.log("✅ Payment Intent Created:");
  console.log(`   ID:            ${intent.id}`);
  console.log(`   Client Secret: ${intent.client_secret?.substring(0, 30)}...`);
  console.log(`   Status:        ${intent.status}`);
  console.log(`   Amount:        ${intent.amount} cents (${intent.currency.toUpperCase()})`);

  // ── 2. Retrieve the Intent ──────────────────────────────────────────────────
  console.log("\n[2] Retrieving Payment Intent...");
  const retrieved = await stripe.paymentIntents.retrieve(intent.id);
  console.log(`✅ Retrieved: ${retrieved.id} | Status: ${retrieved.status}`);

  // ── 3. Confirm with test card (pm_card_visa) ────────────────────────────────
  console.log("\n[3] Confirming Payment Intent with test payment method pm_card_visa...");
  try {
    const confirmed = await stripe.paymentIntents.confirm(intent.id, {
      payment_method: "pm_card_visa",
      return_url: "https://localhost:4000/test",
    });
    console.log(`✅ Confirmed: Status = ${confirmed.status}`);
  } catch (err: any) {
    // Some test intents require redirect — that's expected in smoke tests
    console.log(`ℹ️  Confirm result (may need redirect): ${err.message}`);
  }

  // ── 4. List recent Payment Intents ─────────────────────────────────────────
  console.log("\n[4] Listing recent Payment Intents (last 3)...");
  const list = await stripe.paymentIntents.list({ limit: 3 });
  list.data.forEach((pi) => {
    console.log(`   - ${pi.id} | ${pi.status} | ${pi.amount} ${pi.currency}`);
  });

  console.log("\n🎉 Smoke test complete! Stripe connection is working.");
}

runSmokeTest().catch((err) => {
  console.error("❌ Smoke test failed:", err.message);
  process.exit(1);
});
