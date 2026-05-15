# BridgedAI Evaluate Policy (`bridgedai-devsecops/evaluate-policy-action`)

## What this action does

Calls BridgedAI policy evaluation (`POST /api/v1/release-gates/evaluate`) in production, or returns deterministic mock decisions in `mode: mock`.

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

