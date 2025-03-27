// src/core/domain/validation/validation.ts
import { z } from 'zod';

export const RecordingStatusEnum = z.enum([
  'UPLOADED',
  'PENDING_TRANSCRIPTION',
  'TRANSCRIBING',
  'COMPLETED',
  'FAILED_TRANSCRIPTION',
  'DUPLICATE',
]);

export const RecordingSourceEnum = z.enum([
  'UPLOAD',
  'S3',
]);

export const TranscriptionStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
]);

export const RecordingSchema = z.object({
  id: z.string().uuid().optional(),
  filename: z.string().min(1),
  filepath: z.string().min(1),
  filesize: z.number().positive(),
  contentHash: z.string().optional(),
  duration: z.number().int().optional(), // Duration in seconds
  agent: z.string().optional(),
  callType: z.string().optional(),
  status: RecordingStatusEnum,
  source: RecordingSourceEnum,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const TranscriptionSegmentSchema = z.object({
  speaker: z.string(),
  start_seconds: z.number(),
  end_seconds: z.number(),
  text: z.string(),
});

export const TranscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  recordingId: z.string().uuid(),
  status: TranscriptionStatusEnum,
  text: z.string().optional(),
  language: z.string().optional(),
  speakers: z.number().int().positive().optional(),
  segments: z.array(TranscriptionSegmentSchema).optional(),
  processingTimeMs: z.number().positive().optional(),
  modelId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  error: z.string().optional(),
});

export type Recording = z.infer<typeof RecordingSchema>;
export type TranscriptionSegment = z.infer<typeof TranscriptionSegmentSchema>;
export type Transcription = z.infer<typeof TranscriptionSchema>;