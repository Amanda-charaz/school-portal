const mongoose = require('mongoose');
// Change this to YOUR connection string from your .env
const uri = "YOUR_MONGODB_URI_HERE"; 

async function fix() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    // This forces the change regardless of the current type
    await db.collection('users').updateOne(
        { email: "admin@test.com" }, 
        { $set: { role: "admin", role_id: "admin" } } 
    );
    
    console.log("✅ Admin role fixed!");
    process.exit();
}
fix();