const mongoose = require('mongoose');
const { Campaign } = require('../src/models/Campaign');
const { AdSet } = require('../src/models/AdSet');
const { Creative } = require('../src/models/Creative');
const { AdImpression } = require('../src/models/AdImpression');
const { AdClick } = require('../src/models/AdClick');

async function checkAds() {
    await mongoose.connect('mongodb://localhost:27017/smart-health');
    console.log('Connected to DB');

    const now = new Date();
    const campaigns = await Campaign.find({
        status: { $in: ['active', 'approved'] },
    }).lean();

    console.log(`Found ${campaigns.length} active/approved campaigns`);

    for (const c of campaigns) {
        console.log(`Campaign: ${c.name} (${c._id})`);
        console.log(`  Dates: ${c.startDate} to ${c.endDate}`);
        console.log(`  Current time: ${now}`);
        console.log(`  Dates valid: ${c.startDate <= now && c.endDate >= now}`);
        console.log(`  Budget: spent=${c.spentAmount}, total=${c.totalBudget}`);
        console.log(`  Billing Model: ${c.billingModel}`);
        console.log(`  Metrics: ${JSON.stringify(c.metrics)}`);
        console.log(`  Budget valid: ${c.spentAmount < c.totalBudget}`);
        
        const adSets = await AdSet.find({ campaignId: c._id }).lean();
        console.log(`  AdSets: ${adSets.length}`);
        for (const a of adSets) {
            console.log(`    AdSet: ${a.name} (${a._id}) - status: ${a.status}`);
            
            const impressions = await AdImpression.countDocuments({ adSetId: a._id });
            const clicks = await AdClick.countDocuments({ adSetId: a._id });
            console.log(`    DB Counts -> Impressions: ${impressions}, Clicks: ${clicks}`);
        }
    }

    const { AdDeliveryEngine } = require('../src/services/adDeliveryEngine');
    const engine = new AdDeliveryEngine();

    const mockContext = {
        userId: '69f100000000000000000001', // mock
        age: 25,
        gender: 'male',
        location: { city: 'Mumbai', country: 'India' },
        interests: [],
        healthConditions: [],
        userStatus: 'active'
    };

    console.log('\n--- Testing Delivery Engine ---');
    const ads = await engine.getTargetedAds(mockContext);
    console.log(`Engine returned ${ads.length} ads`);
    for (const ad of ads) {
        console.log(`  Ad: ${ad.headline} - Score: ${ad.score}`);
    }

    await mongoose.disconnect();
}

checkAds().catch(console.error);
