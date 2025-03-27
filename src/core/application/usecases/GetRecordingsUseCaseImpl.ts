// src/core/application/usecases/GetRecordingsUseCaseImpl.ts
import { 
  GetRecordingsUseCase, 
  GetRecordingsQuery, 
  GetRecordingsResult 
} from '../../domain/ports/in/GetRecordingsUseCase';
import { Recording } from '../../domain/entities/Recording';
import { RecordingRepository } from '../../domain/ports/out/RecordingRepository';

export class GetRecordingsUseCaseImpl implements GetRecordingsUseCase {
  constructor(private recordingRepository: RecordingRepository) {}

  async getRecordings(query: GetRecordingsQuery): Promise<GetRecordingsResult> {
    return this.recordingRepository.findAll(query);
  }

  async getRecordingById(id: string): Promise<Recording | null> {
    return this.recordingRepository.findById(id);
  }
}
