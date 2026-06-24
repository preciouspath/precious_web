import { messaging } from "../utils/firebase";

async function testFirebaseInitialization() {
  console.log("--- Firebase Push Notification Verification ---");
  
  if (messaging) {
    console.log("✅ Firebase Messaging initialized successfully.");
    console.log("Note: To test actual sending, you need a valid device FCM token.");
  } else {
    console.log("❌ Firebase Messaging failed to initialize.");
    console.log("Please check if 'src/config/firebase-service-account.json' exists and is valid.");
  }
  
  console.log("------------------------------------------------");
  process.exit(0);
}

testFirebaseInitialization().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
