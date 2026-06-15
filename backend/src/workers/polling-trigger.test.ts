jest.mock("../config/db", () => ({
  prisma: {
    integration: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../queues/polling.queue", () => ({
  POLLING_JOB_NAME: "poll",
  pollingQueue: { addBulk: jest.fn() },
}));

jest.mock("../config/polling", () => ({
  isAnyPollingEnabled: jest.fn(() => true),
  isProviderPollingEnabled: jest.fn(() => true),
}));

jest.mock("../utils/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn() },
}));

import { isAnyPollingEnabled } from "../config/polling";
import { prisma } from "../config/db";
import { pollingQueue } from "../queues/polling.queue";
import {
  enqueuePollingJobs,
  listActiveIntegrations,
} from "./polling-trigger";

describe("polling-trigger", () => {
  beforeEach(() => jest.clearAllMocks());

  it("listActiveIntegrations returns mapped refs", async () => {
    (prisma.integration.findMany as jest.Mock).mockResolvedValue([
      { id: "i1", userId: "u1", provider: "gmail" },
    ]);
    const refs = await listActiveIntegrations();
    expect(refs).toEqual([
      { integrationId: "i1", userId: "u1", provider: "gmail" },
    ]);
  });

  it("enqueuePollingJobs returns empty when no integrations", async () => {
    (prisma.integration.findMany as jest.Mock).mockResolvedValue([]);
    const result = await enqueuePollingJobs();
    expect(result).toEqual({ enqueued: 0, integrations: [] });
    expect(pollingQueue.addBulk).not.toHaveBeenCalled();
  });

  it("enqueuePollingJobs enqueues bulk jobs", async () => {
    (prisma.integration.findMany as jest.Mock).mockResolvedValue([
      { id: "i1", userId: "u1", provider: "slack" },
    ]);
    (pollingQueue.addBulk as jest.Mock).mockResolvedValue(undefined);
    const result = await enqueuePollingJobs();
    expect(result.enqueued).toBe(1);
    expect(pollingQueue.addBulk).toHaveBeenCalled();
  });

  it("enqueuePollingJobs skips when polling disabled", async () => {
    (isAnyPollingEnabled as jest.Mock).mockReturnValue(false);
    (prisma.integration.findMany as jest.Mock).mockResolvedValue([
      { id: "i1", userId: "u1", provider: "slack" },
    ]);
    const result = await enqueuePollingJobs();
    expect(result).toEqual({ enqueued: 0, integrations: [] });
    expect(pollingQueue.addBulk).not.toHaveBeenCalled();
  });
});
