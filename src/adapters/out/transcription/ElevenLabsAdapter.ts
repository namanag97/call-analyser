// src/adapters/out/transcription/ElevenLabsAdapter.ts
// Import types only
import type { TranscriptionSegment } from '@/core/domain/entities/Recording';
import { InternalServerError } from '@/core/domain/errors/AppError';

export interface TranscriptionOptions {
  language: string;
  modelId: string;
  diarize: boolean;
}

export interface TranscriptionResult {
  success: boolean;
  data?: {
    text: string;
    segments: TranscriptionSegment[];
    processingTimeMs: number;
  };
  error?: string;
}

export interface IElevenLabsAdapter {
  transcribeAudio(
    audioStream: NodeJS.ReadableStream | Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult>;
}

// Mock adapter for development until we resolve the ElevenLabs SDK issues
export class MockElevenLabsAdapter implements IElevenLabsAdapter {
  async transcribeAudio(
    audioStream: NodeJS.ReadableStream | Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    console.log('Mock transcription service called with options:', options);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock data
    return {
      success: true,
      data: {
        text: "This is a mock transcription. The real service is not connected yet.",
        segments: [
          {
            speaker: "speaker_1",
            start_seconds: 0,
            end_seconds: 5,
            text: "This is a mock transcription."
          },
          {
            speaker: "speaker_2",
            start_seconds: 5,
            end_seconds: 10,
            text: "The real service is not connected yet."
          }
        ],
        processingTimeMs: 1000
      }
    };
  }
}

// Real implementation (commented out until we fix the SDK integration)
/*
export class RealElevenLabsAdapter implements IElevenLabsAdapter {
  private client: any;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not defined in environment variables');
    }
    
    // TODO: Fix initialization when we resolve the import issues
    // this.client = ...
  }

  async transcribeAudio(
    audioStream: NodeJS.ReadableStream | Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    
    try {
      // Convert Buffer to a format ElevenLabs can handle if necessary
      const audioData = audioStream instanceof Buffer 
        ? audioStream 
        : await this.streamToBuffer(audioStream);
      
      // TODO: Implement actual API call when SDK is fixed
      throw new Error('ElevenLabs integration not implemented');
      
    } catch (error) {
      console.error('ElevenLabs transcription error:', error);
      
      return {
        success: false,
        error: (error as Error).message || 'Unknown error during transcription',
      };
    }
  }
  
  // Helper method to convert a stream to a buffer
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
*/