import { serializeTask, type TaskView } from "./task.view";

export interface FeedResponse {
  date: string;
  items: TaskView[];
}

export function serializeFeed(
  tasks: Parameters<typeof serializeTask>[0][],
): FeedResponse {
  return {
    date: new Date().toISOString().slice(0, 10),
    items: tasks.map(serializeTask),
  };
}
