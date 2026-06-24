
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB successfully!');

    // Find all users and log their assigned_class
    console.log('\n=== All Users ===');
    const allUsers = await User.find({}).select('full_name school_id role assigned_class');
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(u => {
      console.log(`[${u.role}] ${u.full_name} (${u.school_id}): assigned_class = "${u.assigned_class}"`);
    });

    // Find all distinct assigned_class values (from ALL users)
    console.log('\n=== Distinct assigned_class values (all users) ===');
    const distinctClassesAll = await User.distinct('assigned_class', { assigned_class: { $ne: null, $ne: '' } });
    console.log('All distinct classes:', distinctClassesAll);

    // Find all distinct assigned_class values (only students)
    console.log('\n=== Distinct assigned_class values (only students) ===');
    const distinctClassesStudents = await User.distinct('assigned_class', { role: 'student', assigned_class: { $ne: null, $ne: '' } });
    console.log('Student classes:', distinctClassesStudents);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

test();
