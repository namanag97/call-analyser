# Deduplication in Call Analyzer

This document explains how deduplication works in the Call Analyzer application to prevent uploading duplicate audio files.

## Overview

Deduplication is the process of identifying and preventing the upload of identical or very similar audio files that have already been stored in the system. This helps to:

1. Save storage space
2. Prevent duplicate data in analytics
3. Improve user experience by avoiding redundant uploads

## Implementation Details

### Deduplication Methods

Call Analyzer uses multiple strategies to identify duplicate files:

1. **Filename Comparison**: Check if a file with identical name already exists
2. **Content Hash Comparison**: Generate and compare file content hashes (SHA-256)
3. **Audio Fingerprinting**: For audio content similarity (planned for future implementation)

### Deduplication Process

When a file is uploaded, the following process occurs:

1. Generate a unique hash from the file content using SHA-256 algorithm
2. Check if the hash exists in the database
   - If match found: Reject upload and inform user it's a duplicate
   - If no match: Proceed with upload
3. For batch uploads, duplicates are filtered out but the process continues with unique files
4. Store the hash in the database along with the file metadata

### Configuration Options

Deduplication can be configured through system settings:

- **Strict Mode**: Reject uploads if any duplicate is found (default)
- **Lenient Mode**: Allow uploads but mark as potential duplicates
- **Scope**: Set deduplication scope to all files or just files uploaded by the same user

## API Interface

The recording repository provides methods to check for duplicates:

```typescript
interface RecordingRepository {
  // Existing methods...
  
  // Check if a file with the same hash exists
  findByHash(hash: string): Promise<Recording | null>;
  
  // Check if a file with the same filename exists
  findByFilename(filename: string): Promise<Recording | null>;
}
```

## Database Schema

The `Recording` entity includes hash fields to support deduplication:

```prisma
model Recording {
  id        String    @id @default(cuid())
  filename  String
  filesize  Int
  contentHash String  @unique  // SHA-256 hash of file content
  path      String
  url       String?
  // Other fields...
}
```

## Usage Examples

### Checking for Duplicates Before Upload

```typescript
// In upload use case
const contentHash = generateFileHash(fileBuffer);
const existingFile = await recordingRepository.findByHash(contentHash);

if (existingFile) {
  throw new DuplicateFileError(`File with hash ${contentHash} already exists`);
}

// Proceed with upload if no duplicate found
```

### Handling Duplicates in Batch Uploads

```typescript
// For batch uploads
const results = await Promise.all(
  files.map(async (file) => {
    const hash = generateFileHash(file.buffer);
    const isDuplicate = await recordingRepository.findByHash(hash);
    
    if (isDuplicate) {
      return {
        success: false,
        filename: file.name,
        error: 'Duplicate file detected',
        isDuplicate: true,
        duplicateId: isDuplicate.id
      };
    }
    
    // Process non-duplicate file
    // ...
  })
);
```

## Error Handling

When a duplicate is detected, the system returns a specific error:

```typescript
{
  error: "Duplicate file detected",
  isDuplicate: true,
  originalFile: {
    id: "original_file_id",
    filename: "original_filename.mp3",
    uploadDate: "2023-05-20T14:30:00Z"
  }
}
```

## Future Enhancements

1. **Audio Fingerprinting**: Detect similar audio content even if files have different formats or bitrates
2. **Partial Matching**: Identify if a file is a subset of another file
3. **User Preferences**: Allow users to configure deduplication settings per upload
4. **Fuzzy Matching**: Use fuzzy matching for filenames to catch slight variations 