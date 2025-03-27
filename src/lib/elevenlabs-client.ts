// src/lib/elevenlabs-client.ts
import { Readable } from 'stream';
import fetch from 'node-fetch';
import FormData from 'form-data';

interface TranscriptionOptions {
  audioData: Buffer;
  fileName: string;
  modelId: string;
  languageCode: string;
  diarize: boolean;
}

interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  speaker?: string;
}

interface TranscriptionResult {
  text: string;
  language: string;
  segments?: TranscriptionSegment[];
}

export class ElevenLabsClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  /**
   * Transcribes an audio file using ElevenLabs Speech-to-Text API
   */
  async transcribe(options: TranscriptionOptions): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      
      // Convert Buffer to Readable stream for form-data
      const stream = new Readable();
      stream.push(options.audioData);
      stream.push(null);
      
      // Add file to form data
      formData.append('file', stream, {
        filename: options.fileName,
        contentType: 'audio/mpeg'
      });
      
      // Add other parameters
      formData.append('model_id', options.modelId);
      formData.append('language_code', options.languageCode);
      formData.append('diarize', options.diarize.toString());
      formData.append('tag_audio_events', 'true');

      // Make API request
      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
      }

      const result = await response.json() as TranscriptionResult;
      return result;
    } catch (error) {
      console.error('Error in ElevenLabs transcription:', error);
      throw error;
    }
  }
}