# Call TK Developer Guide

This guide provides detailed instructions for developers who want to extend the Call TK platform with new features.

## Getting Started with Development

### Local Development Setup

1. Ensure you have the following installed:
   - Node.js 18+ and npm
   - PostgreSQL 13+
   - Git

2. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd call_tk
   npm install
   ```

3. Set up your environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Architecture

Call TK follows a Clean Architecture pattern with the following structure:

```
src/
├── adapters/            # External systems adapters
│   ├── in/              # Inbound adapters (controllers)
│   └── out/             # Outbound adapters (repositories)
├── app/                 # Next.js pages and API routes
├── components/          # React components
├── core/                # Core business logic
│   ├── application/     # Use cases
│   └── domain/          # Domain entities and interfaces
└── lib/                 # Utility functions and helpers
```

## Adding New Features

### 1. Creating New Transcription Visualizations

To add a new way to visualize transcription data:

1. Create a new component in `src/components/visualizations/`:

```typescript
// src/components/visualizations/SpeakerDistributionChart.tsx
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Transcription } from '@/core/domain/entities/Transcription';

interface SpeakerDistributionChartProps {
  transcription: Transcription;
}

export default function SpeakerDistributionChart({ transcription }: SpeakerDistributionChartProps) {
  // Calculate speaker distribution data
  // ...

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Speaker Distribution</h3>
      <Pie data={chartData} options={chartOptions} />
    </div>
  );
}
```

2. Add the component to the transcription details page:

```typescript
// src/app/recordings/[id]/page.tsx
import SpeakerDistributionChart from '@/components/visualizations/SpeakerDistributionChart';

// Inside your component
return (
  <div>
    {/* Existing code */}
    {transcription && <SpeakerDistributionChart transcription={transcription} />}
  </div>
);
```

### 2. Implementing Multi-Language Support

To add support for transcribing in multiple languages:

1. Update the `TranscriptionSettings` model:

```prisma
// prisma/schema.prisma
model TranscriptionSettings {
  // Existing fields
  supportedLanguages String[] @default(["en"])
}
```

2. Add a language selector component:

```typescript
// src/components/LanguageSelector.tsx
import React from 'react';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  // Add more languages as needed
];

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">Transcription Language</span>
      </label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="select select-bordered"
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

3. Integrate it into the upload form and update the transcription use case.

### 3. Adding Call Summary Generation

To add AI-powered call summaries:

1. Create a new domain entity:

```typescript
// src/core/domain/entities/CallSummary.ts
export interface CallSummary {
  id: string;
  transcriptionId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  createdAt: Date;
}
```

2. Update the Prisma schema:

```prisma
// prisma/schema.prisma
model CallSummary {
  id             String       @id @default(uuid())
  transcriptionId String       @unique
  transcription   Transcription @relation(fields: [transcriptionId], references: [id], onDelete: Cascade)
  summary        String       @db.Text
  keyPoints      String[]
  actionItems    String[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}
```

3. Create a summary generation service:

```typescript
// src/adapters/out/ai/OpenAISummaryService.ts
import { SummaryService } from '@/core/domain/ports/out/SummaryService';
import { CallSummary } from '@/core/domain/entities/CallSummary';
import OpenAI from 'openai';

export class OpenAISummaryService implements SummaryService {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async generateSummary(transcriptionText: string): Promise<CallSummary> {
    const prompt = `
      Summarize the following call transcript. Include:
      1. A brief summary (2-3 sentences)
      2. Key points discussed
      3. Action items

      Transcript:
      ${transcriptionText}
    `;
    
    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a professional call analyst." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });
    
    // Parse the response and extract summary, key points, and action items
    // ...
    
    return {
      id: '', // Will be set when saved to database
      transcriptionId: '', // Will be set when saved
      summary: "Parsed summary here",
      keyPoints: ["Key point 1", "Key point 2"],
      actionItems: ["Action item 1", "Action item 2"],
      createdAt: new Date()
    };
  }
}
```

4. Create a use case for generating summaries:

```typescript
// src/core/application/usecases/GenerateCallSummaryUseCaseImpl.ts
import { GenerateCallSummaryUseCase } from '@/core/domain/ports/in/GenerateCallSummaryUseCase';
import { SummaryService } from '@/core/domain/ports/out/SummaryService';
import { CallSummaryRepository } from '@/core/domain/ports/out/CallSummaryRepository';
import { TranscriptionRepository } from '@/core/domain/ports/out/TranscriptionRepository';

export class GenerateCallSummaryUseCaseImpl implements GenerateCallSummaryUseCase {
  constructor(
    private summaryService: SummaryService,
    private callSummaryRepository: CallSummaryRepository,
    private transcriptionRepository: TranscriptionRepository
  ) {}
  
  async execute(transcriptionId: string): Promise<string> {
    // Get the transcription
    const transcription = await this.transcriptionRepository.findById(transcriptionId);
    if (!transcription || !transcription.text) {
      throw new Error('Transcription not found or has no text');
    }
    
    // Generate summary
    const summary = await this.summaryService.generateSummary(transcription.text);
    
    // Save summary
    summary.transcriptionId = transcriptionId;
    await this.callSummaryRepository.save(summary);
    
    return summary.id;
  }
}
```

