# Call Analyzer

Call Analyzer is a Next.js application designed to upload, analyze, and manage audio recordings of calls. It provides a user interface for uploading files individually or in bulk, managing recordings, and viewing their details.

## Features

- **Audio File Management**: Upload, list, filter, and view details of audio recordings
- **Batch Upload Support**: Upload up to 100 files simultaneously with progress tracking
- **S3 Integration**: Import audio files directly from Amazon S3
- **Deduplication**: Automatic detection and prevention of duplicate file uploads
- **Clean UI**: Modern interface with filtering and sorting capabilities

## Architecture

The application follows a clean architecture pattern with clear separation of concerns:

### Layers

1. **Domain Layer**: Core entities and interfaces
   - `src/core/domain/entities`: Business entities like `Recording`
   - `src/core/domain/ports/in`: Input ports (use cases) 
   - `src/core/domain/ports/out`: Output ports (repositories)

2. **Application Layer**: Business logic and use case implementations
   - `src/core/application/services`: Services that implement business logic
   - `src/core/application/usecases`: Implementation of the use cases

3. **Adapter Layer**: Interface adapters
   - `src/adapters/in/web`: Web controllers and routes
   - `src/adapters/out/persistence`: Data persistence implementations
   - `src/adapters/out/storage`: File storage implementations

4. **Infrastructure Layer**: External frameworks and tools
   - Next.js framework
   - Prisma ORM for database access
   - File system or S3 for file storage

## Technical Stack

- **Frontend**: React, Next.js, TailwindCSS
- **Backend**: Node.js, Next.js API routes
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: (Placeholder for future auth implementation)
- **File Storage**: Local filesystem and Amazon S3

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd call-analyzer
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the project root with the following variables:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/call_analyzer"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. Initialize the database
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

### Usage

1. Navigate to `http://localhost:3000` in your browser
2. Use the sidebar to navigate between different sections
3. On the Upload page, you can:
   - Drag & drop audio files or click to select files
   - Upload files individually or in bulk (up to 100 files)
   - Import files from S3
4. On the Recordings page, you can:
   - View all uploaded recordings
   - Filter recordings by agent, date, status, and source
   - Click on a recording to view details

## API Documentation

### Endpoints

- `GET /api/recordings` - Get list of recordings with filtering and pagination
- `GET /api/recordings/:id` - Get details of a specific recording
- `POST /api/recordings` - Upload a new recording or import from S3
- `PUT /api/recordings/:id` - Update an existing recording
- `DELETE /api/recordings/:id` - Delete a recording

## Project Structure

```
call-analyzer/
├── src/
│   ├── adapters/               # Interface adapters
│   │   ├── in/
│   │   │   └── web/            # Web controllers
│   │   └── out/
│   │       ├── persistence/    # Database repositories
│   │       └── storage/        # File storage repositories
│   ├── app/                    # Next.js app directory
│   │   ├── api/                # API routes
│   │   ├── recordings/         # Recordings pages
│   │   └── uploads/            # Upload page
│   ├── components/             # Reusable React components
│   ├── core/                   # Core business logic
│   │   ├── application/        # Application services
│   │   │   ├── services/       # Core services
│   │   │   └── usecases/       # Use case implementations
│   │   └── domain/             # Domain models and interfaces
│   │       ├── entities/       # Domain entities
│   │       └── ports/          # Ports (interfaces)
│   │           ├── in/         # Input ports (use cases)
│   │           └── out/        # Output ports (repositories)
│   └── lib/                    # Utility libraries
├── prisma/                     # Prisma ORM files
│   └── schema.prisma           # Database schema
└── public/                     # Static files
    └── uploads/                # Uploaded files
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
