// src/core/application/usecases/UploadRecordingUseCaseImpl.ts
import { 
  UploadRecordingUseCase, 
  RecordingUploadDto 
} from '../../domain/ports/in/UploadRecordingUseCase';
import { Recording } from '../../domain/entities/Recording';
import { RecordingRepository } from '../../domain/ports/out/RecordingRepository';
import { FileStorageRepository } from '../../domain/ports/out/FileStorageRepository';
import { generateFileHash } from '@/lib/utils/fileHash';
import { DuplicateFileError } from '@/lib/utils/fileHash';
import { prisma } from '@/lib/prisma';

export class UploadRecordingUseCaseImpl implements UploadRecordingUseCase {
  constructor(
    private recordingRepository: RecordingRepository,
    private fileStorageRepository: FileStorageRepository
  ) {}

  async uploadRecording(dto: RecordingUploadDto): Promise<Recording> {
    let filepath: string;
    let contentHash: string | undefined;
    
    // Generate content hash for deduplication if file buffer exists
    if (dto.fileBuffer) {
      contentHash = generateFileHash(dto.fileBuffer);
      
      // Check for duplicate recordings with the same hash
      const existingRecording = await prisma.recording.findFirst({
        where: { contentHash }
      });
      
      if (existingRecording) {
        throw new DuplicateFileError(
          `A file with the same content already exists: ${existingRecording.filename}`,
          existingRecording
        );
      }
    }
    
    try {
      if (dto.source === 'upload' && dto.fileBuffer) {
        // Save the file to storage
        filepath = await this.fileStorageRepository.saveFile(dto.filename, dto.fileBuffer);
      } else if (dto.source === 's3' && dto.s3Key) {
        // For S3 source, we just store the S3 key
        filepath = dto.s3Key;
      } else {
        throw new Error('Invalid upload data');
      }

      // Create recording entry in database with content hash
      const recording = await this.recordingRepository.save({
        filename: dto.filename,
        filepath: filepath,
        filesize: dto.filesize,
        status: 'processing',
        source: dto.source,
        agent: dto.agent || 'Unassigned',
        callType: dto.callType || 'Unclassified',
        contentHash: contentHash
      });

      return recording;
    } catch (error) {
      // If this is a DuplicateFileError, just rethrow it
      if (error instanceof DuplicateFileError) {
        throw error;
      }
      
      // Log and rethrow other errors
      console.error('Error uploading recording:', error);
      throw new Error(`Failed to upload recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}