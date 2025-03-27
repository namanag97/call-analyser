// jest.setup.js
// Set up any global test configuration
jest.setTimeout(30000);

// Mock environment variables that are needed for tests
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/call_analyzer_test';
process.env.ELEVENLABS_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock Next.js components and hooks
jest.mock('next/navigation', () => {
  return {
    useRouter: jest.fn().mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    }),
    useParams: jest.fn().mockReturnValue({}),
    usePathname: jest.fn().mockReturnValue('/'),
    useSearchParams: jest.fn().mockReturnValue({
      get: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
      toString: jest.fn()
    })
  };
});

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: 'mockNextImage'
}));

// Import @testing-library/jest-dom matchers if you're using them
require('@testing-library/jest-dom');