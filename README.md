# semantic-release-clickup

[semantic-release](https://github.com/semantic-release/semantic-release) plugin to announce releases to a ClickUp chat channel.

## Install

```bash
pnpm add -D @kozyops/semantic-release-clickup
```

## Usage

Add the plugin to your semantic-release configuration:

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    ["@kozyops/semantic-release-clickup", {
      "workspaceId": "12345678",
      "channelId": "abc-def-123"
    }]
  ]
}
```

Set the `CLICKUP_TOKEN` environment variable to your ClickUp personal API token (starts with `pk_`). You can create one at **Settings > Apps** in ClickUp.

## Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `CLICKUP_TOKEN` | Yes | ClickUp personal API token (`pk_...`) |
| `CLICKUP_WORKSPACE_ID` | Fallback | Workspace ID (if not set in plugin config) |
| `CLICKUP_CHANNEL_ID` | Fallback | Channel ID (if not set in plugin config) |

### Plugin Options

| Option | Type | Default | Description |
|---|---|---|---|
| `workspaceId` | `string` | `$CLICKUP_WORKSPACE_ID` | ClickUp workspace ID |
| `channelId` | `string` | `$CLICKUP_CHANNEL_ID` | Chat channel ID to post to |
| `messageType` | `"post" \| "message"` | `"message"` | Message type. `"post"` includes a title, but ClickUp may reject post payloads without workspace-specific post metadata. |
| `notifyOnSuccess` | `boolean` | `true` | Send a message on successful release |
| `notifyOnFail` | `boolean` | `false` | Send a message on release failure |
| `packageName` | `string` | `npm_package_name` | Package name used in messages |
| `successTitle` | `string \| function` | `"Released ${packageName} v${version}"` | Title for success post |
| `successMessage` | `string \| function` | See below | Body template for success |
| `failTitle` | `string \| function` | `"Release failed: ${packageName}"` | Title for failure post |
| `failMessage` | `string \| function` | See below | Body template for failure |

### Template Variables

String templates support `${variable}` interpolation:

**Success templates:** `${version}`, `${gitTag}`, `${channel}`, `${notes}`, `${packageName}`, `${repositoryUrl}`

**Fail templates:** `${packageName}`, `${repositoryUrl}`, `${errors}`

### Function Templates

For full control, pass a function instead of a string:

```js
["@kozyops/semantic-release-clickup", {
  workspaceId: "12345678",
  channelId: "abc-def-123",
  successMessage: ({ version, commits, packageName }) =>
    `**${packageName}** v${version} shipped with ${commits.length} commits!`,
}]
```

## Finding Your Workspace & Channel IDs

**Workspace ID:** Look at your ClickUp URL — `https://app.clickup.com/{workspace_id}/home`

**Channel ID:** Use the ClickUp API to list channels:

```bash
curl -H "Authorization: $CLICKUP_TICKET_SKILL_TOKEN" \
  "https://api.clickup.com/api/v3/workspaces/YOUR_WORKSPACE_ID/chat/channels"
```

## Examples

### Minimal (env vars only)

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@kozyops/semantic-release-clickup", {}]
  ]
}
```

```bash
CLICKUP_TOKEN=pk_... CLICKUP_WORKSPACE_ID=123 CLICKUP_CHANNEL_ID=abc pnpm exec semantic-release
```

### With failure notifications

```json
["@kozyops/semantic-release-clickup", {
  "workspaceId": "12345678",
  "channelId": "abc-def-123",
  "notifyOnFail": true
}]
```

### Plain message (no title)

```json
["@kozyops/semantic-release-clickup", {
  "workspaceId": "12345678",
  "channelId": "abc-def-123",
  "messageType": "message"
}]
```

### Post messages

ClickUp post payloads can require workspace-specific post metadata. If a `post` payload is rejected by ClickUp, this plugin automatically retries it as a plain `message` so releases do not fail on chat formatting alone.

## Lifecycle Hooks

| Hook | Description |
|---|---|
| `verifyConditions` | Validates token, workspace ID, and channel ID are set |
| `success` | Sends release announcement to the configured channel |
| `fail` | Sends failure notification (if `notifyOnFail` is enabled) |

## Notes

- Messages are formatted as Markdown (`text/md`)
- ClickUp has a 980-character limit on message content; release notes are automatically truncated
- The `fail` hook swallows notification errors to avoid masking the original release failure
- The ClickUp Chat API is experimental and subject to change

## Releases

This repo is configured to run `semantic-release` from GitHub Actions on pushes to `master`.

Required GitHub Actions secrets:

- `NPM_TOKEN` for publishing to npm

The release workflow:

- runs tests and a production build on Node 22
- creates a GitHub release and generates the npm tarball
- pushes that tarball to npm in a dedicated pnpm-based CI job only when semantic-release publishes a new release
- uploads the generated npm tarball as a GitHub release asset

## License

MIT
