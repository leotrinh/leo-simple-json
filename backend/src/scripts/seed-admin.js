/**
 * One-time seed script — creates an admin account if not exists.
 * Usage: node src/scripts/seed-admin.js [email] [password]
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';

const email    = process.argv[2] || 'admin@example.com';
const password = process.argv[3] || 'Admin@123456';

await mongoose.connect(process.env.MONGO_URI);

const existing = await User.findOne({ email });
if (existing) {
  if (existing.role !== 'admin') {
    await User.updateOne({ email }, { $set: { role: 'admin' } });
    console.log(`✓ Promoted existing user "${email}" to admin`);
  } else {
    console.log(`ℹ  Admin "${email}" already exists — skipped`);
  }
} else {
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, name: email.split('@')[0], passwordHash, provider: 'local', role: 'admin' });
  console.log(`✓ Admin created: ${email} / ${password}`);
}

await mongoose.disconnect();
