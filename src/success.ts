import { resolveConfig } from "./resolve-config.js";
import { formatSuccessMessage } from "./format-message.js";
import { sendMessage } from "./send-message.js";
import type { PluginConfig, Context } from "./types.js";

export async function success(
  pluginConfig: PluginConfig,
  context: Context
): Promise<void> {
  const config = resolveConfig(pluginConfig, context.env);

  if (!config.notifyOnSuccess) {
    context.logger.log("ClickUp success notification is disabled. Skipping.");
    return;
  }

  const { content, title } = formatSuccessMessage(config, context);

  await sendMessage({
    token: config.clickupToken,
    workspaceId: config.workspaceId,
    channelId: config.channelId,
    content,
    type: config.messageType,
    title,
    logger: context.logger,
  });
}
