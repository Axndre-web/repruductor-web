# NEON ORB — private agent operations

The companion chat now calls `/api/neon-orb/agent/chat` first, allowing the local OpenAI-compatible model to use the existing bounded tool set: public research, job lead discovery, GitHub search, static audit, project file inspection, fixed tests, isolated proposals, guarded source edits with backup/test rollback, and integrated radio control.

## Privacy and access

- By default the server binds to `127.0.0.1`. The companion agent endpoint additionally requires loopback and same-origin requests.
- If `NEON_ALLOW_LAN_ACCESS=true`, the agent endpoint requires the strong `NEON_ADMIN_TOKEN` bearer token. Do not expose the server to a public network.
- The local model endpoint defaults to Ollama-compatible `http://127.0.0.1:11434/v1/chat/completions`. Install/start a compatible local model and configure `NEON_AGENT_MODEL` to match it. Remote providers require HTTPS, an exact hostname allowlist and an API key.
- If the model is offline or unavailable, the UI falls back to the native runtime and explicitly marks the turn as degraded; no tool use is claimed in that case.
- Existing restrictions remain: no arbitrary shell commands, no reading secrets, no transaction signing/broadcasting, no money movement, no remote target scanning, and no job applications. External/economic actions remain under the existing controls and verifiers.

## Start and validate

Run `npm install` once if dependencies are absent, then `npm start`. Run `npm test` to validate the suite. A passing automated suite does not by itself prove that the local model is installed or running; verify `/api/neon-orb/agent/status` and the companion's mode indicator on the actual machine.
