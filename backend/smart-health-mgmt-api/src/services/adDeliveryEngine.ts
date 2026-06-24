import { Campaign, CampaignStatus } from "../models/Campaign";
import { AdSet } from "../models/AdSet";
import { Creative } from "../models/Creative";
import { AdImpression } from "../models/AdImpression";
import { AdClick } from "../models/AdClick";
import { SystemSetting } from "../models/SystemSetting";
import moment from "moment";

export interface UserTargetingContext {
  userId: string;
  age?: number;
  gender?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  interests?: string[];
  healthConditions?: string[];
  deviceType?: string;
  userStatus?: string;
}

export class AdDeliveryEngine {
  /**
   * Main method to fetch and rank ads for a specific user
   */
  async getTargetedAds(context: UserTargetingContext, limit: number = 5) {
    // 0. Global Check
    const globalEnabled = await SystemSetting.findOne({ key: 'ads_global_enabled' });
    if (globalEnabled && (globalEnabled.value === 'false' || globalEnabled.value === false)) {
      return [];
    }

    const now = new Date();

    // 1. Fetch eligible campaigns (Active or Approved, within budget, within dates)
    const activeCampaigns = await Campaign.find({
      status: { $in: [CampaignStatus.ACTIVE, CampaignStatus.APPROVED] },
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ["$spentAmount", "$totalBudget"] }
    }).lean();

    if (!activeCampaigns.length) return [];

    const campaignIds = activeCampaigns.map(c => c._id);

    // 2. Fetch AdSets for these campaigns that match placement
    // For now assuming 'dashboard_banner' placement
    const adSets = await AdSet.find({
      campaignId: { $in: campaignIds },
      status: "active"
    }).lean();

    if (!adSets.length) return [];

    // 3. Filter AdSets by Targeting & Frequency Caps
    const eligibleAdSets: any[] = [];
    
    for (const adSet of adSets) {
      // Frequency Cap Check
      const dailyImpressions = await AdImpression.countDocuments({
        userId: context.userId,
        campaignId: adSet.campaignId,
        createdAt: { $gte: moment().startOf('day').toDate() }
      });

      if (dailyImpressions >= (adSet.frequencyCap?.maxImpressionsPerDay || 3)) continue;

      const dailyClicks = await AdClick.countDocuments({
        userId: context.userId,
        campaignId: adSet.campaignId,
        createdAt: { $gte: moment().startOf('day').toDate() }
      });

      if (dailyClicks >= (adSet.frequencyCap?.maxClicksPerDay || 5)) continue;

      // Cooldown Check
      const lastImpression = await AdImpression.findOne({
        userId: context.userId,
        campaignId: adSet.campaignId
      }).sort({ createdAt: -1 });

      if (lastImpression) {
        const hoursSinceLast = moment().diff(moment(lastImpression.createdAt), 'hours');
        if (hoursSinceLast < (adSet.frequencyCap?.cooldownHours || 6)) continue;
      }

      // Targeting Match Logic
      let score = this.calculateTargetingScore(adSet, context);
      
      if (score > 0) {
        eligibleAdSets.push({ ...adSet, score });
      }
    }

    if (!eligibleAdSets.length) return [];

    // 4. Get Creatives for eligible AdSets
    const adSetIds = eligibleAdSets.map(a => a._id);
    const creatives = await Creative.find({
      adSetId: { $in: adSetIds },
      status: "active"
    }).lean();

    // 5. Final Ranking & Selection
    const rankedAds = creatives.map(creative => {
      const adSet = eligibleAdSets.find(a => a._id.toString() === creative.adSetId.toString());
      const campaign = activeCampaigns.find(c => c._id.toString() === creative.campaignId.toString());
      
      // Combine AdSet targeting score with Campaign health score
      const budgetHealth = campaign ? (1 - (campaign.spentAmount / campaign.totalBudget)) : 0.5;
      const finalScore = (adSet?.score || 0) * (1 + budgetHealth * 0.5);

      return {
        ...creative,
        score: finalScore,
        campaignObjective: campaign?.objective
      };
    });

    return rankedAds
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateTargetingScore(adSet: any, context: UserTargetingContext): number {
    let score = 0;
    const { targeting } = adSet;

    // A. Location Match (30%)
    if (targeting.locations?.length) {
      let locationScore = 0;
      for (const loc of targeting.locations) {
        const adLoc = loc.value.toLowerCase();
        if (loc.type === 'city' && context.location?.city) {
          const userCity = context.location.city.toLowerCase();
          if (adLoc === userCity || adLoc.includes(userCity) || userCity.includes(adLoc)) {
            locationScore = Math.max(locationScore, 1.0);
          }
        } else if (loc.type === 'state' && context.location?.state) {
          const userState = context.location.state.toLowerCase();
          if (adLoc === userState || adLoc.includes(userState) || userState.includes(adLoc)) {
            locationScore = Math.max(locationScore, 0.6);
          }
        } else if (loc.type === 'country' && context.location?.country) {
          const userCountry = context.location.country.toLowerCase();
          if (adLoc === userCountry || adLoc.includes(userCountry) || userCountry.includes(adLoc)) {
            locationScore = Math.max(locationScore, 0.3);
          }
        }
      }
      // if (locationScore === 0) return 0; // Hard filter disabled temporarily for health-first testing
      score += locationScore * 20; // Reduced location weight
    } else {
      score += 10; // Neutral score for "All locations"
    }

    // B. Demographic Match (20%)
    if (context.age) {
      if (context.age >= (targeting.ageRange?.min || 0) && context.age <= (targeting.ageRange?.max || 100)) {
        score += 10;
      }
    } else {
      score += 5;
    }

    if (targeting.genders?.length && !targeting.genders.includes('all')) {
      if (context.gender && targeting.genders.includes(context.gender.toLowerCase())) {
        score += 10;
      } else {
        return 0; // Hard filter
      }
    } else {
      score += 10;
    }

    // C. Interest & Health Condition Match (60% Primary Weight)
    let interestScore = 0;
    if (targeting.interests?.length || targeting.healthConditions?.length) {
      const userTraits = [...(context.interests || []), ...(context.healthConditions || [])];
      const targetTraits = [...(targeting.interests || []), ...(targeting.healthConditions || [])];
      
      const intersection = userTraits.filter(t => targetTraits.includes(t));
      if (intersection.length > 0) {
        interestScore = Math.min(60, intersection.length * 20); // Massive boost for matching disease
      } else {
        // If the ad specifies health targets but the user matches ZERO, we heavily penalize it
        // but we don't return 0 to allow general ads or edge cases to occasionally show
        interestScore = 0; 
      }
    } else {
      interestScore = 30; // Neutral (General Ad with no specific health targeting)
    }
    score += interestScore;

    // D. Device & Status Match
    if (targeting.deviceTypes?.length && !targeting.deviceTypes.includes('all')) {
      if (context.deviceType && !targeting.deviceTypes.includes(context.deviceType.toLowerCase())) {
        return 0; // Hard filter
      }
    }

    if (targeting.userStatus !== 'all') {
      if (context.userStatus && context.userStatus !== targeting.userStatus) {
        return 0; // Hard filter
      }
    }

    return score;
  }
}

export const adDeliveryEngine = new AdDeliveryEngine();
