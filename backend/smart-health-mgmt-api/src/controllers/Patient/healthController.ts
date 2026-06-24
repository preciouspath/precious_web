import { Request, Response } from "express";
import HealthHistory from "../../models/HealthHistory";

/**
 * Save or update health data
 * POST /api/dashboard/save-health-data
 */
export const updateHealthData = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const {
            date,
            steps,
            heartRate,
            bloodOxygen,
            sleepHours,
            bloodPressure,
            source = "manual"
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!date || steps === undefined || heartRate === undefined || bloodOxygen === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: date, steps, heartRate, bloodOxygen"
            });
        }

        // Record date (normalize to start of day)
        const recordDate = new Date(date);
        recordDate.setHours(0, 0, 0, 0);

        // Check if record for this date exists
        let healthRecord = await HealthHistory.findOne({
            userId: userId,
            date: {
                $gte: recordDate,
                $lt: new Date(recordDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (healthRecord) {
            // Update existing record
            healthRecord.steps = steps;
            healthRecord.heartRate = heartRate;
            healthRecord.bloodOxygen = bloodOxygen;
            if (sleepHours) healthRecord.sleepHours = sleepHours;
            if (bloodPressure) healthRecord.bloodPressure = bloodPressure;
            healthRecord.source = source;
            await healthRecord.save();
        } else {
            // Create new record
            healthRecord = new HealthHistory({
                userId: userId,
                date: recordDate,
                steps,
                heartRate,
                bloodOxygen,
                sleepHours: sleepHours || 0,
                bloodPressure: bloodPressure || "--/--",
                source
            });
            await healthRecord.save();
        }

        res.json({
            success: true,
            message: "Health data saved successfully",
            data: healthRecord
        });
    } catch (error) {
        console.error("Update Health Data Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error
        });
    }
};
