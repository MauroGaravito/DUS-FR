const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedDefaultUser() {
  const email = process.env.SEED_USER_EMAIL || 'engineer@example.com';
  const existing = await User.findOne({ email });
  if (existing) {
    return existing;
  }

  const name = process.env.SEED_USER_NAME || 'Default Engineer';
  const password = process.env.SEED_USER_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'engineer'
  });
  return user;
}

module.exports = { seedDefaultUser };
