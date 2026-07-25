# 🔥 Lovelace Forge

> **An AI that builds games with you — inside your Unity editor.**
> Named for Ada Lovelace, who wrote the world's first algorithm in 1843 and imagined machines that could create.

**Base44 Dev Build-off 2026 Entry** · App ID: `69f8a0352756110b9a8a3e08`

Lovelace Forge is a senior-Unity-engineer AI companion. It connects to your **live Unity editor**, sees your scenes, writes and runs your C#, plans your project, and — its signature move — **consults a council of AI models in parallel and synthesizes their answers into one authoritative response**.

---

## ✨ What it does

| Feature | Description |
|---|---|
| 🧠 **Consult the Council** | Fans a question out to multiple LLMs in parallel, then a synthesis pass integrates their answers into one best answer — noting agreement and resolving conflicts. |
| 💬 **AI chat companion** | Genre-aware Unity game-dev assistant with conversation history and per-genre playbooks. |
| ⌨️ **Live Unity bridge** | Executes generated C# in the user's running Unity editor over a secure Cloudflare tunnel. |
| 🛠️ **Code & plan generation** | Generates C# scripts, shaders, and full game-dev task plans as first-class artifacts. |
| 🧭 **Forge Sage** | An onboarding guide that walks first-time users through connecting Unity, step by step. |

---

## 🏗️ Base44 Backend Usage

This project leans **heavily** on the Base44 backend — well beyond the 2-capability minimum.

### 1. Authentication & user management
Email/password + Google OAuth, admin/user roles, and **every backend function is auth-gated** (`base44.auth.me()` → 401 otherwise).

### 2. Database / entities (12 entities, all with Row-Level Security)
`Conversation`, `Message`, `ConsultSession`, `ModelResponse`, `Project`, `GameDevTask`, `CodeArtifact`, `BridgeSession`, `BridgeCommandLog`, `UserProfile`, `ModelProvider`, plus the built-in `User`. Each record is scoped to its owner via RLS — one user can never read another's data.

### 3. Backend functions (7)
| Function | Role |
|---|---|
| `chat_completion` | Main AI chat with conversation history |
| `start_consult` | **Parallel multi-model orchestration** — the Council |
| `synthesize_consult` | Merges council answers into one synthesis |
| `generate_code` | C# / shader artifact generation |
| `generate_game_dev_plan` | Structured project task planning |
| `unity_bridge_relay` | Secure relay that runs C# in the live Unity editor |
| `sageHelp` | Onboarding assistant |

### 4. AI / LLM orchestration
Real parallel fan-out to multiple models (`Promise.allSettled`) with live per-model status rows, followed by a synthesis pass — configurable via the `ModelProvider` entity.

### 5. File & media storage
Image generation and upload flow through Base44's storage integrations.

### 🔎 SDK markers (for verification)
- Frontend: `@/api/base44Client` initialized via `@base44/sdk` (`createClient`), used as `base44.entities.*`, `base44.auth.*`, `base44.functions.invoke(...)`, `base44.integrations.Core.*`.
- Backend functions: `createClientFromRequest` from `@base44/sdk`, RLS-scoped entity access, and service-role usage where appropriate.

---

## 🎮 Custom frontend surfaces

Beyond a standard React web app, Lovelace Forge ships a **Unity Editor integration** (`unity-bridge/`) — a C# editor plugin that opens a local HTTP bridge, tunneled to the backend, so the AI can execute code directly in the creator's editor. That non-web surface is the novelty.

---

## 🚀 Run Locally

```bash
git clone <repo-url>
cd lovelace-forge
npm install
npm install -g base44@latest
base44 dev
```

`base44 dev` starts the local Base44 backend and the Vite frontend. For frontend-only work against the hosted backend, create `.env.local`:

```bash
VITE_BASE44_APP_ID=69f8a0352756110b9a8a3e08
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

### Secrets (backend)
Set in the Base44 dashboard — not committed:
- `GROQ_API_KEY` — powers all LLM calls (chat, council, synthesis, Sage)
- `UNITY_BRIDGE_API_KEY` — authenticates the Unity editor bridge

---

## 🔌 Connecting Unity

See `unity-bridge/README.md`. In short: drop the bridge `.cs` file into `Assets/Editor/`, start the bridge, run a Cloudflare tunnel to `http://127.0.0.1:9876`, and paste the tunnel URL into **Connect Unity** in the app.

---

## 🧱 Tech stack

React + Vite · Tailwind CSS · Framer Motion · Base44 BaaS (auth, entities, functions, storage) · Deno backend functions · Groq LLMs · Unity C# editor bridge · Cloudflare Tunnel.

---

## 📚 Docs & Support

- Base44 CLI: https://docs.base44.com/developers/references/cli/commands/introduction
- Support: https://app.base44.com/support

Built for the **Base44 Dev Build-off 2026**. Born from community. Built for humanity.