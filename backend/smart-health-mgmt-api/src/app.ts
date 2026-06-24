import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
// import Admin from "./routes/Admin";
// import Business from "./routes/Business";
// import Patient from "./routes/Patient";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { connection } from "./db/dbConnection";
import router from "./routes/Admin/indexRoute";
import patientRouter from "./routes/Patient/indexRoute";
import businessRouter from "./routes/Business/indexRoute";
import stripeWebhookRouter from "./routes/webhookRoute";
import adminPaymentRoute from "./routes/Admin/paymentRoute";

dotenv.config();
connection();
const app = express();
app.use(cookieParser());

const allowedOrigins = [
  "https://smart-health-management.devtechnosys.tech",
  "https://smart-health-admin.devtechnosys.tech",
  "https://smart-health-business.devtechnosys.tech",
  "https://preciouspath.com",
  "https://api.preciouspath.com",
  "https://admin.preciouspath.com",
  "https://business.preciouspath.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://172.16.11.162:5173",
  "http://localhost:3000",
  "http://localhost:5175",
  "http://localhost:3001",
  "http://172.16.3.29:3001",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed list or is a subdomain of devtechnosys.tech or preciouspath.com
      const isAllowed = allowedOrigins.includes(origin);
      const isDevTechnosys = origin.endsWith('.devtechnosys.tech') || origin.includes('devtechnosys.tech');
      const isPreciousPath = origin.endsWith('.preciouspath.com') || origin.includes('preciouspath.com');

      if (isAllowed || isDevTechnosys || isPreciousPath) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ⚠️ Stripe webhook route must be BEFORE express.json() to preserve raw body for signature verification
app.use("/api/stripe", stripeWebhookRouter);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "../public/assets"))

);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Mount specific routers first to avoid occlusion by the generic Admin router
app.use("/api/patient", patientRouter);
app.use("/api/business", businessRouter);

// Stripe payment admin routes
app.use("/api/payments", adminPaymentRoute);

// Admin router (handles /api/*)
app.use("/api", router);

// Error handling middleware - must be last
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Handle Multer file size errors gracefully
  if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File is too large. The maximum allowed file size is 10 MB.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

export default app;
