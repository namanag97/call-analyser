// src/__tests__/adapters/out/transcription/ElevenLabsAdapter.test.ts
import { RealElevenLabsAdapter, MockElevenLabsAdapter } from '@/adapters/out/transcription/ElevenLabsAdapter';
import { Readable } from 'stream';
import fetch from 'node-fetch';

// Mock node-fetch
jest.mock('node-fetch');

// Mock FormData
jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' })
  }));
});

// Mock environment variables
const originalEnv = process.env;

describe('ElevenLabsAdapter', () => {
  // Store the original env to restore later
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, ELEVENLABS_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('RealElevenLabsAdapter', () => {
    it('should throw an error if API key is not provided', () => {
      // Arrange
      delete process.env.ELEVENLABS_API_KEY;

      // Act & Assert
      expect(() => new RealElevenLabsAdapter()).toThrow('ELEVENLABS_API_KEY is not defined');
    });

    it('should transcribe audio successfully', async () => {
      // Arrange
      const adapter = new RealElevenLabsAdapter();
      const mockStream = new Readable();
      mockStream.push('test audio data');
      mockStream.push(null);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          text: 'This is a test transcription',
          segments: [
            {
              speaker: 'speaker_1',
              start: 0,
              end: 2.5,
              text: 'This is a'
            },
            {
              speaker: 'speaker_1',
              start: 2.5,
              end: 5.0,
              text: 'test transcription'
            }
          ]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.transcribeAudio(mockStream, {
        language: 'en',
        modelId: 'scribe_v1',
        diarize: true
      });

      // Assert
      expect(fetch).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.text).toBe('This is a test transcription');
      expect(result.data?.segments).toHaveLength(2);
      expect(result.data?.segments[0].speaker).toBe('speaker_1');
    });

    it('should handle API errors', async () => {
      // Arrange
      const adapter = new RealElevenLabsAdapter();
      const mockStream = new Readable();
      mockStream.push('test audio data');
      mockStream.push(null);

      const mockResponse = {
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized')
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.transcribeAudio(mockStream, {
        language: 'en',
        modelId: 'scribe_v1',
        diarize: true
      });

      // Assert
      expect(fetch).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('ElevenLabs API error (401)');
    });

    it('should handle network errors', async () => {
      // Arrange
      const adapter = new RealElevenLabsAdapter();
      const mockStream = new Readable();
      mockStream.push('test audio data');
      mockStream.push(null);

      const mockError = new Error('Network error');
      (fetch as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await adapter.transcribeAudio(mockStream, {
        language: 'en',
        modelId: 'scribe_v1',
        diarize: true
      });

      // Assert
      expect(fetch).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle buffer input', async () => {
      // Arrange
      const adapter = new RealElevenLabsAdapter();
      const buffer = Buffer.from('test audio data');

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          text: 'This is a test transcription',
          segments: []
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.transcribeAudio(buffer, {
        language: 'en',
        modelId: 'scribe_v1',
        diarize: true
      });

      // Assert
      expect(fetch).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('MockElevenLabsAdapter', () => {
    it('should return mock transcription data', async () => {
      // Arrange
      const adapter = new MockElevenLabsAdapter();
      const mockStream = new Readable();

      // Act
      const result = await adapter.transcribeAudio(mockStream, {
        language: 'en',
        modelId: 'scribe_v1',
        diarize: true
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.text).toContain('mock transcription');
      expect(result.data?.segments).toHaveLength(2);
      expect(result.data?.processingTimeMs).toBe(1000);
    });
  });
});