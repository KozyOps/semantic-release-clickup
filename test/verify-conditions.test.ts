import { describe, it, expect } from "vitest";
import { verifyConditions } from "../src/verify-conditions.js";
import type { Context, PluginConfig } from "../src/types.js";

function makeContext(envOverrides: Record<string, string> = {}): Context {
  return {
    cwd: "/tmp",
    env: {
      CLICKUP_TOKEN: "pk_test_token",
      CLICKUP_WORKSPACE_ID: "ws-123",
      CLICKUP_CHANNEL_ID: "ch-456",
      ...envOverrides,
    },
    branch: { name: "main" },
    logger: { log: () => {}, error: () => {}, warn: () => {} },
  };
}

describe("verifyConditions", () => {
  it("succeeds when all config is valid", async () => {
    await expect(verifyConditions({}, makeContext())).resolves.toBeUndefined();
  });

  it("succeeds with config options instead of env vars", async () => {
    const config: PluginConfig = {
      workspaceId: "ws-from-config",
      channelId: "ch-from-config",
    };
    const ctx = makeContext({
      CLICKUP_WORKSPACE_ID: "",
      CLICKUP_CHANNEL_ID: "",
    });
    // Token still from env
    await expect(verifyConditions(config, ctx)).resolves.toBeUndefined();
  });

  it("throws AggregateError when CLICKUP_TOKEN is missing", async () => {
    const ctx = makeContext({ CLICKUP_TOKEN: "" });
    await expect(verifyConditions({}, ctx)).rejects.toThrow(AggregateError);
  });

  it("throws AggregateError when workspaceId is missing from both config and env", async () => {
    const ctx = makeContext({ CLICKUP_WORKSPACE_ID: "" });
    await expect(verifyConditions({}, ctx)).rejects.toThrow(AggregateError);
  });

  it("throws AggregateError when channelId is missing", async () => {
    const ctx = makeContext({ CLICKUP_CHANNEL_ID: "" });
    await expect(verifyConditions({}, ctx)).rejects.toThrow(AggregateError);
  });

  it("collects multiple errors into one AggregateError", async () => {
    const ctx = makeContext({
      CLICKUP_TOKEN: "",
      CLICKUP_WORKSPACE_ID: "",
      CLICKUP_CHANNEL_ID: "",
    });
    try {
      await verifyConditions({}, ctx);
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AggregateError);
      const agg = err as AggregateError;
      expect(agg.errors).toHaveLength(3);
    }
  });

  it("throws for invalid messageType", async () => {
    const config = { messageType: "invalid" as "post" };
    await expect(verifyConditions(config, makeContext())).rejects.toThrow(
      AggregateError
    );
  });
});
