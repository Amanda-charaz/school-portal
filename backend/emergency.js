const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. PASTE YOUR ACTUAL CONNECTION STRING HERE
const uri = "YOUR_MONGODB_ATLAS_CONNECTION_STRING"; 

async function resetAdmin() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to DB...");

    // Create a fresh hash for the password "admin123"
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash("admin123", salt);

    const db = mongoose.connection.db;
    const result = await db.collection('users').updateOne(
      { email: "admin@test.com" },
      { 
        $set: { 
          password: newHashedPassword,
          role: "admin", 
          role_id: "admin" // Ensuring both field names work
        } 
      }
    );

    if (result.matchedCount > 0) {
      console.log("✅ Admin Reset Successful!");
      console.log("Email: admin@test.com");
      console.log("Password: admin123");
    } else {
      console.log("❌ Could not find that email in the database.");
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetAdmin();