# Lovelace Forge → CLI Port (Dev Build-Off qualification)

Goal: recreate this app as a CLI-created Base44 project (`npx base44 create`) so it
qualifies for the Dev Build-Off 2026 (backend must be CLI-created, built July 21–28).
This repo is already file-based — everything below is copy-paste.

## 1. Create the new project (on your machine)

```bash
npm install -g base44@latest
base44 login
npx base44 create lovelace-forge --path ./lovelace-forge --template backend-and-client
```

## 2. Copy files from THIS repo into the new project

Backend (copy as-is):
- `base44/entities/` — all .jsonc files (Project, GameDevTask, CodeArtifact,
  BridgeSession, BridgeCommandLog, Conversation, Message, ConsultSession,
  ModelResponse, ModelProvider, UserProfile, User)
- `base44/functions/` — all 6 functions:
  chat_completion, generate_code, generate_game_dev_plan,
  start_consult, synthesize_consult, unity_bridge_relay
- `base44/shared/groq.ts` — imported by several functions; must come along

Frontend (replace the template's src/ with this repo's):
- `src/` (entire directory)
- `index.html`, `tailwind.config.js`, `postcss.config.js`, `components.json`,
  `jsconfig.json`, `vite.config.js`, `package.json`
- `unity-bridge/` — the Unity editor package (not deployed, but keep it in the
  repo; judges verify the bridge story)

Do NOT copy: `base44/.app.jsonc` from this repo (the new project generates its
own — that new App ID is what you submit).

## 3. Secrets on the NEW app

Set in the new app's dashboard (Settings → Secrets) or via CLI:
- `GROQ_API_KEY` — same Groq key as now
- `UNITY_BRIDGE_API_KEY` — your bridge bearer token
  (note: the running Kizuna bridge currently accepts
  `kizuna-bridge-secret-change-me`; align bridge + secret before the demo)

## 4. Seed data (does NOT copy automatically)

The council needs ModelProvider records. After deploy, recreate them in the new
app (dashboard → Data → ModelProvider). Exact rows to recreate:

| name | model_id | priority |
|---|---|---|
| Llama 3.3 70B | llama-3.3-70b-versatile | 1 |
| Llama 3.1 8B (fast) | llama-3.1-8b-instant | 2 |
| Mixtral / GPT-OSS 20B | openai/gpt-oss-20b | 3 |

All three: provider_type=groq, api_base_url=`https://api.groq.com/openai/v1/chat/completions`,
enabled=true, max_tokens=2048, temperature_default=0.7.

Everything else (conversations, projects, tasks) is your own usage data — start
fresh; it also proves the app was built in-window.

## 5. Deploy + verify

```bash
cd lovelace-forge
npx base44 deploy        # pushes entities + functions, gives the new App ID
npm install && npm run dev   # verify frontend locally, then publish
```

Smoke test: register → chat replies → Council consult completes → generate code
in a project → Connect Unity registers the tunnel.

## 6. Submission checklist (portal, by July 28 11:59 p.m. PT)

- [ ] Live URL of the new app
- [ ] Backend-features checklist — claim: auth/user management, entities (11+),
      backend functions (6), AI/LLM (Groq council + synthesis), file storage
- [ ] BaaS feedback form (required to qualify; also eligible for the
      Feedback Recognition)
- [ ] Public GitHub repo of the new project (SDK markers visible) — recommended
- [ ] 2–3 min demo video (lead with the live Unity bridge) — recommended