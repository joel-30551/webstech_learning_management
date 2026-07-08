import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.model';

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.DB_URI as string);
    console.log('Connected to MongoDB...');

    const testUsers = [
      {
        username: 'admin',
        password: 'admin1234',
        role: 'admin' as const,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
      },
      {
        username: 'teacher',
        password: 'teacher1234',
        role: 'teacher' as const,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
      },
      {
        username: 'accountant',
        password: 'accountant1234',
        role: 'accountant' as const,
        firstName: 'Jane',
        lastName: 'Smith',
        isActive: true,
      },
      {
        username: 'student',
        password: 'student1234',
        role: 'student' as const,
        firstName: 'Bob',
        lastName: 'Bruce',
        isActive: true,
      },
    ];

    for (const u of testUsers) {
      const existing = await User.findOne({ username: u.username });
      if (existing) {
        console.log(`User '${u.username}' already exists. Skipping.`);
      } else {
        const newUser = new User(u);
        await newUser.save();
        console.log(`✅ Created User: ${u.username} (${u.role})`);
      }
    }

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedUsers();
