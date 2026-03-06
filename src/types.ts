export interface PluginConfig {
  channelId?: string;
  workspaceId?: string;
  messageType?: "post" | "message";
  notifyOnSuccess?: boolean;
  notifyOnFail?: boolean;
  packageName?: string;
  successTitle?: string | ((context: TemplateContext) => string);
  successMessage?: string | ((context: TemplateContext) => string);
  failTitle?: string | ((context: FailTemplateContext) => string);
  failMessage?: string | ((context: FailTemplateContext) => string);
}

export interface ResolvedConfig {
  clickupToken: string;
  workspaceId: string;
  channelId: string;
  messageType: "post" | "message";
  notifyOnSuccess: boolean;
  notifyOnFail: boolean;
  packageName: string;
  successTitle: string | ((context: TemplateContext) => string);
  successMessage: string | ((context: TemplateContext) => string);
  failTitle: string | ((context: FailTemplateContext) => string);
  failMessage: string | ((context: FailTemplateContext) => string);
}

export interface TemplateContext {
  version: string;
  gitTag: string;
  channel: string | undefined;
  notes: string;
  packageName: string;
  repositoryUrl: string;
  commits: Commit[];
}

export interface FailTemplateContext {
  packageName: string;
  repositoryUrl: string;
  errors: SemanticReleaseErrorLike[];
}

export interface MessagePayload {
  content: string;
  title?: string;
}

export interface Commit {
  hash: string;
  subject: string;
  body?: string;
  author?: { name: string; email: string };
}

export interface SemanticReleaseErrorLike {
  message: string;
  code?: string;
}

export interface NextRelease {
  version: string;
  gitHead: string;
  gitTag: string;
  channel?: string;
  notes: string;
}

export interface Release {
  version: string;
  gitTag: string;
  notes: string;
  name?: string;
  url?: string;
  channel?: string;
  pluginName?: string;
}

export interface Logger {
  log: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
}

export interface Context {
  cwd: string;
  env: Record<string, string | undefined>;
  branch: { name: string };
  logger: Logger;
  options?: { repositoryUrl?: string };
  nextRelease?: NextRelease;
  commits?: Commit[];
  releases?: Release[];
  errors?: SemanticReleaseErrorLike[];
}
