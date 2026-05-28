import mongoose from 'mongoose';
import { Retrier } from '@humanwhocodes/retry';

/**
 * Connects to MongoDB with a retry strategy for transient network failures.
 * @param {string} uri - The MongoDB connection string.
 */
export async function connectToDatabase(uri) {
    const retrier = new Retrier(error => {
        // Retry on common transient errors or if the initial connection fails
        console.warn('Database connection failed, retrying...', error.message);
        return error.name === 'MongooseServerSelectionError' || error.code === 'ETIMEDOUT';
    }, { 
        timeout: 30_000, // Try for 30 seconds
        concurrency: 1 
    });

    try {
        await retrier.retry(() => mongoose.connect(uri));
        console.log('Successfully connected to the database.');
    } catch (err) {
        console.error('Could not establish database connection after retries:', err);
        process.exit(1);
    }
}