import { Request, Response } from "express";
import Contact from "../../models/Contact";
import { SystemSetting } from "../../models/SystemSetting";
import { sendMail } from "../../utils/sendMail";

/**
 * Get Support Contact Info
 * GET /api/patient/auth/support/contact-info
 */
export const getSupportInfo = async (req: Request, res: Response) => {
    try {
        const { keys } = req.query;
        
        if (keys) {
            const keysArray = (keys as string).split(",");
            const settings = await SystemSetting.find({ key: { $in: keysArray } });
            
            const settingsMap = settings.reduce((acc: any, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

            return res.status(200).json({
                success: true,
                data: settingsMap
            });
        }

        const emailSetting = await SystemSetting.findOne({ key: "support_email" });
        const phoneSetting = await SystemSetting.findOne({ key: "support_phone" });

        const supportInfo = {
            email: emailSetting?.value || "support@gmail.com",
            phone: phoneSetting?.value || "+1 234 567 890"
        };

        res.status(200).json({
            success: true,
            data: supportInfo
        });
    } catch (error: any) {
        console.error("Get Support Info Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

/**
 * Submit Contact Inquiry
 * POST /api/patient/auth/support/contact
 */
export const submitContactInquiry = async (req: Request, res: Response) => {
    try {
        const { name, email, subject, message } = req.body;
        const userId = (req as any).user?.id || (req as any).user?.sub;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields (name, email, subject, message)"
            });
        }

        const inquiry = await Contact.create({
            name,
            email,
            subject,
            message,
            user: userId
        });

        // Send Email to Support Team (Dynamic from Settings)
        const supportEmailSetting = await SystemSetting.findOne({ key: "support_email" });
        const supportEmail = supportEmailSetting?.value || "support@yopmail.com";

        try {
            await sendMail(
                supportEmail,
                `New Contact Inquiry: ${subject}`,
                `<h3>New Inquiry from ${name}</h3>
                 <p><strong>Email:</strong> ${email}</p>
                 <p><strong>Subject:</strong> ${subject}</p>
                 <p><strong>Message:</strong></p>
                 <p>${message}</p>`
            );

            // Send Confirmation to User
            await sendMail(
                email,
                "We received your inquiry",
                `<p>Hi ${name},</p>
                 <p>Thank you for reaching out to Precious Path. We have received your inquiry regarding "${subject}" and will get back to you soon.</p>
                 <p>Best regards,<br/>The Precious Path Team</p>`
            );
        } catch (mailError) {
            console.error("Mail Sending Error:", mailError);
            // Don't fail the request if mail fails, as inquiry is already saved
        }

        res.status(201).json({
            success: true,
            message: "Your inquiry has been submitted successfully. We will get back to you soon.",
            data: inquiry
        });
    } catch (error: any) {
        console.error("Submit Contact Inquiry Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};
