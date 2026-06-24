import multer from "multer";
import path from "path";
import fs from "fs";

// Helper to ensure directory exists
const ensureDir = (dirPath: string) => {
  const absolutePath = path.join(__dirname, "../../", dirPath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
  }
  return absolutePath;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDir("uploads/profile"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${Date.now()}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only image and PDF files are allowed"));
  }
};

export const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

const reportStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDir("uploads/reports"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `report-${Date.now()}${ext}`);
  },
});

const reportFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const isDocument = file.fieldname === "file" && (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf"
  );

  const isAudio = file.fieldname === "audio" && file.mimetype.startsWith("audio/");

  if (isDocument || isAudio) {
    cb(null, true);
  } else {
    cb(new Error("Only image, PDF, and audio files are allowed"));
  }
};

export const uploadMedicalReport = multer({
  storage: reportStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: reportFileFilter,
});

const onboardingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDir("uploads/onboarding")); // Dedicated folder
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `onboarding-${Date.now()}${ext}`);
  },
});

export const uploadOnboarding = multer({
  storage: onboardingStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter, // Reusing your existing filter
});

const adBannerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDir("uploads/ads"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ad-banner-${Date.now()}${ext}`);
  },
});

const adFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed for advertisements"));
  }
};

export const uploadAdBanner = multer({
  storage: adBannerStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Increased to 20MB for video support
  fileFilter: adFileFilter,
});

const ticketAttachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDir("uploads/tickets"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ticket-attach-${Date.now()}${ext}`);
  },
});

export const uploadTicketAttachment = multer({
  storage: ticketAttachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for ticket attachments
  fileFilter,
});

const insuranceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDir("uploads/insurance"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `insurance-${Date.now()}${ext}`);
  },
});

export const uploadInsurance = multer({
  storage: insuranceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

const systemSettingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDir("uploads/settings"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `setting-${Date.now()}${ext}`);
  },
});

export const uploadSystemSetting = multer({
  storage: systemSettingStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

export const uploadFile = uploadProfileImage;
