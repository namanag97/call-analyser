// src/app/api/recordings/route.ts
import { NextRequest } from 'next/server';
import { RecordingController } from '@/adapters/in/web/RecordingController';
import { GetRecordingsUseCaseImpl } from '@/core/application/usecases/GetRecordingsUseCaseImpl';
import { UploadRecordingUseCaseImpl } from '@/core/application/usecases/UploadRecordingUseCaseImpl';
import { PrismaRecordingRepository } from '@/adapters/out/persistence/PrismaRecordingRepository';
import { LocalFileStorageRepository } from '@/adapters/out/storage/LocalFileStorageRepository';
import path from 'path';

// Initialize dependencies
const recordingRepository = new PrismaRecordingRepository();
const fileStorageRepository = new LocalFileStorageRepository(
  path.join(process.cwd(), 'public', 'uploads'),
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
);

// Initialize use cases
const getRecordingsUseCase = new GetRecordingsUseCaseImpl(recordingRepository);
const uploadRecordingUseCase = new UploadRecordingUseCaseImpl(
  recordingRepository,
  fileStorageRepository
);

// Initialize controller
const recordingController = new RecordingController(
  getRecordingsUseCase,
  uploadRecordingUseCase
);

export async function GET(req: NextRequest) {
  return recordingController.getRecordings(req);
}

export async function POST(req: NextRequest) {
  return recordingController.uploadRecording(req);
}