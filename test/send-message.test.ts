import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMessage } from "../src/send-message.js";
import type { Logger } from "../src/types.js";

const mockLogger: Logger = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

describe("sendMessage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends POST to the correct ClickUp API URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "msg-1" }), { status: 200 })
    );

    await sendMessage({
      token: "pk_test",
      workspaceId: "ws-1",
      channelId: "ch-1",
      content: "Hello",
      type: "message",
      logger: mockLogger,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.clickup.com/api/v3/workspaces/ws-1/chat/channels/ch-1/messages",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends Authorization header with raw token (no Bearer prefix)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 })
    );

    await sendMessage({
      token: "pk_my_token",
      workspaceId: "ws-1",
      channelId: "ch-1",
      content: "Test",
      type: "message",
      logger: mockLogger,
    });

    const callArgs = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = callArgs.headers as Record<string, string>;
    expect(headers.Authorization).toBe("pk_my_token");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("includes post_title when type is post", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 })
    );

    await sendMessage({
      token: "pk_test",
      workspaceId: "ws-1",
      channelId: "ch-1",
      content: "Body",
      type: "post",
      title: "My Title",
      logger: mockLogger,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.post_data).toEqual({ title: "My Title" });
    expect(body.type).toBe("post");
    expect(body.content_format).toBe("text/md");
  });

  it("omits post_data when type is message", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 })
    );

    await sendMessage({
      token: "pk_test",
      workspaceId: "ws-1",
      channelId: "ch-1",
      content: "Body",
      type: "message",
      logger: mockLogger,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.post_data).toBeUndefined();
  });

  it("retries invalid post payloads as plain messages", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ status: 400, message: "Invalid Post Data" }),
          { status: 400 }
        )
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await sendMessage({
      token: "pk_test",
      workspaceId: "ws-1",
      channelId: "ch-1",
      content: "Body",
      type: "post",
      title: "My Title",
      logger: mockLogger,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const firstBody = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    const secondBody = JSON.parse(fetchSpy.mock.calls[1][1]!.body as string);

    expect(firstBody.type).toBe("post");
    expect(secondBody.type).toBe("message");
    expect(secondBody.post_data).toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "ClickUp rejected the post payload. Retrying as a plain message."
    );
  });

  it("throws EMESSAGEFAILED on non-2xx response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 })
    );

    await expect(
      sendMessage({
        token: "pk_bad",
        workspaceId: "ws-1",
        channelId: "ch-1",
        content: "Test",
        type: "message",
        logger: mockLogger,
      })
    ).rejects.toThrow("Failed to send message to ClickUp chat (HTTP 401)");
  });

  it("does not throw on successful 200 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 })
    );

    await expect(
      sendMessage({
        token: "pk_test",
        workspaceId: "ws-1",
        channelId: "ch-1",
        content: "Test",
        type: "message",
        logger: mockLogger,
      })
    ).resolves.toBeUndefined();
  });
});
