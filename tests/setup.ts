// Vitest setup file
import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/vertex_test';
  
  // Mock external services in tests
  process.env.SKIP_EMAILS = 'true';
  process.env.SKIP_SMS = 'true';
  process.env.MOCK_STRIPE = 'true';
  
  console.log('Test environment initialized');
});

// Cleanup after each test
afterEach(async () => {
  // Clear any test data if needed
  // await cleanupTestData();
});

// Global teardown
afterAll(async () => {
  console.log('Test suite completed');
});


