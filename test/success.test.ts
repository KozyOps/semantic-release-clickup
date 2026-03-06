import { describe, it, expect, vi, beforeEach } from "vitest";
import { success } from "../src/success.js";
import * as sendMessageModule from "../src/send-message.js";
import type { Context } from "../src/types.js";

vi.mock("../src/send-message.js", () => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
}));

function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    cwd: "/tmp",
    env: {
      CLICKUP_TOKEN: "pk_test",
      CLICKUP_WORKSPACE_ID: "ws-1",
      CLICKUP_CHANNEL_ID: "ch-1",
      npm_package_name: "my-lib",
    },
    branch: { name: "main" },
    logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
    nextRelease: {
      version: "2.0.0",
      gitHead: "abc",
      gitTag: "v2.0.0",
      notes: "## Breaking\n- Changed API",
    },
    commits: [{ hash: "abc", subject: "feat!: change API" }],
    options: { repositoryUrl: "https://github.com/org/repo" },
    ...overrides,
  };
}

describe("success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendMessage with formatted content", async () => {
    await success({}, makeContext());
    expect(sendMessageModule.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "pk_test",
        workspaceId: "ws-1",
        channelId: "ch-1",
        type: "message",
        content: expect.stringContaining("v2.0.0"),
        title: undefined,
      })
    );
  });

  it("skips sending when notifyOnSuccess is false", async () => {
    await success({ notifyOnSuccess: false }, makeContext());
    expect(sendMessageModule.sendMessage).not.toHaveBeenCalled();
  });

  it("propagates sendMessage errors", async () => {
    vi.mocked(sendMessageModule.sendMessage).mockRejectedValueOnce(
      new Error("API error")
    );
    await expect(success({}, makeContext())).rejects.toThrow("API error");
  });
});
