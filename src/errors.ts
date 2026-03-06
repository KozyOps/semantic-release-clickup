import SemanticReleaseError from "@semantic-release/error";

const ERRORS = {
  ENOTOKEN: {
    message: "A ClickUp personal API token is required.",
    details:
      "Set the `CLICKUP_TOKEN` environment variable to your ClickUp personal API token (starts with `pk_`).\n\nYou can create one at https://app.clickup.com/settings/apps",
  },
  ENOWORKSPACEID: {
    message: "A ClickUp workspace ID is required.",
    details:
      "Provide the workspace ID via the `workspaceId` plugin option or the `CLICKUP_WORKSPACE_ID` environment variable.\n\nYou can find your workspace ID in the URL: `https://app.clickup.com/{workspace_id}/home`",
  },
  ENOCHANNELID: {
    message: "A ClickUp chat channel ID is required.",
    details:
      "Provide the channel ID via the `channelId` plugin option or the `CLICKUP_CHANNEL_ID` environment variable.",
  },
  EINVALIDMESSAGETYPE: {
    message: "Invalid messageType.",
    details: "`messageType` must be either `\"post\"` or `\"message\"`.",
  },
  EMESSAGEFAILED: (status: number, body: string) => ({
    message: `Failed to send message to ClickUp chat (HTTP ${status}).`,
    details: `The ClickUp API responded with status ${status}:\n\n${body}`,
  }),
} as const;

export function getError(
  code: keyof typeof ERRORS,
  ...args: unknown[]
): SemanticReleaseError {
  const entry = ERRORS[code];

  if (typeof entry === "function") {
    const { message, details } = (entry as (...a: unknown[]) => { message: string; details: string })(...args);
    return new SemanticReleaseError(message, code, details);
  }

  return new SemanticReleaseError(entry.message, code, entry.details);
}
