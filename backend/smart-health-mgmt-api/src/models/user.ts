import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import { CONSTANTS } from "../utils/constant";
import { connection } from "../db/dbConnection";

export interface IHealthProfile {
  height?: string;
  weight?: string;
  bloodPressure?: string;
  bloodGroup?: string;
  diabetes?: string;
  healthConditions?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    countryCode?: string;
    countryName?: string;
    relation?: string;
  };
  smartwatch?: {
    connected: boolean;
    type?: "Apple" | "Fitbit" | "GoogleFit";
    lastSync?: Date;
    permissions?: {
      heartRate: boolean;
      stepCount: boolean;
      sleepData: boolean;
      bloodOxygen: boolean;
      bloodPressure: boolean;
    };
    data?: {
      heartRate?: string;
      steps?: string;
      sleep?: string;
      bloodOxygen?: string;
      bloodPressure?: string;
    };
  };
  fitbit?: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    scope: string;
    tokenExpiresAt: Date;
    codeVerifier?: string;
    authState?: string;
    authStartedAt?: Date;
    lastSync?: Date;
  };
}

export interface ITrustedDoctor {
  name: string;
  specialty: string;
  email: string;
  phone: string;
  countryCode?: string;
  countryName?: string;
  isFavorite: boolean;
}

export interface IUser extends mongoose.Document {
  fullName: string;
  email: string;
  countryCode?: string;
  countryName?: string;
  password: string;
  mobileNumber?: string;
  dateOfBirth?: Date;
  gender?: string;
  role: string;
  profileImage?: string;
  status: "active" | "inactive" | "suspended";
  otp?: string;
  emailVerified?: boolean;
  refreshToken?: string;
  isCompleted?: boolean;

  // Patient-specific
  healthProfile?: IHealthProfile;
  qrCode?: string;
  qrUrl?: string;
  scanningId?: string;
  trustedDoctors?: ITrustedDoctor[];

  // Business Owner-specific
  businessName?: string;
  businessAddress?: string;

  subscription?: {
    type: "free" | "premium";
    startDate: Date;
    endDate?: Date;
    status: "active" | "inactive" | "cancelled";
  };

  // Admin-specific
  permissions?: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: number;

  // Push Notifications
  fcmToken?: string;

  // Meta
  lastLogin?: Date;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  compareOtp(candidateOtp: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: false, unique: true, sparse: true, },
    countryCode: { type: String, default: "+91" },
    countryName: { type: String },
    isCompleted: { type: Boolean, default: false },
    mobileNumber: {
      type: String,
      unique: true,
      sparse: true,     // Allows multiple null values (for email-only signups)
    },
    password: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },

    role: {
      type: String,
      enum: Object.values(CONSTANTS.ROLE),
      required: true,
    },

    profileImage: {
      type: String,
      default: "/uploads/profile/default-avatar.png",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    otp: { type: String },
    emailVerified: { type: Boolean, default: false },
    // compareOtp: { type: Boolean, default: false },
    refreshToken: { type: String },
    qrCode: { type: String },
    qrUrl: { type: String },
    scanningId: { type: String, unique: true, sparse: true },
    // ✅ Patient fields
    healthProfile: {
      height: String,
      weight: String,
      bloodPressure: String,
      bloodGroup: String,
      diabetes: String,
      healthConditions: String,
      emergencyContact: {
        name: String,
        phone: String,
        countryCode: String,
        countryName: String,
        relation: String,
      },
      smartwatch: {
        connected: { type: Boolean, default: false },
        type: { type: String, enum: ["Apple", "Fitbit", "GoogleFit"] },
        lastSync: Date,
        permissions: {
          heartRate: { type: Boolean, default: false },
          stepCount: { type: Boolean, default: false },
          sleepData: { type: Boolean, default: false },
          bloodOxygen: { type: Boolean, default: false },
          bloodPressure: { type: Boolean, default: false },
        },
        data: {
          heartRate: String,
          steps: String,
          sleep: String,
          bloodOxygen: String,
          bloodPressure: String,
        },
      },
      fitbit: {
        accessToken: { type: String, default: null },
        refreshToken: { type: String, default: null },
        userId: { type: String, default: null },
        scope: { type: String, default: null },
        tokenExpiresAt: { type: Date, default: null },
        codeVerifier: { type: String, default: null },
        authState: { type: String, default: null },
        authStartedAt: { type: Date, default: null },
        lastSync: { type: Date, default: null },
      },
    },
    trustedDoctors: [
      {
        name: String,
        specialty: String,
        email: String,
        phone: String,
        countryCode: String,
        countryName: String,
        isFavorite: { type: Boolean, default: false },
      },
    ],

    // ✅ Business owner fields
    businessName: { type: String },
    businessAddress: { type: String },

    // ✅ Subscription
    subscription: {
      type: { type: String, enum: ["free", "premium"], default: "free" },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      status: { type: String, enum: ["active", "inactive", "cancelled"], default: "active" },
    },

    // ✅ Admin fields
    permissions: [{ type: String }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Number },

    // 🔔 FCM Push Token
    fcmToken: { type: String, default: null },

    lastLogin: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Sanitization for Legacy Data (Old Users)
userSchema.pre("validate", function (next) {
  if (this.healthProfile && Array.isArray(this.healthProfile.healthConditions)) {
    this.healthProfile.healthConditions = (this.healthProfile.healthConditions as any).join(", ");
  }
  next();
});

// 🔐 Password Hash
userSchema.pre("save", async function (next) {
  const user = this as IUser;
  if (!user.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// 🔐 Compare Password
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 🔐 Compare OTP
userSchema.methods.compareOtp = async function (candidateOtp: string) {
  if (!this.otp) return false;
  return bcrypt.compare(candidateOtp, this.otp);
};

export default mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);

// export const getUserModel = (conn: Connection): Model<IUser> =>
//   conn.models.User || conn.model<IUser>("User", userSchema);
