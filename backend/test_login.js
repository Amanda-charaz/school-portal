
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './src/models/User.js';

async function testLogin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');

    // Find all users and log their details
    console.log('\n=== All Users ===');
    const users = await User.find({});
    users.forEach(user => {
      console.log(`Email: ${user.email}, Role: ${user.role}, hashedPass: ${user.password ? 'YES' : 'NO'}`);
      if (user.raw_password_view) {
        console.log(`  Plain text password (raw_password_view): ${user.raw_password_view}`);
      }
    });

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testLogin();
