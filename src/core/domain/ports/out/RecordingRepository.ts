export interface RecordingRepository {
  findAll(query: GetRecordingsQuery): Promise<GetRecordingsResult>;
  findById(id: string): Promise<Recording | null>;
  save(recording: Omit<Recording, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recording>;
  update(id: string, data: Partial<Recording>): Promise<Recording>;
}