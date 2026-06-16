process.env.NODE_ENV = "test";
process.env.ENCRYPTION_KEY = "a".repeat(64);
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.GROQ_API_KEY = "test-groq-key";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.APP_URL = "http://localhost:4001";
process.env.API_URL = "http://localhost:4000";
process.env.APP_MODE = "production";

jest.mock("./src/config/redis", () => ({
  redis: {
    incr: jest.fn().mockResolvedValue(1),
    pexpire: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
    on: jest.fn(),
  })),
  QueueScheduler: jest.fn(),
}));
