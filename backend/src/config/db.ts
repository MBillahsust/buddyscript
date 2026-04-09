import mongoose, { ConnectOptions } from 'mongoose';
import { env } from './environment';
import { logger } from './logger';

const mongooseOptions: ConnectOptions = {
  maxPoolSize: 100,        // max concurrent connections — handles high traffic
  minPoolSize: 10,         // keep idle connections ready to avoid cold-start delay
  serverSelectionTimeoutMS: 5000,  // fail fast if no server reachable within 5s
  socketTimeoutMS: 60000,          // allow up to 60s for large uploads/queries
  maxIdleTimeMS: 300000,           // release idle connections after 5 min
  family: 4,               // force IPv4 — avoids IPv6 resolution issues
  retryWrites: true,       // auto-retry failed writes on transient network errors
};

const connectWithRetry = async (retries = 5, delay = 5000): Promise<void> => {
  try {
    await mongoose.connect(env.databaseUrl, mongooseOptions);
    const db = mongoose.connection;

    logger.info('✓ MongoDB connected successfully', {
      dbName: db.name,
      host: db.host,
    });

    db.on('disconnected', () => {
      logger.warn('MongoDB disconnected, attempting reconnect...');
      setTimeout(() => connectWithRetry(), 5000);
    });

    db.on('error', (error) => {
      logger.error('MongoDB connection error', { error });
    });
  } catch (error) {
    logger.error('✗ MongoDB connection failed', { error });
    if (retries > 0) {
      logger.info(`Retrying in ${delay / 1000}s... (${retries} retries left)`);
      await new Promise((res) => setTimeout(res, delay));
      return connectWithRetry(retries - 1, delay);
    }
    throw error;
  }
};

export const initializeDatabase = () => connectWithRetry();

export async function closeDatabase() {
  try {
    await mongoose.disconnect();
    logger.info('✓ MongoDB disconnected');
  } catch (error) {
    logger.error('✗ Failed to disconnect MongoDB', { error });
    throw error;
  }
}

export default mongoose;
