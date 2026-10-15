# Neon Orb Native Runtime

Neon Orb is represented by one resident runtime inside the Neon Player X Node.js process. The browser calls the same-origin `/api/neon-orb/think` endpoint; it no longer calls the separate local LLM bridge directly. The runtime owns request orchestration, recent persistent cognitive memory, runtime heartbeat, and the fallback inference path. When `NEON_LLM_API_KEY` is configured, model inference is used as a capability invoked by Neon Orb rather than as a separately addressed agent.

## Runtime endpoints

- `GET /api/neon-orb/status`: reports resident runtime health and the existing economic governor snapshot.
- `POST /api/neon-orb/think`: accepts `message`, `context`, `event`, and `session`; returns advice, reflection, proposed intent, and a persistent memory receipt.

The runtime persists its state in `data/neon-orb-runtime.json` (override with `NEON_ORB_STATE_FILE`). A heartbeat records that the runtime loop is alive; it is not represented as completed work, income, or a network transaction.

## Inference configuration

- `NEON_LLM_API_KEY`: optional API key for an OpenAI-compatible inference endpoint.
- `NEON_LLM_BASE_URL`: optional chat-completions URL; defaults to the OpenAI-compatible endpoint.
- `NEON_LLM_MODEL`: optional model name.

Without an inference key, Neon Orb remains operational using the native local fallback. With a key, failed inference requests fall back locally. The browser never receives the key.

## Operational boundaries

Neon Orb is the application identity and coordinator; provider adapters, wallet/network bridges, and the existing economic governor remain capabilities used by that runtime. A proposed intent is not proof of execution. Existing authorization, network verification, settlement checks, and economic limits remain in force. Actual external work and income must be confirmed by the relevant existing bridge before they are reported as completed.

## Run and test

```sh
npm install
npm start
npm test
```

The repository's original bridge scripts, state files, wallet/key material, environment file, and economic modules are retained in the delivered archive. Handle that archive as sensitive because it contains the original configuration and key material.
