// src/__tests__/api/recordings/route.test.ts
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/recordings/route';
import { RecordingController } from '@/core/controllers/RecordingController';

// Mock the RecordingController
jest.mock('@/core/controllers/RecordingController');

// Mock FormData used in the POST request
global.FormData = jest.fn().mockImplementation(() => ({
  getAll: jest.fn(),
  get: jest.fn(),
}));

// Mock File class
global.File = jest.fn().mockImplementation(() => ({
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  name: 'test.mp3',
  size: 1000,
  type: 'audio/mpeg',
}));

describe('Recordings API Routes', () => {
  // Mock recording data
  const mockRecordings = [
    {
      id: '1',
      filename: 'test.mp3',
      filepath: '/uploads/test.mp3',
      filesize: 1000,
      status: 'COMPLETED',
      source: 'upload',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations for RecordingController
    (RecordingController as jest.Mock).mockImplementation(() => ({
      getRecordings: jest.fn().mockResolvedValue(mockRecordings),
      uploadRecording: jest.fn().mockResolvedValue(mockRecordings[0])
    }));
  });

  describe('GET /api/recordings', () => {
    it('should return recordings', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/recordings');
      
      // Act
      const response = await GET(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('recordings');
      expect(data.recordings).toEqual(mockRecordings);
      expect(data.count).toBe(mockRecordings.length);
      
      // Verify controller method was called
      const controller = (RecordingController as jest.Mock).mock.instances[0];
      expect(controller.getRecordings).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch recordings';
      (RecordingController as jest.Mock).mockImplementation(() => ({
        getRecordings: jest.fn().mockRejectedValue(new Error(errorMessage))
      }));
      
      const request = new NextRequest('http://localhost:3000/api/recordings');
      
      // Act
      const response = await GET(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain(errorMessage);
      expect(data).toHaveProperty('recordings');
      expect(data.recordings).toEqual([]);
    });
  });

  describe('POST /api/recordings', () => {
    it('should upload a file', async () => {
      // Arrange
      const mockFile = new File([], 'test.mp3');
      const mockFormData = new FormData();
      
      // Mock FormData methods
      mockFormData.getAll = jest.fn().mockReturnValue([mockFile]);
      mockFormData.get = jest.fn().mockReturnValue('upload');
      
      // Create a request with FormData
      const request = new NextRequest('http://localhost:3000/api/recordings', {
        method: 'POST',
        body: mockFormData
      });
      
      // Mock the request.formData() method
      request.formData = jest.fn().mockResolvedValue(mockFormData);
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify controller method was called with correct data
      const controller = (RecordingController as jest.Mock).mock.instances[0];
      expect(controller.uploadRecording).toHaveBeenCalledWith(request);
    });

    it('should handle S3 import', async () => {
      // Arrange
      const mockFormData = new FormData();
      
      // Mock FormData methods for S3 import
      mockFormData.getAll = jest.fn().mockReturnValue(null);
      mockFormData.get = jest.fn().mockImplementation((key) => {
        if (key === 'source') return 's3';
        if (key === 's3Key') return 'path/to/s3/file.mp3';
        return null;
      });
      
      // Create a request with FormData
      const request = new NextRequest('http://localhost:3000/api/recordings', {
        method: 'POST',
        body: mockFormData
      });
      
      // Mock the request.formData() method
      request.formData = jest.fn().mockResolvedValue(mockFormData);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify controller method was called
      const controller = (RecordingController as jest.Mock).mock.instances[0];
      expect(controller.uploadRecording).toHaveBeenCalledWith(request);
    });
  });
});