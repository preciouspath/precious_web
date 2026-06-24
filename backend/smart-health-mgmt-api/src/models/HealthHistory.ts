import mongoose, { Model, Schema } from "mongoose";

export interface IHealthHistory extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  steps: number;
  heartRate: number;
  bloodOxygen: number;
  sleepHours?: number;
  bloodPressure?: string; // Format: "120/80"
  activityLevel?: string;
  calories?: number;
  distance?: number;
  source?: "fitbit" | "manual" | "apple" | "google";
  createdAt: Date;
  updatedAt: Date;
}

const healthHistorySchema = new Schema<IHealthHistory>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    date: { 
      type: Date, 
      required: true,
      index: true
    },
    steps: { 
      type: Number, 
      default: 0 
    },
    heartRate: { 
      type: Number, 
      default: 0 
    },
    bloodOxygen: { 
      type: Number, 
      default: 98,
      min: 0,
      max: 100
    },
    sleepHours: { 
      type: Number,
      default: 0 
    },
    bloodPressure: { 
      type: String 
    },
    activityLevel: { 
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      default: "moderate"
    },
    calories: { 
      type: Number,
      default: 0
    },
    distance: { 
      type: Number,
      default: 0
    },
    source: {
      type: String,
      enum: ["fitbit", "manual", "apple", "google"],
      default: "manual"
    }
  },
  { timestamps: true }
);

// Compound index for userId and date
healthHistorySchema.index({ userId: 1, date: -1 });

const HealthHistory: Model<IHealthHistory> = mongoose.model(
  "HealthHistory",
  healthHistorySchema
);

export default HealthHistory;
