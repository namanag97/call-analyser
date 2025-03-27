// src/adapters/queue/TranscriptionQueueAdapter.ts
import { transcriptionQueue } from '@/lib/queue';
import { Logger } from '@/core/domain/ports/out/Logger';
import { container } from '@/core/di';

export interface ITranscriptionQueueAdapter {
  addJob(jobName: string, data: any): Promise<string>;
}

export class BullMQAdapter implements ITranscriptionQueueAdapter {
  private logger: Logger;
  
  constructor() {
    this.logger = container.resolve('Logger');
  }
  
  async addJob(jobName: string, data: any): Promise<string> {
    try {
      this.logger.info(`Adding job to queue: ${jobName}`, { data });
      
      const job = await transcriptionQueue.add(jobName, data, {
        // Job-specific options can be set here
      });
      
      this.logger.info(`Job added to queue: ${job.id}`);
      
      return job.id;
    } catch (error) {
      this.logger.error('Failed to add job to queue', error as Error);
      throw new Error('Failed to queue job: ' + (error as Error).message);
    }
  }
}

// Export a singleton instance of the adapter
export const bullMQAdapter = new BullMQAdapter();