5. Add an API endpoint and UI components to display the summary.

### 4. Implementing Batch Processing for S3 Integration

To add S3 integration for batch processing recordings:

1. Create an S3 storage repository:

```typescript
// src/adapters/out/storage/S3FileStorageRepository.ts
import { FileStorageRepository } from '@/core/domain/ports/out/FileStorageRepository';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class S3FileStorageRepository implements FileStorageRepository {
  private s3Client: S3Client;
  private bucket: string;
  
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    this.bucket = process.env.AWS_S3_BUCKET || '';
  }
  
  async saveFile(file: Buffer, originalFilename: string): Promise<string> {
    const fileKey = `recordings/${uuidv4()}/${originalFilename}`;
    
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: file,
      ContentType: this.getContentType(originalFilename)
    }));
    
    return fileKey;
  }
  
  async getFileUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey
    });
    
    // Create a pre-signed URL that expires in 1 hour
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
  
  async downloadFile(fileKey: string, localPath: string): Promise<string> {
    // Implementation to download a file from S3 to local storage
    // ...
    
    return localPath;
  }
  
  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.mp3': return 'audio/mpeg';
      case '.wav': return 'audio/wav';
      case '.m4a': return 'audio/m4a';
      default: return 'application/octet-stream';
    }
  }
}
```

2. Create a batch processing use case:

```typescript
// src/core/application/usecases/BatchProcessS3RecordingsUseCaseImpl.ts
import { BatchProcessS3RecordingsUseCase } from '@/core/domain/ports/in/BatchProcessS3RecordingsUseCase';
import { RecordingRepository } from '@/core/domain/ports/out/RecordingRepository';
import { FileStorageRepository } from '@/core/domain/ports/out/FileStorageRepository';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export class BatchProcessS3RecordingsUseCaseImpl implements BatchProcessS3RecordingsUseCase {
  private s3Client: S3Client;
  private bucket: string;
  
  constructor(
    private recordingRepository: RecordingRepository,
    private fileStorageRepository: FileStorageRepository
  ) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    this.bucket = process.env.AWS_S3_BUCKET || '';
  }
  
  async execute(s3Prefix: string): Promise<number> {
    // List all objects in the S3 bucket with the given prefix
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: s3Prefix
    });
    
    const response = await this.s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return 0;
    }
    
    // Process each file
    let processedCount = 0;
    
    for (const item of response.Contents) {
      if (!item.Key) continue;
      
      // Check if file is an audio file
      if (!this.isAudioFile(item.Key)) continue;
      
      // Check if already processed
      const exists = await this.recordingRepository.findByS3Path(item.Key);
      if (exists) continue;
      
      // Create a new recording entry
      await this.recordingRepository.save({
        id: '',
        filename: this.getFilename(item.Key),
        filepath: item.Key,
        filesize: item.Size || 0,
        status: 'processing',
        source: 's3',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      processedCount++;
    }
    
    return processedCount;
  }
  
  private isAudioFile(key: string): boolean {
    const extensions = ['.mp3', '.wav', '.m4a', '.aac'];
    return extensions.some(ext => key.toLowerCase().endsWith(ext));
  }
  
  private getFilename(key: string): string {
    return key.split('/').pop() || '';
  }
}
```

3. Add an API endpoint and UI for batch processing.

### 5. Implementing User Authentication and Authorization

To add user authentication:

1. Update the Prisma schema to include users:

```prisma
// prisma/schema.prisma
model User {
  id            String      @id @default(uuid())
  email         String      @unique
  passwordHash  String
  name          String?
  role          String      @default("user") // user, admin
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

2. Add authentication middleware:

```typescript
// src/lib/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function authenticateUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = verify(token, process.env.JWT_SECRET || '') as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    return user;
  } catch (error) {
    return null;
  }
}

export function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const user = await authenticateUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return handler(req, user);
  };
}
```

3. Create login and registration endpoints.

4. Add authentication to existing API routes:

```typescript
// src/app/api/recordings/route.ts
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req, user) => {
  // Existing code, but now has access to the authenticated user
  return recordingController.getRecordings(req, user);
});
```

## Best Practices for Development

1. **Type Safety**: Always use proper TypeScript types for all new code.
2. **Error Handling**: Implement comprehensive error handling in all API routes.
3. **Dependency Injection**: Use the dependency injection pattern for all services.
4. **Testing**: Write unit tests for domain logic and integration tests for adapters.
5. **Documentation**: Document all new APIs and update this guide when adding features.

## Troubleshooting Common Development Issues

### Database Migration Issues

If you encounter issues with Prisma migrations:

```bash
# Reset the database (use with caution in production)
npx prisma migrate reset --force

# Generate the Prisma client after schema changes
npx prisma generate
```

### API Development Tips

- Use the Network tab in browser DevTools to debug API calls
- For complex API logic, add logging with `console.log` in development
- Test API endpoints with tools like Postman or the built-in API routes in Next.js

### Component Development

- Use React DevTools to inspect component props and state
- Create isolated test cases for complex components
- Follow the existing styling patterns with TailwindCSS 