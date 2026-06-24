import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/newsmart-health');
  const db = mongoose.connection;
  const business = await db.collection('businesses').findOne({});
  console.log('Business:', business ? business.email : 'None found');
  const user = await db.collection('users').findOne({ role: 'admin' });
  console.log('Admin:', user ? user.email : 'None found');
  process.exit(0);
};
run();
