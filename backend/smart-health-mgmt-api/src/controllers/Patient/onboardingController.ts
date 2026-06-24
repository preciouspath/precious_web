import { Request, Response } from "express";
import Onboarding from "../../models/Onboarding";


/**
 * @desc Get all active onboarding screens for the mobile app
 * @route GET /api/onboarding
 */
export const getOnboardingScreens = async (req: Request, res: Response) => {
    try {
        const screens = await Onboarding.find({ isActive: true }).sort({ order: 1 });

        res.status(200).json({
            success: true,
            count: screens.length,
            data: screens,
        });
    } catch (error) {
        console.error("Fetch Onboarding Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @desc Add a new onboarding screen (Admin only)
 * @route POST /api/onboarding
 */
export const addOnboardingScreen = async (req: Request, res: Response) => {
    try {
        const { title, description, order } = req.body;
        const file = req.file;


        if (!title || !description || !file) {
            return res.status(400).json({
                success: false,
                message: "Title, description, and image file are required",
            });
        }

        // Construct the URL professionally
        // file.path gives the relative path like 'uploads/onboarding/filename.jpg'
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const imageUrl = `${baseUrl}/${file.path.replace(/\\/g, '/')}`;

        const newScreen = new Onboarding({
            title,
            description,
            imageUrl: imageUrl,
            order: order || 0,
        });

        await newScreen.save();

        res.status(201).json({
            success: true,
            message: "Onboarding screen added successfully",
            data: newScreen,
        });
    } catch (error) {
        console.error("Add Onboarding Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};