// src/lib/queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Create Redis connection
const createRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: 3,
  });
  
  // Handle connection errors
  connection.on('error', (error) => {
    console.error('Redis connection error:', error);
  });
  
  connection.on('connect', () => {
    console.log('Connected to Redis successfully');
  });
  
  return connection;
};

// Create Redis connection
const connection = createRedisConnection();

// Create BullMQ queue for transcription jobs
export const transcriptionQueue = new Queue('transcription', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep successful jobs for 24 hours
      count: 100, // Keep the last 100 successful jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Handle clean-up on process exit
process.on('SIGTERM', async () => {
  await connection.quit();
});

process.on('SIGINT', async () => {
  await connection.quit();
});