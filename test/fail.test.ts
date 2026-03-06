import { describe, it, expect, vi, beforeEach } from "vitest";
import { fail } from "../src/fail.js";
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
    },
    branch: { name: "main" },
    logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
    errors: [{ message: "npm publish failed" }],
    options: { repositoryUrl: "https://github.com/org/repo" },
    ...overrides,
  };
}

describe("fail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips sending when notifyOnFail is false (default)", async () => {
    await fail({}, makeContext());
    expect(sendMessageModule.sendMessage).not.toHaveBeenCalled();
  });

  it("sends failure notification when notifyOnFail is true", async () => {
    await fail({ notifyOnFail: true }, makeContext());
    expect(sendMessageModule.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("npm publish failed"),
        type: "post",
      })
    );
  });

  it("swallows sendMessage errors instead of rethrowing", async () => {
    vi.mocked(sendMessageModule.sendMessage).mockRejectedValueOnce(
      new Error("Network error")
    );
    // Should NOT throw
    await expect(
      fail({ notifyOnFail: true }, makeContext())
    ).resolves.toBeUndefined();
  });

  it("logs the error when sendMessage fails", async () => {
    vi.mocked(sendMessageModule.sendMessage).mockRejectedValueOnce(
      new Error("Network error")
    );
    const ctx = makeContext();
    await fail({ notifyOnFail: true }, ctx);
    expect(ctx.logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Network error")
    );
  });
});
