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

  const body: Record<string, string> = {
    content,
    content_format: "text/md",
    type,
  };

  if (type === "post" && title) {
    body.post_title = title;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    logger.error(
      `ClickUp API error (HTTP ${response.status}): ${responseBody}`
    );
    throw getError("EMESSAGEFAILED", response.status, responseBody);
  }

  logger.log("Successfully sent release notification to ClickUp chat.");
}
