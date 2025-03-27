# Testing Documentation

## Test Structure

The tests are organized into several categories:

- **API Tests** (`src/__tests__/api/`): Tests for API endpoints
- **Component Tests** (`src/__tests__/components/`): Tests for React components
- **Unit Tests** (`src/__tests__/core/`): Tests for domain logic and services
- **Adapter Tests** (`src/__tests__/adapters/`): Tests for adapters to external systems
- **E2E Tests** (`src/__tests__/e2e/`): End-to-end tests

## Setting Up Test Environment

1. Create a test database:
```bash
createdb call_analyzer_test
```

2. Set up the schema:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/call_analyzer_test npx prisma db push
```

3. Ensure you have a `.env.test` file with test-specific environment variables:
```
# Test Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/call_analyzer_test?schema=public"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Storage
UPLOAD_DIR="./public/test-uploads"
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES="audio/mpeg,audio/wav,audio/mp3"

# Mock API Key
ELEVENLABS_API_KEY="test-api-key"
```

## Running Tests

You can run tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run specific test categories
npm run test:api        # Run API tests
npm run test:components # Run component tests
npm run test:unit       # Run unit tests
npm run test:adapters   # Run adapter tests
npm run test:e2e        # Run end-to-end tests

# Generate coverage report
npm run test:coverage
```

## Automated Setup

You can also use the setup script to automatically set up the test environment:

```bash
./scripts/setup-test-env.sh
```

This script will:
1. Create the test uploads directory
2. Create the test database (if PostgreSQL is running)
3. Set up the database schema 