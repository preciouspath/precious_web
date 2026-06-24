import { Request, Response } from 'express';
import Folder from '../../models/Folder';


export const createFolder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { name } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Folder name is required' });
        }

        // Check if folder already exists
        const existingFolder = await Folder.findOne({ userId, name });
        if (existingFolder) {
            return res.status(400).json({ message: 'Folder with this name already exists' });
        }

        const folder = await Folder.create({
            userId,
            name,
            type: 'folder' // Default type
        });

        res.status(201).json({
            success: true,
            data: folder,
            message: 'Folder created successfully'
        });
    } catch (error: any) {
        console.error('Error creating folder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create folder',
            error: error.message
        });
    }
};

/**
 * Get all folders for the user
 */
export const getFolders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const folders = await Folder.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: folders
        });
    } catch (error: any) {
        console.error('Error fetching folders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch folders',
            error: error.message
        });
    }
};

/**
 * Update folder (rename)
 */
export const updateFolder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { name } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const folder = await Folder.findOne({ _id: id, userId });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        if (name) {
            // Check for duplicate name if name is changing
            if (name !== folder.name) {
                const existing = await Folder.findOne({ userId, name });
                if (existing) {
                    return res.status(400).json({ message: 'Folder with this name already exists' });
                }
                folder.name = name;
            }
        }

        await folder.save();

        res.status(200).json({
            success: true,
            data: folder,
            message: 'Folder updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating folder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update folder',
            error: error.message
        });
    }
};

/**
 * Delete folder
 */
export const deleteFolder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const folder = await Folder.findOneAndDelete({ _id: id, userId });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        // Delete all reports within this folder
        const MedicalReport = require('../../models/MedicalReport').default;
        await MedicalReport.deleteMany({ folderId: id, patientId: userId });

        res.status(200).json({
            success: true,
            message: 'Folder deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting folder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete folder',
            error: error.message
        });
    }
};
