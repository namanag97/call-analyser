// src/__tests__/core/application/services/RecordingService.test.ts
import { RecordingService } from '@/core/application/services/RecordingService';
import { GetRecordingsQuery } from '@/core/domain/ports/in/GetRecordingsUseCase';
import { Recording, RecordingSource, RecordingStatus } from '@/core/domain/entities/Recording';

// Mock implementation of RecordingRepository
const mockRecordingRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('RecordingService', () => {
  let recordingService: RecordingService;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    recordingService = new RecordingService(mockRecordingRepository);
  });
  
  describe('getAllRecordings', () => {
    it('should return recordings from repository', async () => {
      // Arrange
      const mockRecordings = [
        {
          id: '1',
          filename: 'test.mp3',
          filepath: '/uploads/test.mp3',
          filesize: 1000,
          status: RecordingStatus.COMPLETED,
          source: RecordingSource.UPLOAD,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ] as Recording[];
      
      const mockResult = {
        recordings: mockRecordings,
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      };
      
      mockRecordingRepository.findAll.mockResolvedValue(mockResult);
      
      // Act
      const result = await recordingService.getAllRecordings();
      
      // Assert
      expect(mockRecordingRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result).toEqual(mockRecordings);
    });
    
    it('should pass query parameters to repository', async () => {
      // Arrange
      const query: GetRecordingsQuery = {
        page: 2,
        limit: 10,
        filter: {
          agent: 'test-agent'
        }
      };
      
      const mockResult = {
        recordings: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 2
      };
      
      mockRecordingRepository.findAll.mockResolvedValue(mockResult);
      
      // Act
      await recordingService.getAllRecordings(query);
      
      // Assert
      expect(mockRecordingRepository.findAll).toHaveBeenCalledWith(query);
    });
  });
  
  describe('getRecordingById', () => {
    it('should return a recording by ID', async () => {
      // Arrange
      const recordingId = '1';
      const mockRecording = {
        id: recordingId,
        filename: 'test.mp3',
        filepath: '/uploads/test.mp3',
        filesize: 1000,
        status: RecordingStatus.COMPLETED,
        source: RecordingSource.UPLOAD,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Recording;
      
      mockRecordingRepository.findById.mockResolvedValue(mockRecording);
      
      // Act
      const result = await recordingService.getRecordingById(recordingId);
      
      // Assert
      expect(mockRecordingRepository.findById).toHaveBeenCalledWith(recordingId);
      expect(result).toEqual(mockRecording);
    });
    
    it('should return null if recording not found', async () => {
      // Arrange
      const recordingId = 'non-existent';
      mockRecordingRepository.findById.mockResolvedValue(null);
      
      // Act
      const result = await recordingService.getRecordingById(recordingId);
      
      // Assert
      expect(mockRecordingRepository.findById).toHaveBeenCalledWith(recordingId);
      expect(result).toBeNull();
    });
  });
  
  describe('saveRecording', () => {
    it('should save a recording', async () => {
      // Arrange
      const newRecording = {
        filename: 'new.mp3',
        filepath: '/uploads/new.mp3',
        filesize: 2000,
        status: RecordingStatus.UPLOADED,
        source: RecordingSource.UPLOAD,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Recording;
      
      const savedRecording = {
        ...newRecording,
        id: 'new-id'
      } as Recording;
      
      mockRecordingRepository.save.mockResolvedValue(savedRecording);
      
      // Act
      const result = await recordingService.saveRecording(newRecording);
      
      // Assert
      expect(mockRecordingRepository.save).toHaveBeenCalledWith(newRecording);
      expect(result).toEqual(savedRecording);
    });
  });
  
  describe('updateRecording', () => {
    it('should update a recording', async () => {
      // Arrange
      const recordingId = '1';
      const updateData = {
        status: RecordingStatus.COMPLETED
      };
      
      const updatedRecording = {
        id: recordingId,
        filename: 'test.mp3',
        filepath: '/uploads/test.mp3',
        filesize: 1000,
        status: RecordingStatus.COMPLETED,
        source: RecordingSource.UPLOAD,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Recording;
      
      mockRecordingRepository.update.mockResolvedValue(updatedRecording);
      
      // Act
      const result = await recordingService.updateRecording(recordingId, updateData);
      
      // Assert
      expect(mockRecordingRepository.update).toHaveBeenCalledWith(recordingId, updateData);
      expect(result).toEqual(updatedRecording);
    });
  });
  
  describe('deleteRecording', () => {
    it('should delete a recording', async () => {
      // Arrange
      const recordingId = '1';
      
      // Act
      await recordingService.deleteRecording(recordingId);
      
      // Assert
      expect(mockRecordingRepository.delete).toHaveBeenCalledWith(recordingId);
    });
  });
});