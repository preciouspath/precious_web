import mongoose from 'mongoose';
import { SystemSetting } from '../models/SystemSetting';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedData = [
  // Social Links
  { key: 'facebook_url', value: 'https://facebook.com/login', description: 'Facebook login URL' },
  { key: 'twitter_url', value: 'https://twitter.com/login', description: 'Twitter login URL' },
  { key: 'pinterest_url', value: 'https://pinterest.com/login', description: 'Pinterest login URL' },
  { key: 'instagram_url', value: 'https://instagram.com/accounts/login', description: 'Instagram login URL' },
  
  // Contact Info
  { key: 'support_email', value: 'support@yopmail.com', description: 'Support Email' },
  { key: 'support_phone', value: '+1 234 567 890', description: 'Support Phone' },

  // Subscription & OCR Settings
  { key: 'default_free_subscription_days', value: '30', description: 'Default free subscription days for new users' },
  { key: 'free_plan_ocr_monthly_limit', value: '20', description: 'Monthly OCR limit for free plan users' },

  // About Us Specific Sections
  { 
    key: 'about_us_intro_text', 
    value: "Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,", 
    description: 'About Us Intro Text' 
  },
  { key: 'about_us_doctor_image', value: '/images/doctor.png', description: 'About Us Intro Doctor Image' },
  
  { 
    key: 'about_us_vision_text', 
    value: "Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,\n\n" + 
           "when an unknown printer took a galley of type and scrambled it to make a type specimen book.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,", 
    description: 'About Us Vision Text' 
  },
  { key: 'about_us_vision_image', value: '/images/Frame.png', description: 'About Us Vision Image' },
  
  { 
    key: 'about_us_team_description', 
    value: "Meet the visionaries driving our mission to deliver exceptional healthcare services.", 
    description: 'About Us Team Description' 
  },
  
  // Team Member 1
  { key: 'about_us_member1_name', value: 'Michael Rodriguez', description: 'Team Member 1 Name' },
  { key: 'about_us_member1_role', value: 'CEO & Co-Founder', description: 'Team Member 1 Role' },
  { key: 'about_us_member1_image', value: '/images/team1.png', description: 'Team Member 1 Image' },
  
  // Team Member 2
  { key: 'about_us_member2_name', value: 'Nancy Wilson', description: 'Team Member 2 Name' },
  { key: 'about_us_member2_role', value: 'Chief Technology Officer', description: 'Team Member 2 Role' },
  { key: 'about_us_member2_image', value: '/images/team2.png', description: 'Team Member 2 Image' },
  
  // Team Member 3
  { key: 'about_us_member3_name', value: 'Emily Chen', description: 'Team Member 3 Name' },
  { key: 'about_us_member3_role', value: 'Chief Marketing Officer', description: 'Team Member 3 Role' },
  { key: 'about_us_member3_image', value: '/images/team3.png', description: 'Team Member 3 Image' },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-health';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    for (const item of seedData) {
      await SystemSetting.findOneAndUpdate(
        { key: item.key },
        { value: item.value, description: item.description },
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded setting: ${item.key}`);
    }

    console.log('🚀 Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
