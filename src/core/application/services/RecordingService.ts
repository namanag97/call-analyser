import { Recording } from "../../domain/entities/Recording";
import { RecordingRepository } from "../../domain/ports/out/RecordingRepository";

export class RecordingService {
  constructor(private readonly recordingRepository: RecordingRepository) {}

  async getAllRecordings(): Promise<Recording[]> {
    return this.recordingRepository.findAll();
  }

  async getRecordingById(id: string): Promise<Recording | null> {
    return this.recordingRepository.findById(id);
  }

  async saveRecording(recording: Recording): Promise<Recording> {
    return this.recordingRepository.save(recording);
  }

  async updateRecording(recording: Recording): Promise<Recording> {
    return this.recordingRepository.update(recording);
  }

  async deleteRecording(id: string): Promise<void> {
    return this.recordingRepository.delete(id);
  }
} 