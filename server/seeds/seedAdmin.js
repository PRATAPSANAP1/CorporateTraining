const mongoose = require('mongoose');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');
const config = require('../config/env');

const seedAdmin = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(config.mongoUri);
    console.log('Database connected successfully.');

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log(`Admin account already exists: ${adminExists.email}`);
      process.exit(0);
    }

    const admin = new User({
      name: 'OIT_STACK Admin',
      email: 'admin@oitstack.com',
      password: 'Admin@123',
      role: 'admin',
      college: 'OIT_STACK',
      branch: 'Office of Placements',
      year: 'N/A',
      phone: '9999999999'
    });

    await admin.save();
    console.log(' Default Admin account created successfully!');
    console.log('Credentials:');
    console.log('  Email:    admin@oitstack.com');
    console.log('  Password: Admin@123');

    await Leaderboard.create({ user: admin._id });
    console.log('Leaderboard entry created for Admin.');

    mongoose.connection.close();
    console.log('Database connection closed. Seed complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedAdmin();

