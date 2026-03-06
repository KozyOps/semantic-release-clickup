import { resolveConfig } from "./resolve-config.js";
import { formatFailMessage } from "./format-message.js";
import { sendMessage } from "./send-message.js";
import type { PluginConfig, Context } from "./types.js";

export async function fail(
  pluginConfig: PluginConfig,
  context: Context
): Promise<void> {
  const config = resolveConfig(pluginConfig, context.env);

  if (!config.notifyOnFail) {
    context.logger.log("ClickUp failure notification is disabled. Skipping.");
    return;
  }

  const { content, title } = formatFailMessage(config, context);

  try {
    await sendMessage({
      token: config.clickupToken,
      workspaceId: config.workspaceId,
      channelId: config.channelId,
      content,
      type: config.messageType,
      title,
      logger: context.logger,
    });
  } catch (error) {
    // Swallow send errors in the fail hook to avoid masking the original release failure
    context.logger.error(
      `Failed to send failure notification to ClickUp: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
