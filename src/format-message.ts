import type {
  ResolvedConfig,
  Context,
  MessagePayload,
  TemplateContext,
  FailTemplateContext,
} from "./types.js";

const MAX_CONTENT_LENGTH = 980;
const TRUNCATION_MARKER = "\n\n... (truncated)";

export function formatSuccessMessage(
  config: ResolvedConfig,
  context: Context
): MessagePayload {
  const { nextRelease, commits, options } = context;

  const templateCtx: TemplateContext = {
    version: nextRelease?.version ?? "",
    gitTag: nextRelease?.gitTag ?? "",
    channel: nextRelease?.channel,
    notes: nextRelease?.notes ?? "",
    packageName: config.packageName,
    repositoryUrl: options?.repositoryUrl ?? "",
    commits: commits ?? [],
  };

  const content = resolveTemplate(config.successMessage, templateCtx);

  const title =
    config.messageType === "post"
      ? resolveTemplate(config.successTitle, templateCtx)
      : undefined;

  return { content: truncate(content), title };
}

export function formatFailMessage(
  config: ResolvedConfig,
  context: Context
): MessagePayload {
  const errors = context.errors ?? [];
  const formattedErrors = errors
    .map((e) => `- **${e.message}**`)
    .join("\n");

  const templateCtx: FailTemplateContext = {
    packageName: config.packageName,
    repositoryUrl: context.options?.repositoryUrl ?? "",
    errors,
  };

  let content: string;
  if (typeof config.failMessage === "function") {
    content = config.failMessage(templateCtx);
  } else {
    content = interpolate(config.failMessage, {
      packageName: config.packageName,
      repositoryUrl: context.options?.repositoryUrl ?? "",
      errors: formattedErrors,
    });
  }

  let title: string | undefined;
  if (config.messageType === "post") {
    if (typeof config.failTitle === "function") {
      title = config.failTitle(templateCtx);
    } else {
      title = interpolate(config.failTitle, {
        packageName: config.packageName,
      });
    }
  }

  return { content: truncate(content), title };
}

function resolveTemplate(
  template: string | ((ctx: TemplateContext) => string),
  ctx: TemplateContext
): string {
  if (typeof template === "function") {
    return template(ctx);
  }
  return interpolate(template, {
    version: ctx.version,
    gitTag: ctx.gitTag,
    channel: ctx.channel ?? "",
    notes: ctx.notes,
    packageName: ctx.packageName,
    repositoryUrl: ctx.repositoryUrl,
  });
}

function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(
    /\$\{(\w+)\}/g,
    (_, key: string) => vars[key] ?? ""
  );
}

export function truncate(
  text: string,
  maxLength: number = MAX_CONTENT_LENGTH
): string {
  if (text.length <= maxLength) return text;

  const cutoff = maxLength - TRUNCATION_MARKER.length;
  const truncated = text.slice(0, cutoff);

  // Try to break at a line boundary
  const lastNewline = truncated.lastIndexOf("\n");
  if (lastNewline > cutoff * 0.5) {
    return truncated.slice(0, lastNewline) + TRUNCATION_MARKER;
  }

  return truncated + TRUNCATION_MARKER;
}
