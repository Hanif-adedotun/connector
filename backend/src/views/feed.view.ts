import type { ExtractedTask } from "@prisma/client";
import { serializeTask, type TaskView } from "./task.view";

export interface FeedResponse {
  date: string;
  items: TaskView[];
}

export function serializeFeed(tasks: ExtractedTask[]): FeedResponse {
  return {
    date: new Date().toISOString().slice(0, 10),
    items: tasks.map(serializeTask),
  };
}
