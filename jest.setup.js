// Set up any global test configuration here
// For example, increase timeout for async tests
jest.setTimeout(30000);

// Mock environment variables that are needed for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.ELEVENLABS_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock Next.js components and functions
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    refresh: jest.fn(),
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  })),
  useParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
})); 