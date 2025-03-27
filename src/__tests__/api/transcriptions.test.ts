/**
 * Tests for the transcriptions API endpoints
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/transcriptions/route';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/core/domain/errors/AppError';

// Mock the AppError imports
jest.mock('@/core/domain/errors/AppError', () => ({
  ValidationError: class ValidationError extends Error {
    statusCode = 400;
    constructor(message: string) { super(message); this.name = 'ValidationError'; }
  },
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
    constructor(message: string) { super(message); this.name = 'NotFoundError'; }
  }
}));

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transcription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn()
    },
    recording: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

// Mock the transcribeAudio function
jest.mock('@/lib/transcription', () => ({
  transcribeAudio: jest.fn().mockImplementation(() => Promise.resolve())
}));

describe('Transcriptions API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transcriptions', () => {
    it('should return all transcriptions', async () => {
      // Create date objects as strings to match JSON serialization
      const createdAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      // Mock data
      const mockTranscriptions = [
        {
          id: '1',
          recordingId: 'rec1',
          status: 'completed',
          text: 'Test transcription',
          language: 'en',
          createdAt,
          updatedAt,
          recording: {
            id: 'rec1',
            filename: 'test.mp3',
            filepath: '/uploads/test.mp3',
            filesize: 1000,
            status: 'COMPLETED',
            source: 'upload',
            createdAt,
            updatedAt
          }
        }
      ];

      // Mock the Prisma findMany method
      (prisma.transcription.findMany as jest.Mock).mockResolvedValue(mockTranscriptions);

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/transcriptions');
      
      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('transcriptions');
      expect(responseData.transcriptions[0].id).toEqual(mockTranscriptions[0].id);
      expect(responseData.transcriptions[0].text).toEqual(mockTranscriptions[0].text);
      expect(prisma.transcription.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle empty transcriptions array', async () => {
      // Mock an empty array return
      (prisma.transcription.findMany as jest.Mock).mockResolvedValue([]);

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/transcriptions');
      
      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('transcriptions');
      expect(responseData.transcriptions).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      // Mock an error being thrown
      (prisma.transcription.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/transcriptions');
      
      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('transcriptions');
      expect(responseData.transcriptions).toEqual([]);
    });

    it('should get a specific transcription by recordingId', async () => {
      // Create date objects as strings to match JSON serialization
      const createdAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      // Mock data
      const mockTranscription = {
        id: '1',
        recordingId: 'rec1',
        status: 'completed',
        text: 'Test transcription',
        language: 'en',
        createdAt,
        updatedAt
      };

      // Mock the Prisma findUnique method
      (prisma.transcription.findUnique as jest.Mock).mockResolvedValue(mockTranscription);

      // Create a mock request with recordingId
      const url = new URL('http://localhost:3000/api/transcriptions');
      url.searchParams.append('recordingId', 'rec1');
      const request = new NextRequest(url);
      
      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.id).toEqual(mockTranscription.id);
      expect(responseData.text).toEqual(mockTranscription.text);
      expect(prisma.transcription.findUnique).toHaveBeenCalledWith({
        where: { recordingId: 'rec1' }
      });
    });

    it('should return 404 for non-existent recordingId', async () => {
      // Mock no transcription found
      (prisma.transcription.findUnique as jest.Mock).mockResolvedValue(null);

      // Create a mock request with recordingId
      const url = new URL('http://localhost:3000/api/transcriptions');
      url.searchParams.append('recordingId', 'nonexistent');
      const request = new NextRequest(url);
      
      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Transcription not found');
    });
  });

  describe('POST /api/transcriptions', () => {
    it('should create a new transcription', async () => {
      // Create date objects as strings to match JSON serialization
      const createdAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      // Mock data
      const mockRecording = {
        id: 'rec1',
        filename: 'test.mp3',
        filepath: '/uploads/test.mp3',
        filesize: 1000,
        status: 'COMPLETED',
        source: 'upload',
        createdAt,
        updatedAt
      };

      const mockTranscription = {
        id: '1',
        recordingId: 'rec1',
        status: 'pending',
        language: 'en',
        createdAt,
        updatedAt
      };

      // Mock Prisma responses
      (prisma.recording.findUnique as jest.Mock).mockResolvedValue(mockRecording);
      (prisma.transcription.upsert as jest.Mock).mockResolvedValue(mockTranscription);
      (prisma.recording.update as jest.Mock).mockResolvedValue({
        ...mockRecording,
        status: 'PENDING_TRANSCRIPTION'
      });

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/transcriptions', {
        method: 'POST',
        body: JSON.stringify({
          recordingId: 'rec1',
          language: 'en',
          modelId: 'scribe_v1'
        })
      });
      
      // Call the handler
      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('success');
      expect(responseData).toHaveProperty('transcription');
      expect(responseData.success).toBe(true);
      expect(responseData.transcription.id).toEqual(mockTranscription.id);
      expect(responseData.transcription.status).toEqual(mockTranscription.status);
      
      // Check that Prisma methods were called correctly
      expect(prisma.recording.findUnique).toHaveBeenCalledWith({
        where: { id: 'rec1' }
      });
      
      expect(prisma.transcription.upsert).toHaveBeenCalledWith({
        where: { recordingId: 'rec1' },
        update: { status: 'pending', error: null },
        create: { recordingId: 'rec1', status: 'pending', language: 'en' }
      });
      
      expect(prisma.recording.update).toHaveBeenCalledWith({
        where: { id: 'rec1' },
        data: { status: 'PENDING_TRANSCRIPTION' }
      });
    });

    it('should return 400 if recordingId is missing', async () => {
      // Set up the validation error to be thrown
      (prisma.recording.findUnique as jest.Mock).mockImplementation(() => {
        throw new ValidationError('Recording ID is required');
      });

      // Create a mock request with missing recordingId
      const request = new NextRequest('http://localhost:3000/api/transcriptions', {
        method: 'POST',
        body: JSON.stringify({
          language: 'en'
        })
      });
      
      // Call the handler
      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Recording ID is required');
    });

    it('should return 404 if recording is not found', async () => {
      // Set up the not found error to be thrown
      (prisma.recording.findUnique as jest.Mock).mockImplementation(() => {
        throw new NotFoundError('Recording with ID nonexistent not found');
      });

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/transcriptions', {
        method: 'POST',
        body: JSON.stringify({
          recordingId: 'nonexistent',
          language: 'en'
        })
      });
      
      // Call the handler
      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Recording with ID nonexistent not found');
    });
  });
}); 