import { z } from 'zod';

export const RecordingSchema = z.object({
  id: z.string().uuid().optional(),
  filename: z.string().min(1),
  filepath: z.string().min(1),
  filesize: z.number().positive(),
  contentHash: z.string().min(1),
  duration: z.number().positive(),
  agent: z.string().min(1),
  callType: z.string().min(1),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  source: z.enum(['upload', 's3']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const TranscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  recordingId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  text: z.string().optional(),
  language: z.string().optional(),
  speakers: z.number().int().positive().optional(),
  processingTime: z.number().positive().optional(),
  modelId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  error: z.string().optional(),
});

export const TranscriptionSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  language: z.string().min(1),
  modelId: z.string().min(1),
  maxSpeakers: z.number().int().positive(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const TranscriptionWorkerSchema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(['idle', 'running', 'stopped', 'error']),
  lastProcessedAt: z.date().optional(),
  error: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Recording = z.infer<typeof RecordingSchema>;
export type Transcription = z.infer<typeof TranscriptionSchema>;
export type TranscriptionSettings = z.infer<typeof TranscriptionSettingsSchema>;
export type TranscriptionWorker = z.infer<typeof TranscriptionWorkerSchema>; 