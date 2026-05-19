# BridgedAI Evaluate Policy (`bridgedai-devsecops/evaluate-policy-action`)

## What this action does

Calls the public BridgedAI release gate API (`POST /v1/enforcement/release-gate/evaluate` on **`https://api.bridgedai.io`**) with the OIDC access token from `auth-action`, or returns deterministic mock decisions in `mode: mock`.

## Why BridgedAI exists

Policy decisions should be evidence-backed and centrally auditable.

## Quick start

See `examples/basic.yml`.

## Enterprise setup

Store `api-url` in org variables; prefer OIDC-based auth upstream.

## Inputs / outputs

See `action.yml`.

## Mock mode

Mock supports deterministic outcomes via policy strings like `demo:BLOCK`, `demo:WARN`, otherwise defaults to `ALLOW`.

## Support

Use your BridgedAI support channel.

