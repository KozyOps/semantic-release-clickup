import { getError } from "./errors.js";
import type { Logger } from "./types.js";

const CLICKUP_API_BASE = "https://api.clickup.com/api/v3";

interface SendMessageOptions {
  token: string;
  workspaceId: string;
  channelId: string;
  content: string;
  type: "post" | "message";
  title?: string;
  logger: Logger;
}

export async function sendMessage(opts: SendMessageOptions): Promise<void> {
  const { token, workspaceId, channelId, content, type, title, logger } = opts;

  const url = `${CLICKUP_API_BASE}/workspaces/${workspaceId}/chat/channels/${channelId}/messages`;

  let response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createRequestBody({ content, type, title })),
  });

  if (type === "post" && shouldFallbackToMessage(response)) {
    logger.warn(
      "ClickUp rejected the post payload. Retrying as a plain message."
    );

    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRequestBody({ content, type: "message" })),
    });
  }

  if (!response.ok) {
    const responseBody = await response.text();
    logger.error(
      `ClickUp API error (HTTP ${response.status}): ${responseBody}`
    );
    throw getError("EMESSAGEFAILED", response.status, responseBody);
  }

  logger.log("Successfully sent release notification to ClickUp chat.");
}

function createRequestBody(opts: {
  content: string;
  type: "post" | "message";
  title?: string;
}): Record<string, string | Record<string, string>> {
  const body: Record<string, string | Record<string, string>> = {
    content: opts.content,
    content_format: "text/md",
    type: opts.type,
  };

  if (opts.type === "post" && opts.title) {
    body.post_data = {
      title: opts.title,
    };
  }

  return body;
}

function shouldFallbackToMessage(response: Response): boolean {
  return response.status === 400;
}
