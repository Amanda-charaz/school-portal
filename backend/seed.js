
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school-portal');
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create default admin
    const admin = await User.create({
      full_name: 'Admin User',
      email: 'admin@school.com',
      password: 'admin1234',
      role: 'admin',
      school_id: 'A1',
      raw_password_view: 'admin1234'
    });
    console.log('Created admin:', admin.full_name);

    // Create default teacher with assigned subjects
    const teacher1 = await User.create({
      full_name: 'John Teacher',
      email: 't1@school.com',
      password: 'school1234',
      role: 'teacher',
      school_id: 'T1',
      assigned_subjects: ['Mathematics', 'Science'],
      raw_password_view: 'school1234'
    });
    console.log('Created teacher:', teacher1.full_name);

    // Create another teacher
    const teacher2 = await User.create({
      full_name: 'Jane Teacher',
      email: 't2@school.com',
      password: 'school1234',
      role: 'teacher',
      school_id: 'T2',
      assigned_subjects: ['English', 'History'],
      raw_password_view: 'school1234'
    });
    console.log('Created teacher:', teacher2.full_name);

    // Create default student
    const student = await User.create({
      full_name: 'Bob Student',
      email: 's1@school.com',
      password: 'school1234',
      role: 'student',
      school_id: 'S1',
      assigned_class: '1A',
      raw_password_view: 'school1234'
    });
    console.log('Created student:', student.full_name);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
