import { Request, Response } from "express";
import { adDeliveryEngine, UserTargetingContext } from "../../services/adDeliveryEngine";
import { AdImpression } from "../../models/AdImpression";
import { AdClick } from "../../models/AdClick";
import { Campaign, BillingModel } from "../../models/Campaign";
import { Creative } from "../../models/Creative";
import { SystemSetting } from "../../models/SystemSetting";
import User from "../../models/user";
import MedicalReport from "../../models/MedicalReport";
import moment from "moment";

// Get targeted ads for patient
export const getActiveAdsV2 = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Check if premium
        if (user.subscription?.type === "premium" && user.subscription?.status === "active") {
            return res.json({ success: true, data: [] });
        }

        // Aggregate Health Conditions from User Profile & Docs
        let aggregatedHealthConditions: string[] = [];
        
        // 1. Get explicit string tags
        if ((user.healthProfile as any)?.healthConditions) {
            aggregatedHealthConditions = (user.healthProfile as any).healthConditions.split(',').map((s: string) => s.trim().toLowerCase());
        }

        // 2. Check profile flags
        if ((user.healthProfile as any)?.diabetes?.toLowerCase() === 'positive') aggregatedHealthConditions.push('diabetes');
        
        const bp = (user.healthProfile as any)?.bloodPressure;
        if (bp && Number(bp.split('/')[0]) >= 140) aggregatedHealthConditions.push('hypertension');
        
        // 3. Query Medical Reports for diagnosis
        try {
            const recentReports = await MedicalReport.find({ patientId: user._id }).sort({ createdAt: -1 }).limit(5);
            for (const report of recentReports) {
                if (report.extractedData?.potentialDiagnosis) {
                    aggregatedHealthConditions.push(report.extractedData.potentialDiagnosis.toLowerCase());
                    const diagnosisWords = report.extractedData.potentialDiagnosis.split(/[\s,]+/);
                    for (const word of diagnosisWords) {
                        if (word.length > 3) aggregatedHealthConditions.push(word.toLowerCase());
                    }
                }
                
                // Parse transcript text for known keywords
                if (report.transcriptText) {
                    const text = report.transcriptText.toLowerCase();
                    const knownConditions = ['diabetes', 'hypertension', 'cardiac', 'orthopedics', 'nutrition', 'yoga', 'dental', 'skin care', 'weight loss'];
                    for (const condition of knownConditions) {
                        if (text.includes(condition)) {
                            aggregatedHealthConditions.push(condition);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching medical reports for targeting", e);
        }

        // Clean up array
        aggregatedHealthConditions = Array.from(new Set(aggregatedHealthConditions));

        // Build targeting context
        const context: UserTargetingContext = {
            userId: user._id.toString(),
            age: user.dateOfBirth ? moment().diff(moment(user.dateOfBirth), 'years') : undefined,
            gender: user.gender,
            location: {
                city: user.city,
                state: user.state,
                country: user.countryName
            },
            interests: user.interests,
            healthConditions: aggregatedHealthConditions,
            userStatus: 'active' // simplifying
        };

        const ads = await adDeliveryEngine.getTargetedAds(context, 5);

        return res.json({ success: true, data: ads });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// Track impression
export const trackImpressionV2 = async (req: Request, res: Response) => {
    try {
        const { creativeId } = req.params;
        console.log(`[DEBUG] trackImpressionV2 called for creative: ${creativeId}`);
        const userId = (req as any).user.id;
        const { placement } = req.body || {};

        const creative = await Creative.findById(creativeId);
        if (!creative) return res.status(404).json({ success: false, message: "Creative not found" });

        const campaign = await Campaign.findById(creative.campaignId);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

        // Check if budget already exhausted
        if (campaign.spentAmount >= campaign.totalBudget) {
            return res.status(400).json({ success: false, message: "Campaign budget exhausted" });
        }

        // Calculate cost for this impression if CPM
        let cost = 0;
        if (campaign.billingModel === BillingModel.CPM) {
            const baseCpmSetting = await SystemSetting.findOne({ key: 'ads_base_cpm' });
            const baseCpm = baseCpmSetting ? Number(baseCpmSetting.value) : 10;
            cost = (campaign.cpmRate || baseCpm) / 1000;
        }

        // Record impression
        const impression = new AdImpression({
            campaignId: campaign._id,
            adSetId: creative.adSetId,
            creativeId: creative._id,
            userId,
            placement: placement || 'dashboard_banner',
            cost
        });

        await impression.save();

        // Update campaign spentAmount & metrics
        campaign.spentAmount = Math.round(((campaign.spentAmount || 0) + cost) * 100) / 100;
        
        if (!campaign.metrics) {
            campaign.metrics = { impressions: 0, uniqueReach: 0, clicks: 0, ctr: 0, avgCpc: 0, avgCpm: 0 };
        }
        campaign.metrics.impressions = (campaign.metrics.impressions || 0) + 1;
        
        // Simple unique reach calculation: check if this is the first impression for this user/campaign
        const previousImpression = await AdImpression.findOne({
            userId,
            campaignId: campaign._id,
            _id: { $ne: impression._id }
        });
        if (!previousImpression) {
            campaign.metrics.uniqueReach = (campaign.metrics.uniqueReach || 0) + 1;
        }

        await campaign.save();

        // Update creative metrics
        if (!creative.metrics) {
            creative.metrics = { impressions: 0, clicks: 0, ctr: 0 };
        }
        creative.metrics.impressions = (creative.metrics.impressions || 0) + 1;
        if (creative.metrics.impressions > 0) {
            creative.metrics.ctr = ((creative.metrics.clicks || 0) / creative.metrics.impressions) * 100;
        }
        await creative.save();

        return res.json({ success: true, message: "Impression tracked" });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// Track click
export const trackClickV2 = async (req: Request, res: Response) => {
    try {
        const { creativeId } = req.params;
        console.log(`[DEBUG] trackClickV2 called for creative: ${creativeId}`);
        const userId = (req as any).user.id;

        const creative = await Creative.findById(creativeId);
        if (!creative) return res.status(404).json({ success: false, message: "Creative not found" });

        const campaign = await Campaign.findById(creative.campaignId);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

        // Calculate cost if CPC
        let cost = 0;
        if (campaign.billingModel === BillingModel.CPC) {
            const baseCpcSetting = await SystemSetting.findOne({ key: 'ads_base_cpc' });
            const baseCpc = baseCpcSetting ? Number(baseCpcSetting.value) : 0.5;
            cost = campaign.cpcRate || baseCpc;
        }

        const click = new AdClick({
            campaignId: campaign._id,
            adSetId: creative.adSetId,
            creativeId: creative._id,
            userId,
            cost,
            ctaType: creative.ctaType
        });

        await click.save();

        // Update campaign
        campaign.spentAmount = Math.round(((campaign.spentAmount || 0) + cost) * 100) / 100;
        
        if (!campaign.metrics) {
            campaign.metrics = { impressions: 0, uniqueReach: 0, clicks: 0, ctr: 0, avgCpc: 0, avgCpm: 0 };
        }
        campaign.metrics.clicks = (campaign.metrics.clicks || 0) + 1;
        if (campaign.metrics.impressions > 0) {
            campaign.metrics.ctr = (campaign.metrics.clicks / campaign.metrics.impressions) * 100;
        }
        await campaign.save();

        // Update creative
        if (!creative.metrics) {
            creative.metrics = { impressions: 0, clicks: 0, ctr: 0 };
        }
        creative.metrics.clicks = (creative.metrics.clicks || 0) + 1;
        if (creative.metrics.impressions > 0) {
            creative.metrics.ctr = (creative.metrics.clicks / creative.metrics.impressions) * 100;
        }
        await creative.save();

        return res.json({ success: true, message: "Click tracked" });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};
