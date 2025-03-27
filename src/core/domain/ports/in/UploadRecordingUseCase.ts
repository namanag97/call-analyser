import { Recording } from "../../entities/Recording";

export interface RecordingUploadDto {
  filename: string;
  filesize: number;
  source: 'upload' | 's3';
  fileBuffer?: Buffer;
  s3Key?: string;
}

export interface UploadRecordingUseCase {
  uploadRecording(dto: RecordingUploadDto): Promise<Recording>;
}
