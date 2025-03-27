# Call TK Technical Design Specification

## 1. Introduction

### 1.1 Purpose
This Technical Design Specification (TDS) document provides a detailed blueprint for the Call TK platform, a system designed to upload, transcribe, and analyze call recordings.

### 1.2 Scope
This document covers the technical architecture, data models, API specifications, and integration patterns for the Call TK system.

### 1.3 System Overview
Call TK is a web application built with Next.js that allows users to:
- Upload audio recordings of calls
- Transcribe calls using speech-to-text services
- Analyze call content for insights
- Filter and search recordings
- Process recordings in batches

## 2. Architecture

### 2.1 Architectural Pattern
The system follows a Clean Architecture pattern with Domain-Driven Design principles:

```
┌────────────────────────┐
│   Framework Layer      │
│   (Next.js, Prisma)    │
├────────────────────────┤
│   Adapter Layer        │
│   (Controllers, Repos) │
├────────────────────────┤
│   Application Layer    │
│   (Use Cases)          │
├────────────────────────┤
│   Domain Layer         │
│   (Entities, Rules)    │
└────────────────────────┘
```

### 2.2 Directory Structure
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

### 2.3 Key Components

#### 2.3.1 Frontend
- **Next.js App Router**: Page routing and API endpoints
- **React Components**: UI components with TailwindCSS
- **Client-side State Management**: React hooks and context

#### 2.3.2 Backend
- **API Routes**: RESTful endpoints for data operations
- **Use Cases**: Implementation of business logic
- **Repositories**: Data access and storage interfaces
- **Services**: External integrations (transcription, storage)

#### 2.3.3 Database
- **PostgreSQL**: Primary data store
- **Prisma ORM**: Database access layer

## 3. Data Model

### 3.1 Core Entities

#### 3.1.1 Recording
```prisma
model Recording {
  id          String        @id @default(uuid())
  filename    String
  filepath    String
  filesize    Int
  contentHash String?       @unique
  duration    String?
  agent       String?       @default("Unassigned")
  callType    String?       @default("Unclassified")
  status      String        @default("processing") 
  source      String        @default("upload")
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  transcription Transcription?
}
```

#### 3.1.2 Transcription
```prisma
model Transcription {
  id            String      @id @default(uuid())
  recordingId   String      @unique
  recording     Recording   @relation(fields: [recordingId], references: [id], onDelete: Cascade)
  status        String      @default("pending")
  text          String?     @db.Text
  language      String      @default("en")
  speakers      Int?
  processingTime Int?
  modelId       String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  error         String?     @db.Text
}
```

#### 3.1.3 TranscriptionSettings
```prisma
model TranscriptionSettings {
  id            String      @id @default(uuid())
  apiKey        String
  modelId       String      @default("scribe_v1")
  language      String      @default("en")
  active        Boolean     @default(true)
  batchSize     Int         @default(5)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

### 3.2 Relations
- Recording has one-to-one relation with Transcription

## 4. API Specifications

### 4.1 REST API Endpoints

#### 4.1.1 Recordings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recordings` | GET | List recordings with pagination and filters |
| `/api/recordings/{id}` | GET | Get single recording details |
| `/api/recordings` | POST | Upload new recording |
| `/api/recordings/{id}` | PATCH | Update recording metadata |
| `/api/recordings/{id}` | DELETE | Delete recording |
| `/api/recordings/{id}/transcribe` | POST | Request transcription |

#### 4.1.2 Transcriptions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transcriptions/{id}` | GET | Get transcription details |

### 4.2 Authentication
The API uses JWT-based authentication with token endpoints:
- `/api/auth/login`: Obtain authentication token
- `/api/auth/register`: Create new user account

### 4.3 Error Handling
Standardized error responses with HTTP status codes and error messages:
```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Recording with ID 123 not found",
    "status": 404
  }
}
```

## 5. Core Modules

### 5.1 Upload Module
**Purpose**: Handle file uploads and store recordings.

**Components**:
- `UploadRecordingUseCase`: Orchestrates file reception and storage
- `FileStorageRepository`: Interface for file storage operations
- `RecordingRepository`: Interface for recording metadata storage

**Flow**:
1. Client uploads file via multipart form
2. File is validated for format and size
3. File is stored in filesystem or cloud storage
4. Metadata is saved to database
5. Response with recording ID is returned

