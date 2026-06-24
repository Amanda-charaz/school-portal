import mongoose from 'mongoose';
import { Retrier } from '@humanwhocodes/retry';

console.log("db.js: Loading connectToDatabase function...");
/**
 * Connects to MongoDB with an automatic retry strategy for transient network failures.
 * @param {string} uri - The MongoDB connection string from your .env file.
 */
export async function connectToDatabase(uri) {
  console.log("db.js: connectToDatabase called with URI:", uri ? "URI provided" : "NO URI!");
  // Define which specific database errors are worth retrying on
  const retrier = new Retrier(error => {
    console.warn('⚠️ Database connection failed. Retrying in a moment...', error.message);
    
    return (
      error.name === 'MongooseServerSelectionError' || 
      error.code === 'ETIMEDOUT' ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ECONNREFUSED')
    );
  }, { 
    timeout: 30000, // Keep trying for up to 30 seconds before giving up
    concurrency: 1 
  });

  try {
    console.log("db.js: About to attempt MongoDB connection...");
    // Attempt the connection using Mongoose inside the retrier wrapper
    await retrier.retry(() => {
      console.log("db.js: Trying mongoose.connect...");
      return mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
    });
    console.log('✅ MongoDB Connected Successfully to the Cloud Cluster!');
  } catch (err) {
    console.error('❌ CRITICAL: Could not establish a database connection after maximum retries:', err);
    process.exit(1); // Safely shut down the process since the DB is missing
  }
}