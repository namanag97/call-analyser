import { Recording } from "../../entities/Recording";
import { GetRecordingsQuery, GetRecordingsResult } from "../in/GetRecordingsUseCase";

export interface RecordingRepository {
  findAll(query: GetRecordingsQuery): Promise<GetRecordingsResult>;
  findById(id: string): Promise<Recording | null>;
  save(recording: Omit<Recording, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recording>;
  update(id: string, data: Partial<Recording>): Promise<Recording>;
  delete(id: string): Promise<void>;
}