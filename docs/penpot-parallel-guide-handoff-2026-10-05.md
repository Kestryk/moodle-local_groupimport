# Penpot concurrency - independent Guide connection

Platform batch EED-UI-2026-0073. Guide source work is already started in a
parallel window, but the user confirms it is not using Penpot yet. The earlier
assumption that Guide owned/blocked this connection was incorrect.

## Verified situation

- This window's exposed hosted Penpot tools have no session-ID parameter.
  Foundations and then EasyStud page 03 identities were verified for this
  window's scoped publication. No hosted token has been changed.
- Official develop documentation describes explicit per-file session IDs and
  simultaneous tabs. This is not proof that our deployed tool schema supports
  selecting them. Merely duplicating the same hosted URL in two clients cannot
  demonstrate independent routing in this installation.
- npm reports stable/latest @penpot/mcp 2.15.4, next 2.17.0. Do not install the
  development/next version to guess compatibility.
- Loopback ports 4400/4401/4402 were free at inspection. The existing dedicated
  browser is on 9225. Do not stop it or take its authenticated profile.
- Codex supports separately named MCP connections; a new connection may need
  the Guide client's extension/session restart. Configuration is shared across
  clients, so adding a name alone is not a file-ownership guarantee.

## Proposed isolated arrangement (not installed/tested yet)

Keep this window on the existing hosted `penpot` connection. Give Guide a local
server and a separately named client entry, `penpot_guide`. Run the official
released package in a dedicated terminal:

```powershell
npx -y @penpot/mcp@2.15.4
```

Connect only the Guide design tab to its local plugin loaded from
`http://localhost:4400/manifest.json`, and configure Guide's client connection:

```toml
[mcp_servers.penpot_guide]
url = "http://localhost:4401/mcp"
```

Do not replace `[mcp_servers.penpot]`, copy its URL/token into logs, regenerate
the key, disable hosted MCP, or restart the implementation client's browser.
The Guide owner performs its client-specific setup/reconnect. If local network
permission is required, the user approves that browser prompt; do not disable
browser security to bypass it.

Before any write, each owner records its server name and reads file ID/name,
page ID/name through its own tools. Then change Guide's page and prove the
hosted connection still reads Foundations; change the hosted page and prove
Guide's local connection still reads Guide. Without this crossed readback,
the proposed isolation is unverified. Abort a write on any unexpected file.

Separate transport does not authorize simultaneous edits to the same file or
shared Foundation component. Guide owns its project; this window owns the
bounded card/header Foundation lot. Share required Foundation changes by named
handoff and serialize them. Shared Moodle preview likewise retains its lease.

## Prompt for the Guide window

> Continue your existing Guide source work. This implementation window keeps
> the current hosted Penpot connection and the existing browser. You may prepare
> a separate official local MCP, named penpot_guide, for your own Guide tab;
> do not use the hosted penpot tools or change their token/configuration. Follow
> the released-package and loopback setup above. Do not edit our worktrees,
> existing authenticated browser profile, or shared Foundation components.
> First verify your file read-only, then request a crossed identity readback
> from the implementation window. Only after that proof may you edit your own
> Guide project. Report any configuration/restart permission needed explicitly;
> do not claim the concurrent setup is already installed or tested.

## Sources checked

- [Penpot hosted/local setup](https://help.penpot.app/mcp/)
- [Official Penpot develop multi-file documentation](https://github.com/penpot/penpot/blob/develop/docs/mcp/index.md)
- [Official released local-server setup](https://github.com/penpot/penpot/blob/develop/mcp/README.md)
- [OpenAI Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)

This is a safe setup/handoff proposal, not a completed concurrent-runtime test.
No MCP server, global client configuration or Guide design was modified here.
