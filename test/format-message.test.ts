import { describe, it, expect } from "vitest";
import {
  formatSuccessMessage,
  formatFailMessage,
  truncate,
} from "../src/format-message.js";
import type { ResolvedConfig, Context } from "../src/types.js";

function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    clickupToken: "pk_test",
    workspaceId: "ws-1",
    channelId: "ch-1",
    messageType: "post",
    notifyOnSuccess: true,
    notifyOnFail: false,
    packageName: "my-lib",
    successTitle: "Released ${packageName} v${version}",
    successMessage:
      "**${packageName}** v${version} has been released.\n\n${notes}",
    failTitle: "Release failed: ${packageName}",
    failMessage: "Release of **${packageName}** failed.\n\n${errors}",
    ...overrides,
  };
}

function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    cwd: "/tmp",
    env: {},
    branch: { name: "main" },
    logger: { log: () => {}, error: () => {}, warn: () => {} },
    nextRelease: {
      version: "1.2.3",
      gitHead: "abc123",
      gitTag: "v1.2.3",
      notes: "## Features\n- Added foo\n- Added bar",
    },
    commits: [
      { hash: "abc123", subject: "feat: add foo" },
      { hash: "def456", subject: "feat: add bar" },
    ],
    options: { repositoryUrl: "https://github.com/org/repo" },
    ...overrides,
  };
}

describe("formatSuccessMessage", () => {
  it("produces default template with version, package name, and notes", () => {
    const result = formatSuccessMessage(makeConfig(), makeContext());
    expect(result.content).toContain("**my-lib** v1.2.3 has been released.");
    expect(result.content).toContain("## Features");
    expect(result.content).toContain("- Added foo");
  });

  it("interpolates all template variables in a custom string", () => {
    const config = makeConfig({
      successMessage:
        "${packageName} ${version} ${gitTag} ${channel} ${repositoryUrl}",
    });
    const result = formatSuccessMessage(config, makeContext());
    expect(result.content).toBe(
      "my-lib 1.2.3 v1.2.3  https://github.com/org/repo"
    );
  });

  it("calls function-based message template with context", () => {
    const config = makeConfig({
      successMessage: (ctx) =>
        `Custom: ${ctx.packageName} v${ctx.version} (${ctx.commits.length} commits)`,
    });
    const result = formatSuccessMessage(config, makeContext());
    expect(result.content).toBe("Custom: my-lib v1.2.3 (2 commits)");
  });

  it("includes title when messageType is post", () => {
    const result = formatSuccessMessage(
      makeConfig({ messageType: "post" }),
      makeContext()
    );
    expect(result.title).toBe("Released my-lib v1.2.3");
  });

  it("omits title when messageType is message", () => {
    const result = formatSuccessMessage(
      makeConfig({ messageType: "message" }),
      makeContext()
    );
    expect(result.title).toBeUndefined();
  });

  it("truncates content exceeding 980 characters", () => {
    const longNotes = "x".repeat(2000);
    const ctx = makeContext({
      nextRelease: {
        version: "1.0.0",
        gitHead: "abc",
        gitTag: "v1.0.0",
        notes: longNotes,
      },
    });
    const result = formatSuccessMessage(makeConfig(), ctx);
    expect(result.content.length).toBeLessThanOrEqual(980);
    expect(result.content).toContain("... (truncated)");
  });
});

describe("formatFailMessage", () => {
  it("formats errors in the default template", () => {
    const ctx = makeContext({
      errors: [
        { message: "Something broke" },
        { message: "Another issue" },
      ],
    });
    const config = makeConfig({ notifyOnFail: true });
    const result = formatFailMessage(config, ctx);
    expect(result.content).toContain("Release of **my-lib** failed.");
    expect(result.content).toContain("- **Something broke**");
    expect(result.content).toContain("- **Another issue**");
  });

  it("calls function-based fail message", () => {
    const config = makeConfig({
      failMessage: (ctx) =>
        `Failed: ${ctx.packageName} with ${ctx.errors.length} errors`,
    });
    const ctx = makeContext({
      errors: [{ message: "err1" }, { message: "err2" }],
    });
    const result = formatFailMessage(config, ctx);
    expect(result.content).toBe("Failed: my-lib with 2 errors");
  });

  it("includes title when messageType is post", () => {
    const ctx = makeContext({ errors: [{ message: "err" }] });
    const result = formatFailMessage(
      makeConfig({ messageType: "post" }),
      ctx
    );
    expect(result.title).toBe("Release failed: my-lib");
  });
});

describe("truncate", () => {
  it("returns text as-is when under limit", () => {
    expect(truncate("short", 980)).toBe("short");
  });

  it("truncates text exceeding the limit", () => {
    const long = "a".repeat(1000);
    const result = truncate(long, 980);
    expect(result.length).toBeLessThanOrEqual(980);
    expect(result).toContain("... (truncated)");
  });

  it("tries to break at a line boundary", () => {
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i}`).join(
      "\n"
    );
    const result = truncate(lines, 200);
    expect(result).toContain("... (truncated)");
    // Should end with a complete line before the marker
    const beforeMarker = result.split("\n\n... (truncated)")[0];
    expect(beforeMarker).toMatch(/Line \d+$/);
  });
});
