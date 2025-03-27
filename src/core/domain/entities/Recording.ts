// src/core/domain/entities/Recording.ts
export interface Recording {
    id: string;
    filename: string;
    filepath: string;
    filesize: number;
    duration?: string;
    agent?: string;
    callType?: string;
    status: 'processing' | 'completed' | 'error';
    source: 'upload' | 's3';
    createdAt: Date;
    updatedAt: Date;
  }
  