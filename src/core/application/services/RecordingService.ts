import { Recording } from "../../domain/entities/Recording";
import { RecordingRepository } from "../../domain/ports/out/RecordingRepository";
import { GetRecordingsQuery } from "../../domain/ports/in/GetRecordingsUseCase";

export class RecordingService {
  constructor(private readonly recordingRepository: RecordingRepository) {}

  async getAllRecordings(query: GetRecordingsQuery = { page: 1, limit: 20 }): Promise<Recording[]> {
    const result = await this.recordingRepository.findAll(query);
    return result.recordings;
  }

  async getRecordingById(id: string): Promise<Recording | null> {
    return this.recordingRepository.findById(id);
  }

  async saveRecording(recording: Recording): Promise<Recording> {
    return this.recordingRepository.save(recording);
  }

  async updateRecording(id: string, data: Partial<Recording>): Promise<Recording> {
    return this.recordingRepository.update(id, data);
  }

  async deleteRecording(id: string): Promise<void> {
    return this.recordingRepository.delete(id);
  }
} 