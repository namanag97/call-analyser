// src/core/domain/ports/in/GetRecordingsUseCase.ts
import { Recording } from "../../entities/Recording";

export interface GetRecordingsFilter {
  agent?: string;
  date?: Date;
  status?: string;
  source?: string;
}

export interface GetRecordingsQuery {
  page: number;
  limit: number;
  filter?: GetRecordingsFilter;
}

export interface GetRecordingsResult {
  recordings: Recording[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface GetRecordingsUseCase {
  getRecordings(query: GetRecordingsQuery): Promise<GetRecordingsResult>;
  getRecordingById(id: string): Promise<Recording | null>;
}
