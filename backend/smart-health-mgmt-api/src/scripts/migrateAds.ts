import mongoose from "mongoose";
import { Advertisement } from "../models/Advertisement";
import { Campaign, CampaignStatus, CampaignObjective, BillingModel } from "../models/Campaign";
import { AdSet } from "../models/AdSet";
import { Creative, CreativeType } from "../models/Creative";
import dotenv from "dotenv";

dotenv.config();

const migrate = async () => {
  try {
    console.log("🚀 Starting Ads Migration...");

    // Connect to DB if not connected (assuming this script is run via a loader that handles connection)
    // For now, let's assume we are in an environment where we can just query.

    const ads = await Advertisement.find({});
    console.log(`Found ${ads.length} legacy ads to migrate.`);

    for (const ad of ads) {
      console.log(`Migrating: ${ad.title} (${ad._id})`);

      // 1. Map status
      let status = CampaignStatus.PENDING;
      if (ad.status === 'Active' || ad.status === 'Approved') status = CampaignStatus.ACTIVE;
      if (ad.status === 'Rejected') status = CampaignStatus.REJECTED;
      if (ad.status === 'Paused') status = CampaignStatus.PAUSED;
      if (ad.status === 'Completed') status = CampaignStatus.COMPLETED;

      // 2. Create Campaign
      const campaign = new Campaign({
        ownerId: ad.ownerId,
        name: ad.title,
        objective: CampaignObjective.REACH, // Default objective for legacy ads
        status: status,
        totalBudget: ad.budget,
        spentAmount: ad.spentAmount || 0,
        billingModel: BillingModel.CPM,
        startDate: ad.startDate || new Date(),
        endDate: ad.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metrics: {
          impressions: ad.reach || 0, // In legacy, reach was used for impressions
          uniqueReach: ad.reach || 0,
          clicks: ad.clicks || 0,
          ctr: ad.reach ? ((ad.clicks || 0) / ad.reach) * 100 : 0
        },
        rejectionReason: ad.rejectionReason,
        legacyAdId: ad._id
      });

      await campaign.save();

      // 3. Create AdSet
      const adSet = new AdSet({
        campaignId: campaign._id,
        name: `${ad.title} - Main AdSet`,
        targeting: {
          locations: ad.targetLocation ? [{
            type: 'city',
            value: ad.targetLocation.toLowerCase(),
            label: ad.targetLocation
          }] : [],
          ageRange: { min: 18, max: 65 },
          genders: ['all']
        },
        placement: 'dashboard_banner',
        status: 'active'
      });

      await adSet.save();

      // 4. Create Creative
      const creative = new Creative({
        adSetId: adSet._id,
        campaignId: campaign._id,
        type: CreativeType.IMAGE,
        mediaUrl: ad.image,
        headline: ad.title,
        description: ad.description,
        ctaType: 'learn_more',
        ctaLink: (ad as any).link,
        status: 'active'
      });

      await creative.save();

      console.log(`✅ Successfully migrated: ${ad.title}`);
    }

    console.log("✨ Migration Completed Successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration Failed:", err);
    process.exit(1);
  }
};

// If run directly
if (require.main === module) {
  // DB Connection logic would go here if needed
  // For this environment, we assume the script will be executed in a context with DB access
}

export default migrate;
