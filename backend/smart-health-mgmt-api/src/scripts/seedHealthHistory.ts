import dotenv from "dotenv";
import mongoose from "mongoose";
import HealthHistory from "../models/HealthHistory";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;
if (!MONGO_URI) {
  throw new Error("MONGO_URI is required in .env to seed health history data.");
}

const userIdString = "69e5b0109bd8af6230b7e9b5";
const userId = new mongoose.Types.ObjectId(userIdString);

const sampleRecords = [
  { steps: 8200, heartRate: 72, bloodOxygen: 98, sleepHours: 7.2 },
  { steps: 9400, heartRate: 74, bloodOxygen: 99, sleepHours: 7.6 },
  { steps: 7600, heartRate: 71, bloodOxygen: 98, sleepHours: 7.0 },
  { steps: 10200, heartRate: 75, bloodOxygen: 99, sleepHours: 7.8 },
  { steps: 10800, heartRate: 73, bloodOxygen: 98, sleepHours: 8.1 },
  { steps: 11600, heartRate: 74, bloodOxygen: 99, sleepHours: 7.9 },
  { steps: 9000, heartRate: 72, bloodOxygen: 98, sleepHours: 7.4 },
];

async function seedData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const operations = sampleRecords.map((record, index) => {
      const recordDate = new Date(today.getTime() - (sampleRecords.length - 1 - index) * 24 * 60 * 60 * 1000);
      return HealthHistory.findOneAndUpdate(
        {
          userId,
          date: {
            $gte: recordDate,
            $lt: new Date(recordDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        {
          $set: {
            userId,
            date: recordDate,
            steps: record.steps,
            heartRate: record.heartRate,
            bloodOxygen: record.bloodOxygen,
            sleepHours: record.sleepHours,
            bloodPressure: "120/80",
            source: "manual",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    const results = await Promise.all(operations);
    console.log(`Inserted/updated ${results.length} health history records for user ${userIdString}`);
    results.forEach((doc) => {
      console.log(`  - ${doc.date.toISOString().split("T")[0]}: ${doc.steps} steps`);
    });
  } catch (error) {
    console.error("Failed to seed health history data:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedData();
