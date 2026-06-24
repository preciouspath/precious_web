import { Request, Response } from 'express';

/**
 * Get Terms and Conditions URL
 * Returns the web URL where users can view the terms and conditions
 */
export const getTermsUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("hello ")
        const frontendUrl = process.env.FRONTEND_URL;
        const termsUrl = `${frontendUrl}/terms`;

        res.status(200).json({
            success: true,
            url: termsUrl,
            message: 'Terms and conditions URL retrieved successfully'
        });
    } catch (error: any) {
        console.error('Error fetching terms URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve terms URL',
            error: error.message
        });
    }
};
