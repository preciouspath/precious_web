// src/controllers/Admin/patientController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Parser } from "json2csv";
import pdf from "pdfkit";
import moment from "moment";
import user from "../../models/user";
import QRCode from "qrcode";


export const getPatients = async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      from,
      to,
      export: exportType,
      page = "1",
      limit = "10",
    } = req.query;

    const filters: any = { role: "patient" };

    // Single search key for multiple fields
    if (search) {
      const regex = { $regex: search as string, $options: "i" };
      filters.$or = [
        { fullName: regex },
        { email: regex },
        { mobileNumber: regex },
      ];
    }

    if (status) filters.status = status;
    if (from || to) {
      filters.createdAt = {};
      if (from) filters.createdAt.$gte = new Date(from as string);
      if (to) filters.createdAt.$lte = new Date(to as string);
    }

    // Parse pagination params
    const pageNumber = Math.max(parseInt(page as string, 10), 1);
    const pageSize = Math.max(parseInt(limit as string, 10), 1);

    const total = await user.countDocuments(filters);

    // For export, ignore pagination
    if (exportType) {
      const patients = await user.find(filters).lean();

      if (exportType === "csv") {
        const parser = new Parser();
        const csv = parser.parse(patients);
        res.header("Content-Type", "text/csv");
        res.attachment(`patients-${moment().format("YYYYMMDD")}.csv`);
        return res.send(csv);
      }

      if (exportType === "pdf") {
        const doc = new pdf();
        res.header("Content-Type", "application/pdf");
        res.attachment(`patients-${moment().format("YYYYMMDD")}.pdf`);
        doc.text(JSON.stringify(patients, null, 2));
        doc.pipe(res);
        doc.end();
        return;
      }
    }

    // Paginated fetch
    const patients = await user
      .find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();


    res.json({
      success: true,
      data: patients,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

// GET /api/patients/:id
export const getPatientById = async (req: Request, res: Response) => {
  try {
    const patient = await user.findById(req.params.id).lean();
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });

    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

// POST /api/patients/:id/reset-password
export const resetPatientPassword = async (req: Request, res: Response) => {
  try {
    const patient = await user.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });

    const newPassword = "Temp@123"; // You can generate random password
    const salt = await bcrypt.genSalt(10);
    patient.password = await bcrypt.hash(newPassword, salt);
    await patient.save();

    // TODO: Send new password via email/SMS
    res.json({ success: true, message: "Password reset successfully", password: newPassword });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

// PATCH /api/patients/:id/status
export const togglePatientStatus = async (req: Request, res: Response) => {
  try {
    const patient = await user.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });

    patient.status = patient.status === "active" ? "inactive" : "active";
    await patient.save();

    res.json({ success: true, message: `Patient status updated to ${patient.status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

// GET /api/patients/:id/reports
export const getPatientReports = async (req: Request, res: Response) => {
  try {
    const patient = await user.findById(req.params.id).lean();
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });

    const reports = {
      // healthTrends: patient.healthProfile?.smartwatch?.data || {},
      prescriptions: [],
      notifications: [],
    };

    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};


export const addPatient = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      password,
      mobileNumber,
      dateOfBirth,
      gender,
      healthProfile,
    } = req.body;

    if (!fullName?.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    if (!password?.trim()) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }
    if (!mobileNumber?.trim()) {
      return res.status(400).json({ success: false, message: "Mobile Number is required" });
    }

    const existingEmail = await user.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const existingMobile = await user.findOne({ mobileNumber });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const patient = new user({
      fullName,
      email,
      password: hashedPassword,
      mobileNumber,
      dateOfBirth,
      gender: gender || "other",
      role: "patient",
      healthProfile: healthProfile || {},
    });
    console.log(patient, 'patient')
    const doctorUploadUrl = `https://smart-health-management.devtechnosys.tech/doctor/upload/${patient._id}`;

    const qrCodeImage = await QRCode.toDataURL(doctorUploadUrl);

    patient.qrCode = qrCodeImage;
    patient.qrUrl = doctorUploadUrl;
    await patient.save();

    res.status(201).json({
      success: true,
      message: "Patient added successfully & QR Generated",
      data: patient,
      doctorUploadUrl,
      qrCode: qrCodeImage,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err,
    });
  }
};


export const deletePatient = async (req: Request, res: Response) => {
  try {
    const patient = await user.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    await patient.deleteOne();

    res.json({ success: true, message: "Patient deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { fullName, email, mobileNumber, dateOfBirth, gender, healthProfile } = req.body;

    const patient = await user.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    if (email && email !== patient.email) {
      const existing = await user.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
      patient.email = email;
    }

    if (mobileNumber && mobileNumber !== patient.mobileNumber) {
      const existing = await user.findOne({ mobileNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: "Mobile number already exists" });
      }
      patient.mobileNumber = mobileNumber;
    }

    if (fullName) patient.fullName = fullName;
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (healthProfile) patient.healthProfile = healthProfile;

    await patient.save();

    res.json({ success: true, message: "Patient updated successfully", data: patient });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

export const updatePatient2 = async (req: Request, res: Response) => {
  try {
    const { fullName, email, mobileNumber, dateOfBirth, gender, healthProfile } = req.body;

    const patient = await user.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    if (email && email !== patient.email) {
      const existing = await user.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
      patient.email = email;
    }

    if (mobileNumber && mobileNumber !== patient.mobileNumber) {
      const existing = await user.findOne({ mobileNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: "Mobile number already exists" });
      }
      patient.mobileNumber = mobileNumber;
    }

    if (fullName) patient.fullName = fullName;
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (healthProfile) patient.healthProfile = healthProfile;

    await patient.save();

    res.json({ success: true, message: "Patient updated successfully", data: patient });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};


