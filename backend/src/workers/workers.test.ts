jest.mock("bullmq");

import { Worker } from "bullmq";
import { createPollingWorker } from "./polling.worker";
import { createAiExtractionWorker } from "./ai-extraction.worker";

describe("workers", () => {
  it("createPollingWorker returns a Worker", () => {
    const worker = createPollingWorker();
    expect(Worker).toHaveBeenCalled();
    expect(worker).toBeDefined();
  });

  it("createAiExtractionWorker returns a Worker", () => {
    const worker = createAiExtractionWorker();
    expect(Worker).toHaveBeenCalled();
    expect(worker).toBeDefined();
  });
});
