import { Request, Response } from "express";
import Insurance from "../../models/Insurance";
import { STATUS_CODE } from "../../utils/statusCode";

export const addInsurance = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { patientName, contactInfo, insuranceCompany, insuranceType } = req.body;
        const file = req.file;

        if (!patientName || !contactInfo || !insuranceCompany || !insuranceType || !file) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "All fields are required, including the insurance document",
            });
        }

        const insurance = await Insurance.create({
            userId,
            patientName,
            contactInfo,
            insuranceCompany,
            insuranceType,
            documentUrl: `/uploads/insurance/${file.filename}`,
            fileName: file.originalname,
            fileType: file.mimetype,
        });

        res.status(STATUS_CODE.CREATED).json({
            success: true,
            message: "Insurance added successfully",
            data: insurance,
        });
    } catch (error: any) {
        console.error("Error adding insurance:", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to add insurance",
            error: error.message,
        });
    }
};

export const getInsurances = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const insurances = await Insurance.find({ userId }).sort({ createdAt: -1 });

        res.status(STATUS_CODE.OK).json({
            success: true,
            data: insurances,
        });
    } catch (error: any) {
        console.error("Error fetching insurances:", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch insurances",
            error: error.message,
        });
    }
};

export const updateInsurance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;
        const { patientName, contactInfo, insuranceCompany, insuranceType } = req.body;
        const file = req.file;

        const updateData: any = {
            patientName,
            contactInfo,
            insuranceCompany,
            insuranceType,
        };

        if (file) {
            updateData.documentUrl = `/uploads/insurance/${file.filename}`;
            updateData.fileName = file.originalname;
            updateData.fileType = file.mimetype;
        }

        const insurance = await Insurance.findOneAndUpdate(
            { _id: id, userId },
            updateData,
            { new: true }
        );

        if (!insurance) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: "Insurance record not found",
            });
        }

        res.status(STATUS_CODE.OK).json({
            success: true,
            message: "Insurance updated successfully",
            data: insurance,
        });
    } catch (error: any) {
        console.error("Error updating insurance:", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update insurance",
            error: error.message,
        });
    }
};

export const deleteInsurance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const insurance = await Insurance.findOneAndDelete({ _id: id, userId });

        if (!insurance) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: "Insurance record not found",
            });
        }

        res.status(STATUS_CODE.OK).json({
            success: true,
            message: "Insurance deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting insurance:", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to delete insurance",
            error: error.message,
        });
    }
};
