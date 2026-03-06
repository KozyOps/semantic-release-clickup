import { resolveConfig } from "./resolve-config.js";
import { getError } from "./errors.js";
import type { PluginConfig, Context } from "./types.js";

export async function verifyConditions(
  pluginConfig: PluginConfig,
  context: Context
): Promise<void> {
  const config = resolveConfig(pluginConfig, context.env);
  const errors: Error[] = [];

  if (!config.clickupToken) {
    errors.push(getError("ENOTOKEN"));
  }

  if (!config.workspaceId) {
    errors.push(getError("ENOWORKSPACEID"));
  }

  if (!config.channelId) {
    errors.push(getError("ENOCHANNELID"));
  }

  if (
    pluginConfig.messageType &&
    !["post", "message"].includes(pluginConfig.messageType)
  ) {
    errors.push(getError("EINVALIDMESSAGETYPE"));
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  context.logger.log("ClickUp chat notification configuration verified.");
}