### 5.2 Transcription Module
**Purpose**: Convert audio to text and analyze speech.

**Components**:
- `TranscribeRecordingUseCase`: Manages transcription process
- `TranscriptionRepository`: Interface for transcription service
- `ElevenLabsTranscriptionService`: Implementation using ElevenLabs API

**Flow**:
1. Client requests transcription for a recording
2. System retrieves recording file
3. File is sent to transcription service
4. Results are stored in database
5. Status updates are provided during processing

### 5.3 Search/Filter Module
**Purpose**: Allow users to find and filter recordings.

**Components**:
- `GetRecordingsUseCase`: Handles search and filtering
- `RecordingRepository`: Interface for querying recordings

**Parameters**:
- Page number and size
- Agent name filter
- Date range filter
- Call type filter
- Status filter

## 6. External Integrations

### 6.1 ElevenLabs API
**Purpose**: Provide speech-to-text capabilities.

**Integration Points**:
- `ElevenLabsTranscriptionService` in adapters layer
- Configuration via environment variables and settings model

**Authentication**:
- API key stored in environment variables
- Rate limiting and quota management

### 6.2 Storage Systems
**Purpose**: Store audio files securely.

**Options**:
- `LocalFileStorageRepository`: Store files on local filesystem
- `S3FileStorageRepository`: Store files in AWS S3 (extensibility point)

**Configuration**:
- Storage paths and credentials in environment variables

## 7. Security Considerations

### 7.1 Authentication and Authorization
- JWT-based authentication
- Role-based access control
- Token expiration and refresh mechanism

### 7.2 Data Protection
- TLS for all API communications
- Environment variables for sensitive configuration
- Secure file handling with access controls
- Input validation to prevent injection attacks

### 7.3 Auditing
- Activity logs for all sensitive operations
- Timestamp tracking for all entity changes

## 8. Performance Considerations

### 8.1 Scalability
- Stateless API design for horizontal scaling
- Background processing for long-running operations
- Database connection pooling

### 8.2 Caching
- Recording metadata caching
- Transcription results caching
- File URL caching

### 8.3 Efficiency
- Pagination for large result sets
- Optimized database queries with proper indexes
- Batch processing for bulk operations

## 9. Deployment Architecture

### 9.1 Development Environment
- Local Next.js server
- PostgreSQL database
- Local file storage

### 9.2 Production Environment
- Containerized deployment with Docker
- PostgreSQL in managed service or containerized
- Cloud storage option for files
- Load balancer for API distribution

### 9.3 Configuration
- Environment variables for all configurable parameters
- Separate configurations for dev/staging/production

## 10. Extension Points

### 10.1 New Transcription Providers
Interface-based design allows adding new transcription services:
- AWS Transcribe
- Google Speech-to-Text
- Microsoft Azure Speech

### 10.2 Storage Providers
Storage interface allows different file storage options:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

### 10.3 Analytics Integration
Hook points for adding analytics capabilities:
- Sentiment analysis
- Call topic classification
- Action item extraction
- Performance metrics

## 11. Testing Strategy

### 11.1 Unit Testing
- Domain entities and business logic
- Use case implementations
- Repository adapters with mocks

### 11.2 Integration Testing
- API endpoints
- Database operations
- File storage operations

### 11.3 End-to-End Testing
- Complete user flows
- UI interaction testing

## 12. Migration and Versioning

### 12.1 Database Migrations
- Prisma migrations for schema changes
- Version control for migration scripts
- Rollback procedures

### 12.2 API Versioning
- URL-based versioning (/api/v1/...)
- Backward compatibility policy
- Deprecation notices and timeline

## 13. Monitoring and Logging

### 13.1 Logging Strategy
- Structured logging for all operations
- Error tracking with stack traces
- Performance metrics logging

### 13.2 Monitoring
- API endpoint response times
- Database query performance
- File upload/download throughput
- Transcription job completion rates

## 14. Technical Debt and Constraints

### 14.1 Current Limitations
- Synchronous transcription may cause timeouts
- Local file storage not suitable for high-scale production
- Limited error recovery for failed transcriptions

### 14.2 Future Improvements
- Implement background job processing
- Add cloud storage support
- Create robust error handling and recovery
- Add comprehensive monitoring 