import { Request, Response } from "express";
import FAQ from "../../models/FAQ";

export const getFAQs = async (req: Request, res: Response) => {
    try {
        const { category, search, admin = "false" } = req.query;
        const filters: any = {};

        if (admin !== "true") {
            filters.status = "active";
        }

        if (category) {
            filters.category = category;
        }

        if (search) {
            filters.question = { $regex: search as string, $options: "i" };
        }

        const faqs = await FAQ.find(filters).sort({ category: 1, createdAt: -1 });

        res.json({ success: true, data: faqs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const createFAQ = async (req: Request, res: Response) => {
    try {
        const { question, answer, category, status } = req.body;
        const faq = await FAQ.create({ question, answer, category, status });
        res.json({ success: true, message: "FAQ created successfully", data: faq });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateFAQ = async (req: Request, res: Response) => {
    try {
        const { question, answer, category, status } = req.body;
        const faq = await FAQ.findByIdAndUpdate(
            req.params.id,
            { question, answer, category, status },
            { new: true }
        );

        if (!faq) {
            return res.status(404).json({ success: false, message: "FAQ not found" });
        }

        res.json({ success: true, message: "FAQ updated successfully", data: faq });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteFAQ = async (req: Request, res: Response) => {
    try {
        const faq = await FAQ.findByIdAndDelete(req.params.id);

        if (!faq) {
            return res.status(404).json({ success: false, message: "FAQ not found" });
        }

        res.json({ success: true, message: "FAQ deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
