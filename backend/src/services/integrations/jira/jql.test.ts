jest.mock("../../../config/env", () => ({
  env: {
    JIRA_STATUS_CATEGORIES: "To Do,In Progress",
    JIRA_EXTRA_JQL: "",
  },
}));

import { buildJiraPollJql } from "./jql";

describe("buildJiraPollJql", () => {
  it("builds JQL with status categories", () => {
    const jql = buildJiraPollJql();
    expect(jql).toContain("assignee = currentUser()");
    expect(jql).toContain('statusCategory IN ("To Do", "In Progress")');
    expect(jql).toContain("resolution IS EMPTY");
    expect(jql).toContain("ORDER BY updated DESC");
  });
});

describe("buildJiraPollJql with extra JQL", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock("../../../config/env", () => ({
      env: {
        JIRA_STATUS_CATEGORIES: "To Do",
        JIRA_EXTRA_JQL: "project = BRIEF",
      },
    }));
  });

  it("includes extra JQL fragment", async () => {
    const { buildJiraPollJql: buildWithExtra } = await import("./jql");
    const jql = buildWithExtra();
    expect(jql).toContain("(project = BRIEF)");
  });
});
