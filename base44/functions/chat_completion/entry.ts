import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { GENRE_PLAYBOOKS } from '../../shared/genreKnowledge.ts';
import { getBridge, runOnBridge } from '../../shared/bridge.ts';

const SYSTEM_PROMPT =
  "You are Lovelace Forge — a warm, brilliant AI companion and senior AAA game-development engineer with PhD-level mastery of Unity (all modern versions). You help developers across every discipline of game development: gameplay systems and architecture, C# scripting, physics, animation, shaders and rendering, UI, audio, AI behavior, optimization, and shipping. You adapt to whatever genre and frameworks the developer's project uses. You are encouraging and human in tone but precise and rigorous in engineering. Born from community, built for humanity. When unsure on a hard technical question, you can suggest 'consulting the council' (a multi-model second opinion).\n" +
  GENRE_PLAYBOOKS;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MODEL_SOURCE = "groq/llama-3.3-70b-versatile";
const HISTORY_LIMIT = 20;

// The read commands the Forge Bridge CodeRunner understands as bare words.
const BRIDGE_READ_COMMANDS = [
  "scene.info",
  "scene.hierarchy",
  "selection.info",
  "assets.count",
  "editor.info",
];

// The write tools the bridge can execute in the live editor.
const BRIDGE_WRITE_TOOLS = [
  "object.create",
  "component.add",
  "object.rename",
  "object.delete",
  "object.move",
  "script.create",
  "script.attach",
];

type BridgeAction = { kind: "read"; command: string } | { kind: "write"; tool: string; args: any };

// Ask the model whether this user turn needs the live Unity editor, and if so
// what to run. Returns a read command, a write tool call, or null. Deterministic
// (temperature 0) so it's a fast, cheap router — not a chat turn. The model
// replies with a strict JSON object we validate before trusting.
async function routeBridgeAction(groqKey: string, userMessage: string): Promise<BridgeAction | null> {
  const routerSystem =
    "You convert a game developer's message into a Unity editor bridge action, or NONE. " +
    "Reply with ONLY a single minified JSON object, no prose.\n\n" +
    "READ actions — { \"kind\": \"read\", \"command\": \"<one of>\" }:\n" +
    "  scene.info | scene.hierarchy | selection.info | assets.count | editor.info\n\n" +
    "WRITE actions — { \"kind\": \"write\", \"tool\": \"<tool>\", \"args\": { ... } }:\n" +
    "  object.create  args: { type: cube|sphere|capsule|plane|cylinder|quad, name?, parent?, x?, y?, z? }\n" +
    "  component.add  args: { target: <object name>, component: <e.g. Rigidbody, BoxCollider, Light> }\n" +
    "  object.rename  args: { target: <name>, name: <new name> }\n" +
    "  object.delete  args: { target: <name> }\n" +
    "  object.move    args: { target: <name>, x, y, z }\n" +
    "  script.create  args: { script: <ClassName>, code?: <full C# MonoBehaviour source> }\n" +
    "  script.attach  args: { target: <name>, script: <ClassName> }\n\n" +
    "Rules: default position to 0,0,0 if unspecified. For a floor/ground use type plane. " +
    "For a player use type capsule named 'Player' unless told otherwise. " +
    "If the user asks a general question, wants advice, or wants code explained (not placed in the " +
    "scene), reply exactly {\"kind\":\"none\"}. Only choose an action when the user clearly wants to " +
    "read from or change their actual open Unity scene/project.";
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: routerSystem },
          { role: "user", content: userMessage },
        ],
        temperature: 0,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = (json?.choices?.[0]?.message?.content || "").trim();
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return null; }
    if (!parsed || parsed.kind === "none") return null;
    if (parsed.kind === "read" && BRIDGE_READ_COMMANDS.includes(parsed.command)) {
      return { kind: "read", command: parsed.command };
    }
    if (parsed.kind === "write" && BRIDGE_WRITE_TOOLS.includes(parsed.tool)) {
      return { kind: "write", tool: parsed.tool, args: parsed.args || {} };
    }
    return null;
  } catch {
    return null;
  }
}

