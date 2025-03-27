# Call TK - Call Transcription and Analysis Platform

## Overview

Call TK is a web application designed to upload, transcribe, and analyze call recordings. The platform uses a modern architecture with Next.js for the frontend, Node.js for the backend, and PostgreSQL for database storage. It follows a clean architecture pattern with a domain-driven design approach.

## Architecture

The application is structured following a clean architecture pattern with distinct layers:

### Core
- **Domain**: Contains business entities and business rules
  - **Entities**: Core business objects like Recording and Transcription
  - **Ports**: Interfaces defining how the application interacts with external systems
  - **Validation**: Business rule validation

### Application
- **Use Cases**: Implementation of business logic and orchestration of domain objects

### Adapters
- **In (Web)**: Controllers handling HTTP requests
- **Out (Persistence)**: Database repositories
- **Out (Storage)**: File storage repositories

## Features

- Upload and manage call recordings
- Transcribe recordings using ElevenLabs API
- Filter and search recordings by agent, date, and other criteria
- Batch processing for large sets of recordings
- Error handling and recovery for transcription jobs
- Progress tracking for long-running operations

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Transcription**: ElevenLabs API integration
- **File Storage**: Local or cloud storage options

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running
- ElevenLabs API key (for transcription functionality)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/call_analyzer
   ELEVENLABS_API_KEY=your_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### Using Docker

The project includes Docker configuration for easy setup:

```bash
# Start services
docker-compose up -d

# Run migrations
npm run prisma:migrate
```

## Integration Guide

The application is designed to be extensible. Here's how to integrate new features:

### 1. Adding New Transcription Providers

To add a new transcription service (e.g., AWS Transcribe, Google Speech-to-Text):

1. Create a new file in `src/adapters/out/transcription/` implementing the `TranscriptionRepository` interface:

```typescript
// src/adapters/out/transcription/GoogleTranscriptionRepository.ts
import { TranscriptionRepository } from '@/core/domain/ports/out/TranscriptionRepository';

export class GoogleTranscriptionRepository implements TranscriptionRepository {
  async transcribe(filePath: string, options?: any): Promise<string> {
    // Implement Google Speech-to-Text integration
    // ...
  }
}
```

2. Register your new provider in the dependency container:

```typescript
// src/core/container.ts
container.register("TranscriptionRepository", {
  useClass: GoogleTranscriptionRepository
});
```

### 2. Extending the Recording Entity

To add new fields to the Recording entity:

1. Update the Prisma schema:

```prisma
// prisma/schema.prisma
model Recording {
  // Existing fields...
  
  // New fields
  customerName String?
  callScore    Int?
  tags         String[] 
}
```

2. Run Prisma migration:
```bash
npm run prisma:migrate
```

3. Update the Recording entity:

```typescript
// src/core/domain/entities/Recording.ts
export interface Recording {
  // Existing fields...
  
  // New fields
  customerName?: string;
  callScore?: number;
  tags?: string[];
}
```

4. Update the repository implementations to handle the new fields.

### 3. Creating New API Endpoints

To add a new API endpoint:

1. Create a new route file in `src/app/api/`:

```typescript
// src/app/api/analytics/route.ts
import { NextRequest } from 'next/server';
import { AnalyticsController } from '@/adapters/in/web/AnalyticsController';

const analyticsController = new AnalyticsController(/* inject dependencies */);

export async function GET(req: NextRequest) {
  return analyticsController.getAnalytics(req);
}
```

2. Implement the controller:

```typescript
// src/adapters/in/web/AnalyticsController.ts
import { NextRequest, NextResponse } from 'next/server';

export class AnalyticsController {
  constructor(private readonly analyticsUseCase: AnalyticsUseCase) {}

  async getAnalytics(req: NextRequest) {
    try {
      const result = await this.analyticsUseCase.execute();
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get analytics' },
        { status: 500 }
      );
    }
  }
}
```

3. Create the corresponding use case and any necessary domain entities.

### 4. Adding a Notification System

To implement a notification system for transcription completion:

1. Define a notification interface:

```typescript
// src/core/domain/ports/out/NotificationRepository.ts
export interface NotificationRepository {
  sendNotification(userId: string, message: string): Promise<void>;
}
```

2. Create implementations for different notification channels:

```typescript
// src/adapters/out/notification/EmailNotificationRepository.ts
export class EmailNotificationRepository implements NotificationRepository {
  async sendNotification(userId: string, message: string): Promise<void> {
    // Implement email sending logic
  }
}
```

3. Integrate in the relevant use case:

```typescript
// src/core/application/usecases/TranscribeRecordingUseCaseImpl.ts
export class TranscribeRecordingUseCaseImpl implements TranscribeRecordingUseCase {
  constructor(
    private recordingRepository: RecordingRepository,
    private transcriptionRepository: TranscriptionRepository,
    private notificationRepository: NotificationRepository
  ) {}

  async execute(recordingId: string): Promise<void> {
    // Transcription logic...
    
    // Send notification upon completion
    await this.notificationRepository.sendNotification(
      userInfo.id,
      `Transcription for recording ${recordingId} is complete.`
    );
  }
}
```

### 5. Implementing Call Analytics

To add call analytics features:

1. Create new entities for analytics:

```typescript
// src/core/domain/entities/CallAnalytics.ts
export interface CallAnalytics {
  recordingId: string;
  sentimentScore: number; // -1 to 1 range
  keywords: string[];
  topics: string[];
  actionItems: string[];
}
```

2. Create a repository interface:

```typescript
// src/core/domain/ports/out/AnalyticsRepository.ts
import { CallAnalytics } from '@/core/domain/entities/CallAnalytics';

export interface AnalyticsRepository {
  analyzeCall(transcriptionText: string): Promise<CallAnalytics>;
}
```

3. Implement the analytics service:

```typescript
// src/adapters/out/analytics/AIAnalyticsRepository.ts
export class AIAnalyticsRepository implements AnalyticsRepository {
  async analyzeCall(transcriptionText: string): Promise<CallAnalytics> {
    // Implement AI-based analytics logic
    // This could use a service like OpenAI, Claude, etc.
  }
}
```

4. Add the analysis step to the transcription workflow.

## Best Practices for Extensions

1. **Follow the Clean Architecture pattern**: Keep business logic in the domain layer, infrastructure concerns in adapters.
2. **Use dependency injection**: Define interfaces in the domain layer and implement them in adapters.
3. **Maintain separation of concerns**: Each component should have a single responsibility.
4. **Write tests**: Add unit tests for domain logic and integration tests for adapters.
5. **Use TypeScript**: Leverage type safety for all new code.
6. **Keep UI components reusable**: Create atomic design components in the components directory.
7. **Document new features**: Update this documentation when adding significant features.

## Troubleshooting

- **Database connection issues**: Verify your PostgreSQL connection string in `.env`
- **Transcription errors**: Check your ElevenLabs API key and quota
- **Upload issues**: Ensure your storage directory has proper permissions

## Performance Considerations

- Use batch processing for large sets of recordings
- Implement caching for frequently accessed data
- Consider background processing for transcription jobs
- Use pagination for large result sets

## Security Best Practices

- Store sensitive keys in environment variables
- Implement proper authentication and authorization
- Validate all user inputs
- Sanitize file uploads
- Use HTTPS in production 