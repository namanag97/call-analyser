/**
 * Tests for the recordings API endpoints
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/recordings/route';
import { prisma } from '@/lib/prisma';
import { RecordingController } from '@/core/controllers/RecordingController';

// Mock RecordingController
jest.mock('@/core/controllers/RecordingController');

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    recording: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('Recordings API', () => {
  // Define types for our mock controller
  interface MockRecordingController {
    getRecordings: jest.Mock;
    getRecording: jest.Mock;
    updateRecording: jest.Mock;
    deleteRecording: jest.Mock;
  }
  
  let mockController: MockRecordingController;

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock controller with typed methods
    mockController = {
      getRecordings: jest.fn(),
      getRecording: jest.fn(),
      updateRecording: jest.fn(),
      deleteRecording: jest.fn()
    };
    
    // Install the mock
    (RecordingController as jest.Mock).mockImplementation(() => mockController);
  });

  describe('GET /api/recordings', () => {
    it('should return all recordings', async () => {
      // Create date objects as strings to match JSON serialization
      const createdAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      // Mock data
      const mockRecordings = [
        {
          id: '1',
          filename: 'test.mp3',
          filepath: '/uploads/test.mp3',
          filesize: 1000,
          status: 'COMPLETED',
          source: 'upload',
          createdAt,
          updatedAt
        }
      ];

      // Mock the controller method
      mockController.getRecordings.mockResolvedValue(mockRecordings);

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/recordings');
      
      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('recordings');
      expect(responseData.recordings[0].id).toEqual(mockRecordings[0].id);
      expect(responseData.recordings[0].filename).toEqual(mockRecordings[0].filename);
      expect(mockController.getRecordings).toHaveBeenCalledTimes(1);
    });

    it('should handle controller errors gracefully', async () => {
      // Mock an error being thrown
      mockController.getRecordings.mockRejectedValue(new Error('Database error'));

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/recordings');
      
      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Failed to fetch recordings: Database error');
    });

    it('should handle empty recordings array gracefully', async () => {
      // Mock an empty array return
      mockController.getRecordings.mockResolvedValue([]);

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/recordings');
      
      // Call the handler
      const response = await GET(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('recordings');
      expect(responseData.recordings).toEqual([]);
      expect(responseData.count).toBe(0);
    });
  });
}); 