// Serializes a bridge action into the "code" string the bridge expects: a bare
// word for reads, or a JSON envelope { tool, args } for writes (args is itself a
// JSON string, matching the CodeRunner Envelope/Args contract).
function actionToCode(action: BridgeAction): string {
  if (action.kind === "read") return action.command;
  return JSON.stringify({ tool: action.tool, args: JSON.stringify(action.args || {}) });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const conversationId = body?.conversation_id;
    const userMessage = body?.user_message;

    if (!conversationId || typeof userMessage !== "string" || !userMessage.trim()) {
      return Response.json(
        { error: "conversation_id and a non-empty user_message are required" },
        { status: 400 }
      );
    }

    // Verify the conversation exists and belongs to this user (RLS enforces ownership).
    const conversation = await base44.entities.Conversation.get(conversationId).catch(() => null);
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Recent history (newest first) → reverse to oldest→newest for context.
    const recent = await base44.entities.Message.filter(
      { conversation_id: conversationId },
      "-created_date",
      HISTORY_LIMIT
    );
    const ordered = [...(recent || [])].reverse();

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      return Response.json(
        { error: "Groq API key is not configured. Set GROQ_API_KEY in the app secrets." },
        { status: 500 }
      );
    }

    // If this turn is about the live editor, reach through the bridge to the
    // user's Unity — either READING the scene or actually CHANGING it — and fold
    // the REAL output into the model's context so Lovelace answers from (and
    // reports on) the actual editor instead of guessing.
    let bridgeContext = "";
    const action = await routeBridgeAction(groqKey, userMessage);
    if (action) {
      const bridge = await getBridge(base44).catch(() => null);
      if (bridge?.tunnel_url && bridge.status === "connected") {
        const label = action.kind === "read" ? action.command : action.tool;
        const out = await runOnBridge(bridge.tunnel_url, actionToCode(action));
        if (out?.success) {
          if (action.kind === "read") {
            bridgeContext =
              `LIVE UNITY EDITOR OUTPUT (command \`${label}\`), read moments ago from the user's actual open project. ` +
              `Answer using THIS real data — do not tell the user to go look themselves:\n\n` +
              String(out.result ?? "").slice(0, 4000);
          } else {
            bridgeContext =
              `You just performed the action \`${label}\` on the user's LIVE Unity editor and it SUCCEEDED. ` +
              `Bridge result:\n\n${String(out.result ?? "").slice(0, 2000)}\n\n` +
              `Confirm to the user in one or two friendly sentences what you changed in their scene, ` +
              `and suggest the natural next step. Do NOT paste code or tell them to do it manually — it is already done.`;
          }
        } else {
          bridgeContext =
            `You attempted to ${action.kind === "read" ? "read" : "change"} the user's live Unity editor (\`${label}\`) but the bridge call failed: ` +
            `${out?.error || "unknown error"}. Briefly tell the user the editor couldn't be reached and to check the tunnel/bridge, then help as best you can.`;
        }
      } else {
        bridgeContext =
          `The user wants you to work in their live Unity editor, but no connected bridge is available. ` +
          `Tell them to connect Unity (Connect Unity page) so you can read and modify their scene directly, then help generally.`;
      }
    }

    const messages = [{ role: "system", content: SYSTEM_PROMPT }];
    for (const m of ordered) {
      const role = m.role === "user" ? "user" : "assistant";
      const content = m.content || "";
      if (content) messages.push({ role, content });
    }
    if (bridgeContext) messages.push({ role: "system", content: bridgeContext });
    messages.push({ role: "user", content: userMessage });

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => "");
      return Response.json(
        { error: `Groq API error (${groqRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    const groqJson = await groqRes.json();
    const reply =
      (groqJson?.choices?.[0]?.message?.content || "").trim();

    if (!reply) {
      return Response.json(
        { error: "The model returned an empty response." },
        { status: 502 }
      );
    }

    // Persist the user's message and Lovelace's reply on success.
    await base44.entities.Message.create({
      conversation_id: conversationId,
      role: "user",
      content: userMessage,
    });
    await base44.entities.Message.create({
      conversation_id: conversationId,
      role: "assistant",
      content: reply,
      model_source: MODEL_SOURCE,
    });

    // Keep the conversation preview fresh.
    const preview = (reply.length > userMessage.length ? reply : userMessage).slice(0, 120);
    await base44.entities.Conversation.update(conversationId, {
      last_message_preview: preview,
    });

    return Response.json({ reply, model_source: MODEL_SOURCE });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
});