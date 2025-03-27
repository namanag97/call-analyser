// src/adapters/in/web/RecordingController.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  GetRecordingsUseCase,
  GetRecordingsQuery
} from '@/core/domain/ports/in/GetRecordingsUseCase';
import { 
  UploadRecordingUseCase, 
  RecordingUploadDto 
} from '@/core/domain/ports/in/UploadRecordingUseCase';

export class RecordingController {
  constructor(
    private getRecordingsUseCase: GetRecordingsUseCase,
    private uploadRecordingUseCase: UploadRecordingUseCase
  ) {}

  async getRecordings(req: NextRequest): Promise<NextResponse> {
    const searchParams = req.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build filter from query params
    const filter: any = {};
    const agent = searchParams.get('agent');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    
    if (agent) filter.agent = agent;
    if (date) filter.date = new Date(date);
    if (status) filter.status = status;
    if (source) filter.source = source;
    
    const query: GetRecordingsQuery = {
      page,
      limit,
      filter: Object.keys(filter).length > 0 ? filter : undefined
    };
    
    try {
      const result = await this.getRecordingsUseCase.getRecordings(query);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recordings' },
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
      const file = formData.get('file') as File;
      const source = formData.get('source') as string || 'upload';
      const s3Key = formData.get('s3Key') as string;
      
      if (!file && !s3Key) {
        return NextResponse.json(
          { error: 'No file or S3 key provided' },
          { status: 400 }
        );
      }
      
      const dto: RecordingUploadDto = {
        filename: file ? file.name : `s3-file-${Date.now()}.aac`,
        filesize: file ? file.size : 0,
        source: source as 'upload' | 's3',
      };
      
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        dto.fileBuffer = Buffer.from(arrayBuffer);
      } else if (s3Key) {
        dto.s3Key = s3Key;
      }
      
      const recording = await this.uploadRecordingUseCase.uploadRecording(dto);
      return NextResponse.json(recording);
    } catch (error) {
      console.error('Error uploading recording:', error);
      return NextResponse.json(
        { error: 'Failed to upload recording' },
        { status: 500 }
      );
    }
  }
}