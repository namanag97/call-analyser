#!/bin/bash

# Create test uploads directory
mkdir -p ./public/test-uploads

# Check if PostgreSQL is running
pg_isready
if [ $? -ne 0 ]; then
  echo "PostgreSQL is not running. Please start PostgreSQL and try again."
  echo "You can still run the tests that don't require database access."
  exit 1
fi

# Create test database
echo "Creating test database..."
createdb call_analyzer_test

# Set up schema
echo "Setting up database schema..."
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/call_analyzer_test npx prisma db push

echo "Test environment setup complete!"
echo "You can now run the tests using:"
echo "npm test               # Run all tests"
echo "npm run test:watch     # Run tests in watch mode"
echo "npm run test:api       # Run API tests"
echo "npm run test:components # Run component tests"
echo "npm run test:unit      # Run unit tests"
echo "npm run test:adapters  # Run adapter tests"
echo "npm run test:e2e       # Run end-to-end tests"
echo "npm run test:coverage  # Generate coverage report" 