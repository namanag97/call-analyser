// src/core/domain/entities/Recording.ts
export enum RecordingStatus {
  UPLOADED = 'UPLOADED',
  PENDING_TRANSCRIPTION = 'PENDING_TRANSCRIPTION',
  TRANSCRIBING = 'TRANSCRIBING',
  COMPLETED = 'COMPLETED',
  FAILED_TRANSCRIPTION = 'FAILED_TRANSCRIPTION',
  DUPLICATE = 'DUPLICATE'
}

export enum RecordingSource {
  UPLOAD = 'UPLOAD',
  S3 = 'S3'
}

export interface Recording {
  id: string;
  filename: string;
  filepath: string;
  filesize: number;
  contentHash?: string;
  duration?: number; // Duration in seconds
  agent?: string;
  callType?: string;
  status: RecordingStatus;
  source: RecordingSource;
  createdAt: Date;
  updatedAt: Date;
}

export type TranscriptionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface TranscriptionSegment {
  speaker: string;
  start_seconds: number;
  end_seconds: number;
  text: string;
}

export interface Transcription {
  id: string;
  recordingId: string;
  status: TranscriptionStatus;
  text?: string;
  language: string;
  speakers?: number;
  segments?: TranscriptionSegment[];
  processingTimeMs?: number;
  modelId?: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}