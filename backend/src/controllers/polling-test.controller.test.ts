jest.mock("../config/polling", () => ({
  isPollingEnabled: jest.fn(() => true),
}));

jest.mock("../workers/polling-trigger", () => ({
  enqueuePollingJobs: jest.fn(),
  listActiveIntegrations: jest.fn(),
}));

jest.mock("../services/integrations", () => ({
  runProviderPoll: jest.fn(),
}));

import { PollingTestController } from "./polling-test.controller";
import { isPollingEnabled } from "../config/polling";
import {
  enqueuePollingJobs,
  listActiveIntegrations,
} from "../workers/polling-trigger";
import { runProviderPoll } from "../services/integrations";
import { mockNext, mockRequest, mockResponse } from "../../__tests__/helpers/mock-request";

describe("PollingTestController", () => {
  beforeEach(() => jest.clearAllMocks());

  it("trigger queues jobs", async () => {
    (enqueuePollingJobs as jest.Mock).mockResolvedValue({
      enqueued: 2,
      integrations: [],
    });
    const res = mockResponse();
    await PollingTestController.trigger(mockRequest(), res, mockNext());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "queued", enqueued: 2 }),
    );
  });

  it("trigger sync mode polls integrations", async () => {
    (listActiveIntegrations as jest.Mock).mockResolvedValue([
      { integrationId: "i1", userId: "u1", provider: "gmail" },
    ]);
    (runProviderPoll as jest.Mock).mockResolvedValue({ eventsFetched: 3 });
    const req = mockRequest({ query: { sync: "true" } });
    const res = mockResponse();
    await PollingTestController.trigger(req, res, mockNext());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "sync", results: expect.any(Array) }),
    );
  });

  it("trigger returns 503 when polling disabled", async () => {
    (isPollingEnabled as jest.Mock).mockReturnValue(false);
    const res = mockResponse();
    await PollingTestController.trigger(mockRequest(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false }),
    );
  });
});
