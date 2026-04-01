# Incident Response Copilot

An AI-powered incident response tool that helps engineers diagnose outages,
track actions, and generate postmortems — built entirely on Cloudflare.

![Architecture Diagram](./docs/architecture.png)

## How It Works

1. Paste an error log, describe symptoms, or share a system alert.
2. The copilot analyzes the input and returns a diagnosis, severity,
   and prioritized action plan.
3. As you investigate, the copilot remembers prior context and refines
   its hypothesis.
4. When the incident is resolved, generate a structured postmortem
   with one click.

## Architecture

| Component | Cloudflare Service | Purpose |
|---|---|---|
| LLM | Workers AI (Llama 3.3 70B) | Diagnosis, analysis, postmortem writing |
| Coordination | Durable Objects | Per-incident stateful session management |
| Workflows | Cloudflare Workflows | Multi-step postmortem generation pipeline |
| Frontend | Cloudflare Pages + React | Chat UI, sidebar, action tracking |
| Memory (short-term) | Durable Object storage | Conversation history, hypothesis, actions |
| Memory (long-term) | D1 + Vectorize (optional) | Incident history, runbook retrieval |

## Assignment Mapping

| Requirement | Implementation |
|---|---|
| **LLM** | Workers AI running `@cf/meta/llama-3.3-70b-instruct-fp8-fast` for all inference |
| **Workflow / Coordination** | Cloudflare Workflows for postmortem pipeline; Durable Objects for session orchestration |
| **User Input** | Chat-based React UI on Cloudflare Pages |
| **Memory / State** | Durable Objects persist conversation, hypothesis, actions, and findings per session |

## Project Structure
apps/web/          → React frontend (Cloudflare Pages)
workers/api/       → API Worker (routes, LLM calls, orchestration)
workers/state/     → Durable Object (incident session state)
workflows/postmortem/ → Workflow (multi-step postmortem generation)

## Local Development
```bash
# Install dependencies
npm install

# Run the API worker locally
cd workers/api && npx wrangler dev

# Run the frontend locally
cd apps/web && npm run dev
```

## Deployment
```bash
# Deploy in order: state → workflow → api → frontend
cd workers/state && npx wrangler deploy
cd workflows/postmortem && npx wrangler deploy
cd workers/api && npx wrangler deploy
cd apps/web && npm run build && npx wrangler pages deploy dist --project-name incident-copilot
```

## Screenshots
<img width="2864" height="1632" alt="incident-reponse" src="https://github.com/user-attachments/assets/2e10f839-7248-4c28-b0c7-612afc5d435c" />

