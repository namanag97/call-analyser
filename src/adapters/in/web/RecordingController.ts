// src/adapters/in/web/RecordingController.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  GetRecordingsUseCase,
  GetRecordingsQuery,
  GetRecordingsFilter
} from '@/core/domain/ports/in/GetRecordingsUseCase';
import { 
  UploadRecordingUseCase, 
  RecordingUploadDto 
} from '@/core/domain/ports/in/UploadRecordingUseCase';
import { Recording, RecordingStatus, RecordingSource } from '@/core/domain/entities/Recording';

interface UploadResult {
  success: boolean;
  filename: string;
  error?: string;
  recording?: Recording;
}

export class RecordingController {
  constructor(
    private getRecordingsUseCase: GetRecordingsUseCase,
    private uploadRecordingUseCase: UploadRecordingUseCase
  ) {}

  async getRecordings(req: NextRequest): Promise<NextResponse> {
    try {
      const searchParams = req.nextUrl.searchParams;
      
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      
      // Build filter from query params
      const filter: GetRecordingsFilter = {};
      
      const agent = searchParams.get('agent');
      const date = searchParams.get('date');
      const status = searchParams.get('status');
      const source = searchParams.get('source');
      
      if (agent) filter.agent = agent;
      if (date) filter.date = new Date(date);
      
      // Handle enum values for status and source
      if (status && Object.values(RecordingStatus).includes(status as RecordingStatus)) {
        filter.status = status as RecordingStatus;
      }
      
      if (source && Object.values(RecordingSource).includes(source as RecordingSource)) {
        filter.source = source as RecordingSource;
      }
      
      const query: GetRecordingsQuery = {
        page,
        limit,
        filter: Object.keys(filter).length > 0 ? filter : undefined
      };
      
      try {
        const result = await this.getRecordingsUseCase.getRecordings(query);
        
        // Ensure we have recordings array, even if empty
        const recordings = result.recordings || [];
        
        // Log diagnostic information
        console.log(`Found ${recordings.length} recordings with transcription data:`);
        recordings.forEach(recording => {
          console.log(`Recording ID: ${recording.id}, Has transcription: ${!!recording.transcription}, Status: ${recording.status}`);
        });
        
        return NextResponse.json({
          recordings,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          currentPage: result.currentPage
        });
      } catch (error) {
        console.error('Error fetching recordings:', error);
        return NextResponse.json(
          { error: 'Failed to fetch recordings', recordings: [] },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Unexpected error in getRecordings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recordings', recordings: [] },
        { status: 500 }
      );
    }
  }

  async getRecordingById(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const recording = await this.getRecordingsUseCase.getRecordingById(id);
      
      if (!recording) {
        return NextResponse.json(
          { error: 'Recording not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(recording);
    } catch (error) {
      console.error('Error fetching recording:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recording' },
        { status: 500 }
      );
    }
  }

  async uploadRecording(req: NextRequest): Promise<NextResponse> {
    try {
      const formData = await req.formData();
      const files = formData.getAll('file') as File[] | null;
      const source = formData.get('source') as string || 'upload';
      const s3Key = formData.get('s3Key') as string;
      
      // Handle S3 import
      if (s3Key) {
        const dto: RecordingUploadDto = {
          filename: `s3-file-${Date.now()}.aac`,
          filesize: 0,
          source: 's3',
          s3Key: s3Key
        };
        
        const recording = await this.uploadRecordingUseCase.uploadRecording(dto);
        return NextResponse.json(recording);
      }
      
      // Handle file upload(s)
      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      // Process a single file
      if (files.length === 1) {
        const file = files[0];
        const dto: RecordingUploadDto = {
          filename: file.name,
          filesize: file.size,
          source: source as 'upload' | 's3',
        };
        
        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        dto.fileBuffer = Buffer.from(bytes);
        
        const recording = await this.uploadRecordingUseCase.uploadRecording(dto);
        return NextResponse.json(recording);
      }
      
      // Process multiple files in parallel (batch upload)
      const uploadPromises = files.map(async (file) => {
        try {
          const dto: RecordingUploadDto = {
            filename: file.name,
            filesize: file.size,
            source: source as 'upload' | 's3',
          };
          
          // Convert File to Buffer
          const bytes = await file.arrayBuffer();
          dto.fileBuffer = Buffer.from(bytes);
          
          const recording = await this.uploadRecordingUseCase.uploadRecording(dto);
          return {
            success: true,
            filename: file.name,
            recording
          } as UploadResult;
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          return {
            success: false,
            filename: file.name,
            error: `Failed to upload ${file.name}`
          } as UploadResult;
        }
      });
      
      const results = await Promise.all(uploadPromises);
      return NextResponse.json({
        totalFiles: files.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        results
      });
      
    } catch (error) {
      console.error('Error uploading recording:', error);
      return NextResponse.json(
        { error: 'Failed to upload recording' },
        { status: 500 }
      );
    }
  }
}