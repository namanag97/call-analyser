# Call TK API Integration Guide

This document provides detailed information about integrating with the Call TK API to extend functionality or connect with external systems.

## API Overview

Call TK exposes RESTful API endpoints for managing recordings, transcriptions, and analytics. All API routes are located under `/api/*` and follow REST conventions.

## Authentication

### Obtaining Authentication Tokens

To authenticate with the API, you need to obtain a JWT token:

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Using Authentication

Include the JWT token in all API requests:

```
GET /api/recordings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Core API Endpoints

### Recordings API

#### List Recordings

```
GET /api/recordings
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `agent`: Filter by agent name
- `date`: Filter by date (YYYY-MM-DD)

Response:
```json
{
  "recordings": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "filename": "call_20220101.mp3",
      "filepath": "/uploads/call_20220101.mp3",
      "filesize": 2048000,
      "duration": "00:15:30",
      "agent": "John Smith",
      "callType": "Customer Support",
      "status": "completed",
      "source": "upload",
      "createdAt": "2022-01-01T12:00:00Z",
      "updatedAt": "2022-01-01T12:05:00Z"
    }
  ],
  "totalCount": 150,
  "totalPages": 8,
  "currentPage": 1
}
```

#### Get Recording Details

```
GET /api/recordings/{id}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "call_20220101.mp3",
  "filepath": "/uploads/call_20220101.mp3",
  "filesize": 2048000,
  "duration": "00:15:30",
  "agent": "John Smith",
  "callType": "Customer Support",
  "status": "completed",
  "source": "upload",
  "createdAt": "2022-01-01T12:00:00Z",
  "updatedAt": "2022-01-01T12:05:00Z",
  "transcription": {
    "id": "223e4567-e89b-12d3-a456-426614174000",
    "text": "Hello, this is John from customer support...",
    "language": "en",
    "speakers": 2,
    "status": "completed",
    "createdAt": "2022-01-01T12:05:00Z"
  }
}
```

#### Upload Recording

```
POST /api/recordings
Content-Type: multipart/form-data

file: [binary audio file]
agent: John Smith
callType: Customer Support
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "call_20220101.mp3",
  "status": "processing"
}
```

#### Update Recording Metadata

```
PATCH /api/recordings/{id}
Content-Type: application/json

{
  "agent": "Jane Doe",
  "callType": "Sales"
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "agent": "Jane Doe",
  "callType": "Sales",
  "updatedAt": "2022-01-02T09:00:00Z"
}
```

#### Delete Recording

```
DELETE /api/recordings/{id}
```

Response:
```json
{
  "success": true,
  "message": "Recording deleted successfully"
}
```

### Transcription API

#### Request Transcription

```
POST /api/recordings/{id}/transcribe
Content-Type: application/json

{
  "language": "en",
  "modelId": "scribe_v1"
}
```

Response:
```json
{
  "id": "323e4567-e89b-12d3-a456-426614174000",
  "recordingId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing"
}
```

#### Get Transcription Status

```
GET /api/transcriptions/{id}
```

Response:
```json
{
  "id": "323e4567-e89b-12d3-a456-426614174000",
  "recordingId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "text": "Hello, this is John from customer support...",
  "language": "en",
  "speakers": 2,
  "createdAt": "2022-01-01T12:05:00Z",
  "updatedAt": "2022-01-01T12:10:00Z"
}
```

## Integration Patterns

### Webhook Integration

Call TK can notify external systems about events using webhooks:

1. Register a webhook URL:

```
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-service.com/webhooks/call-tk",
  "events": ["transcription.completed", "recording.uploaded"],
  "secret": "your_webhook_secret"
}
```

2. Call TK will send POST requests to your URL when events occur:

```json
{
  "event": "transcription.completed",
  "timestamp": "2022-01-01T12:10:00Z",
  "data": {
    "recordingId": "123e4567-e89b-12d3-a456-426614174000",
    "transcriptionId": "323e4567-e89b-12d3-a456-426614174000"
  },
  "signature": "sha256=..."
}
```

3. Verify the webhook signature:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
```

### Batch Processing

For integrating with external systems that have large volumes of recordings:

1. Create a batch upload job:

```
POST /api/batch/upload
Content-Type: application/json

{
  "source": "s3",
  "bucket": "your-s3-bucket",
  "prefix": "recordings/2022/",
  "callType": "Sales",
  "autoTranscribe": true
}
```

Response:
```json
{
  "jobId": "423e4567-e89b-12d3-a456-426614174000",
  "status": "queued",
  "estimatedItems": 150
}
```

2. Check job status:

```
GET /api/batch/jobs/{jobId}
```

Response:
```json
{
  "jobId": "423e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress": {
    "total": 150,
    "processed": 45,
    "succeeded": 42,
    "failed": 3
  },
  "errors": [
    {
      "item": "recordings/2022/invalid_file.txt",
      "error": "Unsupported file format"
    }
  ]
}
```

## Extending the API

### Custom Transcription Providers

To integrate a custom transcription provider:

1. Implement the `TranscriptionRepository` interface
2. Register your implementation in the dependency container
3. Create an API endpoint for configuring your provider

Example configuration endpoint:

```
POST /api/settings/transcription-providers
Content-Type: application/json

{
  "name": "CustomProvider",
  "apiKey": "your_api_key",
  "endpoint": "https://custom-provider.com/api/transcribe",
  "isDefault": false
}
```

### Analytics Integration

To integrate with external analytics systems:

1. Export transcriptions in a structured format:

```
GET /api/recordings/{id}/export
Accept: application/json
```

2. Configure automatic export to external systems:

```
POST /api/integrations
Content-Type: application/json

{
  "type": "analytics",
  "provider": "Salesforce",
  "config": {
    "endpoint": "https://your-salesforce-instance.com/api/calldata",
    "apiKey": "your_integration_key",
    "fields": ["agent", "duration", "transcription", "callType"]
  }
}
```

## Error Handling

All API endpoints follow consistent error response formats:

```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Recording with ID 123 not found",
    "status": 404
  }
}
```

Common error codes:
- `unauthorized`: Authentication required or failed
- `forbidden`: Insufficient permissions
- `resource_not_found`: Requested resource doesn't exist
- `validation_error`: Invalid request parameters
- `internal_error`: Server-side error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

When the rate limit is exceeded, the API returns a 429 Too Many Requests status code.

## Pagination

List endpoints support pagination with the following query parameters:
- `page`: Page number (1-based)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "items": [...],
  "totalCount": 150,
  "totalPages": 8,
  "currentPage": 1,
  "nextPage": 2,
  "prevPage": null
}
```

## Versioning

The API is versioned through the URL:
```
/api/v1/recordings
```

When significant changes are made, a new version will be published while maintaining backward compatibility for a deprecation period.

## SDKs and Client Libraries

### JavaScript/TypeScript Client

```javascript
import { CallTkClient } from 'call-tk-client';

const client = new CallTkClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://your-call-tk-instance.com/api'
});

// List recordings
const recordings = await client.recordings.list({
  page: 1,
  limit: 20,
  agent: 'John Smith'
});

// Upload a recording
const recording = await client.recordings.upload({
  file: fs.createReadStream('call.mp3'),
  agent: 'John Smith',
  callType: 'Support'
});

// Start transcription
await client.recordings.transcribe(recording.id, {
  language: 'en'
});
```

### Other Languages

SDKs for other languages can be built following the API specifications in this document. 