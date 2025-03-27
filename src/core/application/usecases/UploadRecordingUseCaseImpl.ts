// src/core/application/usecases/UploadRecordingUseCaseImpl.ts
import { 
  UploadRecordingUseCase, 
  RecordingUploadDto 
} from '../../domain/ports/in/UploadRecordingUseCase';
import { Recording } from '../../domain/entities/Recording';
import { RecordingRepository } from '../../domain/ports/out/RecordingRepository';
import { FileStorageRepository } from '../../domain/ports/out/FileStorageRepository';

export class UploadRecordingUseCaseImpl implements UploadRecordingUseCase {
  constructor(
    private recordingRepository: RecordingRepository,
    private fileStorageRepository: FileStorageRepository
  ) {}

  async uploadRecording(dto: RecordingUploadDto): Promise<Recording> {
    let filepath: string;
    
    if (dto.source === 'upload' && dto.fileBuffer) {
      // Save the file to storage
      filepath = await this.fileStorageRepository.saveFile(dto.filename, dto.fileBuffer);
    } else if (dto.source === 's3' && dto.s3Key) {
      // For S3 source, we just store the S3 key
      filepath = dto.s3Key;
    } else {
      throw new Error('Invalid upload data');
    }

    // Create recording entry in database
    const recording = await this.recordingRepository.save({
      filename: dto.filename,
      filepath: filepath,
      filesize: dto.filesize,
      status: 'processing',
      source: dto.source,
      agent: 'Unassigned',
      callType: 'Unclassified',
    });

    // In a real application, you might trigger an async processing job here
    // to analyze the audio file and update the recording later

    return recording;
  }
}
