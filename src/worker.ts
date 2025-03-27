// src/worker.ts
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { transcriptionQueue } from './lib/queue';
import { handleTranscriptionJob } from './core/application/jobs/TranscriptionJobHandler';

// Create the worker
const worker = new Worker(
  'transcription',
  async (job: Job) => {
    try {
      console.log(`Processing job ${job.id} of type ${job.name} with data:`, job.data);
      
      // Process the job based on the job name
      if (job.name === 'transcribeAudio') {
        return await handleTranscriptionJob(job.data);
      } else {
        throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error; // Re-throw to mark the job as failed
    }
  },
  {
    connection: transcriptionQueue.opts.connection,
    concurrency: 1, // Process one job at a time
  }
);

// Event listeners
worker.on('completed', (job: Job, result: any) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

worker.on('failed', (job: Job | undefined, error: Error) => {
  if (job) {
    console.error(`Job ${job.id} failed with error:`, error);
  } else {
    console.error('A job failed with error:', error);
  }
});

worker.on('error', (error: Error) => {
  console.error('Worker error:', error);
});

console.log('Worker started and listening for jobs...');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
});