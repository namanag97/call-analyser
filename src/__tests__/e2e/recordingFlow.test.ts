// src/__tests__/e2e/recordingFlow.test.ts
import { PrismaClient } from '@prisma/client';
import { LocalFileStorageRepository } from '@/adapters/out/storage/LocalFileStorageRepository';
import { UploadRecordingUseCaseImpl } from '@/core/application/usecases/UploadRecordingUseCaseImpl';
import { PrismaRecordingRepository } from '@/adapters/out/persistence/PrismaRecordingRepository';
import { GetRecordingsUseCaseImpl } from '@/core/application/usecases/GetRecordingsUseCaseImpl';
import { RecordingSource, RecordingStatus } from '@/core/domain/entities/Recording';
import path from 'path';
import fs from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ size: 1000 }),
  },
  createReadStream: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
}));

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mockRecording = {
    id: 'test-id',
    filename: 'test.mp3',
    filepath: '/uploads/test.mp3',
    filesize: 1000,
    contentHash: 'hash123',
    duration: null,
    agent: 'Unassigned',
    callType: 'Unclassified',
    status: 'processing',
    source: 'upload',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      recording: {
        findMany: jest.fn().mockResolvedValue([mockRecording]),
        findUnique: jest.fn().mockResolvedValue(mockRecording),
        findFirst: jest.fn().mockResolvedValue(null), // No duplicates by default
        create: jest.fn().mockResolvedValue(mockRecording),
        update: jest.fn().mockImplementation((args) => {
          return Promise.resolve({
            ...mockRecording,
            ...args.data
          });
        }),
        count: jest.fn().mockResolvedValue(1)
      },
      $transaction: jest.fn().mockImplementation(async (fn) => {
        if (typeof fn === 'function') {
          return await fn();
        }
        return fn;
      })
    }))
  };
});

describe('Recording Flow E2E', () => {
  let prisma: PrismaClient;
  let fileStorageRepository: LocalFileStorageRepository;
  let recordingRepository: PrismaRecordingRepository;
  let uploadUseCase: UploadRecordingUseCaseImpl;
  let getRecordingsUseCase: GetRecordingsUseCaseImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    
    prisma = new PrismaClient();
    fileStorageRepository = new LocalFileStorageRepository('./public/uploads', 'http://localhost:3000');
    recordingRepository = new PrismaRecordingRepository();
    uploadUseCase = new UploadRecordingUseCaseImpl(recordingRepository, fileStorageRepository);
    getRecordingsUseCase = new GetRecordingsUseCaseImpl(recordingRepository);
  });

  it('should upload and retrieve a recording', async () => {
    // 1. Upload a recording
    const fileBuffer = Buffer.from('test audio data');
    const uploadDto = {
      filename: 'test-recording.mp3',
      filesize: fileBuffer.length,
      source: 'upload' as const,
      fileBuffer
    };

    const uploadedRecording = await uploadUseCase.uploadRecording(uploadDto);

    // Verify the recording was created in the database
    expect(prisma.recording.create).toHaveBeenCalled();
    expect(uploadedRecording.filename).toBe(uploadDto.filename);
    expect(uploadedRecording.status).toBe(RecordingStatus.UPLOADED);

    // 2. Retrieve the recording
    const recordingId = uploadedRecording.id;
    const retrievedRecording = await getRecordingsUseCase.getRecordingById(recordingId);

    // Verify the recording was retrieved
    expect(retrievedRecording).not.toBeNull();
    expect(retrievedRecording?.id).toBe(recordingId);

    // 3. Update the recording status (simulating transcription)
    const updatedRecording = await recordingRepository.update(recordingId, {
      status: RecordingStatus.COMPLETED
    });

    // Verify the status was updated
    expect(updatedRecording.status).toBe(RecordingStatus.COMPLETED);

    // 4. Retrieve all recordings
    const query = { page: 1, limit: 10 };
    const result = await getRecordingsUseCase.getRecordings(query);

    // Verify we can retrieve all recordings
    expect(result.recordings.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.currentPage).toBe(query.page);
  });

  it('should handle duplicate recordings', async () => {
    // Mock findFirst to simulate a duplicate file
    const mockDuplicate = {
      id: 'existing-id',
      filename: 'duplicate.mp3',
      filepath: '/uploads/duplicate.mp3',
      filesize: 1000,
      contentHash: 'duplicate-hash',
      status: 'COMPLETED',
      source: 'upload',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    (prisma.recording.findFirst as jest.Mock).mockResolvedValueOnce(mockDuplicate);

    // Try to upload a file with the same hash
    const fileBuffer = Buffer.from('duplicate content');
    const uploadDto = {
      filename: 'duplicate.mp3',
      filesize: fileBuffer.length,
      source: 'upload' as const,
      fileBuffer
    };

    // The upload should be rejected
    await expect(uploadUseCase.uploadRecording(uploadDto)).rejects.toThrow();
    
    // Verify create was not called (since it's a duplicate)
    expect(prisma.recording.create).not.toHaveBeenCalled();
  });

  it('should handle S3 imports', async () => {
    // Setup for S3 import
    const s3ImportDto = {
      filename: 's3-recording.mp3',
      filesize: 5000,
      source: 's3' as const,
      s3Key: 'path/to/s3-file.mp3'
    };

    const importedRecording = await uploadUseCase.uploadRecording(s3ImportDto);

    // Verify the S3 recording was created
    expect(prisma.recording.create).toHaveBeenCalled();
    expect(importedRecording.filename).toBe(s3ImportDto.filename);
    expect(importedRecording.source).toBe(RecordingSource.S3);
    expect(importedRecording.filepath).toBe(s3ImportDto.s3Key);

    // Filesystem operations shouldn't be called for S3 imports
    expect(fs.promises.mkdir).not.toHaveBeenCalled();
    expect(fs.promises.writeFile).not.toHaveBeenCalled();
  });

  it('should filter recordings by criteria', async () => {
    // Define a filter
    const filter = {
      agent: 'Test Agent',
      status: RecordingStatus.COMPLETED
    };

    // Mock the repository to return filtered results
    (prisma.recording.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'filtered-id',
        filename: 'filtered.mp3',
        filepath: '/uploads/filtered.mp3',
        filesize: 1000,
        agent: 'Test Agent',
        status: RecordingStatus.COMPLETED,
        source: 'upload',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Get filtered recordings
    const query = { 
      page: 1, 
      limit: 10,
      filter
    };
    
    const result = await getRecordingsUseCase.getRecordings(query);

    // Verify filter was passed to the repository
    expect(prisma.recording.findMany).toHaveBeenCalledTimes(1);
    expect(result.recordings.length).toBe(1);
    expect(result.recordings[0].agent).toBe(filter.agent);
    expect(result.recordings[0].status).toBe(filter.status);
  });
});