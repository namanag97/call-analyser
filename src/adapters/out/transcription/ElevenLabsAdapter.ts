// src/adapters/out/transcription/ElevenLabsAdapter.ts
import type { TranscriptionSegment } from '@/core/domain/entities/Recording';
import { InternalServerError } from '@/core/domain/errors/AppError';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Readable } from 'stream';

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

export class RealElevenLabsAdapter implements IElevenLabsAdapter {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not defined in environment variables');
    }
    
    this.apiKey = apiKey;
  }

  async transcribeAudio(
    audioStream: NodeJS.ReadableStream | Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    
    try {
      // Convert audioStream to Buffer if it's a ReadableStream
      const audioData = audioStream instanceof Buffer 
        ? audioStream 
        : await this.streamToBuffer(audioStream);
      
      const formData = new FormData();
      
      // Convert Buffer to Readable stream for form-data
      const stream = new Readable();
      stream.push(audioData);
      stream.push(null);
      
      // Add file to form data
      formData.append('file', stream, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg'
      });
      
      // Add other parameters
      formData.append('model_id', options.modelId || 'scribe_v1');
      formData.append('language_code', options.language || 'en');
      formData.append('diarize', options.diarize.toString());
      formData.append('tag_audio_events', 'true');

      // Make API request
      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          ...formData.getHeaders()
        },
        body: formData as any
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
      }

      const result = await response.json() as any;
      
      // Process the segments
      const segments: TranscriptionSegment[] = result.segments?.map((segment: any) => ({
        speaker: segment.speaker || 'speaker_1',
        start_seconds: segment.start,
        end_seconds: segment.end,
        text: segment.text
      })) || [];
      
      const processingTimeMs = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          text: result.text || '',
          segments,
          processingTimeMs
        }
      };
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

// Keep the mock adapter for development/testing
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