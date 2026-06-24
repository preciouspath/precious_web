import { Request, Response } from "express";
import MedicalReport from "../../models/MedicalReport";
import user from "../../models/user";
import mongoose from "mongoose";
import { translateText } from "../../services/translateService";
import { processDocument } from "../../services/ocrService";
import path from "path";

/**
 * Get QR & OCR Monitoring Logs
 * GET /api/admin/qr-ocr
 */
export const getMonitoringLogs = async (req: Request, res: Response) => {
    try {
        const { search, page = "1", limit = "10" } = req.query;

        const pageNumber = Math.max(parseInt(page as string, 10), 1);
        const pageSize = Math.max(parseInt(limit as string, 10), 1);

        // DIAGNOSTIC LOGS - to see what's in the DB
        const rawCheck = await MedicalReport.find({}).limit(1).lean();
        console.log("[Diagnostic] Sample Report:", JSON.stringify(rawCheck, null, 2));

        let reportFilters: any = {};

        if (search) {
            const searchStr = (search as string).trim();

            // 1. Find users matching the search term
            const matchingUsers = await user.find({
                $or: [
                    { fullName: { $regex: searchStr, $options: "i" } },
                    { email: { $regex: searchStr, $options: "i" } }
                ]
            }).select("_id").lean();

            const userIds = matchingUsers.map(u => u._id);

            // 2. Build the filter for MedicalReport
            // We search in OCR text, filename, extracted data, AND matching patient IDs
            reportFilters.$or = [
                { ocrText: { $regex: searchStr, $options: "i" } },
                { fileName: { $regex: searchStr, $options: "i" } },
                { patientId: { $in: userIds } },
                { "extractedData.patientName": { $regex: searchStr, $options: "i" } },
                { "extractedData.diagnosis": { $regex: searchStr, $options: "i" } }
            ];

            // 3. Special case for Scanning ID (last 4 chars of _id)
            const cleanSearch = searchStr.toUpperCase().startsWith("OCR-")
                ? searchStr.slice(4)
                : searchStr;

            if (cleanSearch.length >= 3) {
                // If it looks like a hex suffix, try a regex on the _id converted to string
                // Note: $expr is more reliable for this
                reportFilters.$or.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$_id" },
                            regex: `${cleanSearch}$`,
                            options: "i"
                        }
                    }
                });
            }

            console.log(`[OCR Search] Query: "${searchStr}", Users Found: ${userIds.length}`);
        }

        const reportsCount = await MedicalReport.countDocuments(reportFilters);
        const reports = await MedicalReport.find(reportFilters)
            .populate("patientId", "fullName email")
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();

        console.log(`[OCR Search] Results: ${reports.length} / ${reportsCount}`);

        // Mapping Reports to uniform monitoring items
        const monitoringLogs = reports.map((r: any) => ({
            _id: r._id,
            scanningId: `OCR-${r._id.toString().slice(-4).toUpperCase()}`,
            user: r.patientId?.fullName || "Deleted User",
            userId: r.patientId?._id,
            type: "Prescription OCR",
            text: r.ocrText || "No text extracted",
            date: r.createdAt,
            flagged: r.isFlagged || false,
            extractedData: r.extractedData,
            fileUrl: r.fileUrl
        }));

        res.json({
            success: true,
            data: monitoringLogs,
            meta: {
                total: reportsCount,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(reportsCount / pageSize),
            },
        });
    } catch (err) {
        console.error("Monitoring Logs Error:", err);
        res.status(500).json({ success: false, message: "Server Error", error: err });
    }
};

/**
 * Toggle Report Flag
 * PUT /api/admin/qr-ocr/:reportId/toggle-flag
 */
export const toggleReportFlag = async (req: Request, res: Response) => {
    try {
        const { reportId } = req.params;
        const report = await MedicalReport.findById(reportId);

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        report.isFlagged = !report.isFlagged;
        await report.save();

        res.json({
            success: true,
            message: `Report ${report.isFlagged ? "flagged" : "unflagged"} successfully`,
            data: report
        });
    } catch (err) {
        console.error("Toggle Flag Error:", err);
        res.status(500).json({ success: false, message: "Server Error", error: err });
    }
};

/**
 * Upload Document for OCR Processing
 * POST /api/admin/qr-ocr/upload
 */
export const uploadOcrDocument = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Optional: Get patientId from request, or use a default test patient
        const { patientId } = req.body;

        let assignedPatientId: mongoose.Types.ObjectId;

        if (patientId) {
            assignedPatientId = new mongoose.Types.ObjectId(patientId);
        } else {
            // Find or create a "Test Patient" for OCR uploads
            let testPatient = await user.findOne({ email: "ocr-test@system.test" });
            if (!testPatient) {
                testPatient = await user.create({
                    fullName: "OCR Test Patient",
                    email: "ocr-test@system.test",
                    password: "not-used",
                    role: "patient",
                    emailVerified: true
                });
            }
            assignedPatientId = testPatient._id as mongoose.Types.ObjectId;
        }

        // Get file path
        const filePath = path.resolve(req.file.path);
        console.log(`[OCR Upload] Processing file: ${filePath}`);

        // Run OCR
        const ocrResult = await processDocument(filePath);

        if (!ocrResult.success) {
            return res.status(500).json({
                success: false,
                message: "OCR processing failed",
                error: ocrResult.text
            });
        }

        // Create MedicalReport entry
        const report = await MedicalReport.create({
            patientId: assignedPatientId,
            fileUrl: `/uploads/reports/${req.file.filename}`,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            uploadedBy: "doctor",
            ocrText: ocrResult.text,
            ocrStatus: "completed",
            extractedData: {
                patientName: ocrResult.metadata.diagnosis || "",
                diagnosis: ocrResult.metadata.diagnosis || "",
                medications: ocrResult.metadata.medications || [],
                labResults: ocrResult.metadata.labResults || "",
                date: ocrResult.metadata.date || ""
            }
        });

        console.log(`[OCR Upload] Success! Report ID: ${report._id}`);

        res.json({
            success: true,
            message: "Document uploaded and processed successfully",
            data: report,
            ocrText: ocrResult.text
        });
    } catch (err: any) {
        console.error("Upload OCR Document Error:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};

/**
 * Translate OCR Text
 * POST /api/admin/qr-ocr/translate
 */
export const translateOcrText = async (req: Request, res: Response) => {
    try {
        const { text, targetLanguage } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Text is required"
            });
        }

        if (!targetLanguage) {
            return res.status(400).json({
                success: false,
                message: "Target language is required"
            });
        }

        console.log(`[Translation] Translating to ${targetLanguage}...`);

        const result = await translateText(text, targetLanguage);

        res.json({
            success: true,
            translatedText: result.translatedText,
            detectedLanguage: result.detectedSourceLanguage,
            targetLanguage
        });
    } catch (err: any) {
        console.error("Translation Error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Translation failed",
            error: err.message
        });
    }
};

