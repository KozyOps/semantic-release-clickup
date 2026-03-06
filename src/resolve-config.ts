import type { PluginConfig, ResolvedConfig } from "./types.js";

const DEFAULT_SUCCESS_TITLE = "Released ${packageName} v${version}";
const DEFAULT_SUCCESS_MESSAGE =
  "**${packageName}** v${version} has been released.\n\n${notes}";
const DEFAULT_FAIL_TITLE = "Release failed: ${packageName}";
const DEFAULT_FAIL_MESSAGE =
  "Release of **${packageName}** failed.\n\n${errors}";

export function resolveConfig(
  pluginConfig: PluginConfig,
  env: Record<string, string | undefined>
): ResolvedConfig {
  return {
    clickupToken: env.CLICKUP_TOKEN ?? "",
    workspaceId: pluginConfig.workspaceId ?? env.CLICKUP_WORKSPACE_ID ?? "",
    channelId: pluginConfig.channelId ?? env.CLICKUP_CHANNEL_ID ?? "",
    messageType: pluginConfig.messageType ?? "message",
    notifyOnSuccess: pluginConfig.notifyOnSuccess ?? true,
    notifyOnFail: pluginConfig.notifyOnFail ?? false,
    packageName:
      pluginConfig.packageName ??
      env.npm_package_name ??
      env.SEMANTIC_RELEASE_PACKAGE ??
      "unknown",
    successTitle: pluginConfig.successTitle ?? DEFAULT_SUCCESS_TITLE,
    successMessage: pluginConfig.successMessage ?? DEFAULT_SUCCESS_MESSAGE,
    failTitle: pluginConfig.failTitle ?? DEFAULT_FAIL_TITLE,
    failMessage: pluginConfig.failMessage ?? DEFAULT_FAIL_MESSAGE,
  };
}
