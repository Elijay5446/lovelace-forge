import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { GENRE_PLAYBOOKS } from '../../shared/genreKnowledge.ts';
import { getBridge, runOnBridge, runActionsOnBridge, resultLooksFailed } from '../../shared/bridge.ts';
import { resolveGroqKey } from '../../shared/groq.ts';

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
  "object.inspect",
];

// The write tools the bridge can execute in the live editor.
const BRIDGE_WRITE_TOOLS = [
  "object.create",
  "object.empty",
  "component.add",
  "object.rename",
  "object.delete",
  "object.move",
  "object.scale",
  "object.rotate",
  "object.parent",
  "object.duplicate",
  "object.color",
  "object.light",
  "camera.frame",
  "property.set",
  "script.create",
  "script.attach",
  "scene.save",
  "editor.play",
];

type BridgeAction =
  | { kind: "read"; command: string; args?: any }
  | { kind: "write"; tool: string; args: any };

// Validates a single raw action object from the model against the known
// read/write vocabulary. Returns a clean BridgeAction or null.
function validateAction(parsed: any): BridgeAction | null {
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.kind === "read" && BRIDGE_READ_COMMANDS.includes(parsed.command)) {
    return { kind: "read", command: parsed.command, args: parsed.args || {} };
  }
  if (parsed.kind === "write" && BRIDGE_WRITE_TOOLS.includes(parsed.tool)) {
    return { kind: "write", tool: parsed.tool, args: parsed.args || {} };
  }
  return null;
}

// Ask the model whether this user turn needs the live Unity editor, and if so
// what to run. A single message often implies SEVERAL editor actions ("create a
// plane, scale it, and color it") — so the router returns an ORDERED LIST of
// actions, which we run in sequence on the bridge. Returns [] when the turn is
// pure conversation. Deterministic (temperature 0): a fast, cheap router, not a
// chat turn. The model replies with strict JSON we validate before trusting.
async function routeBridgeActions(groqKey: string, userMessage: string): Promise<BridgeAction[]> {
  const routerSystem =
    "You convert a game developer's message into an ORDERED LIST of Unity editor bridge actions. " +
    "Reply with ONLY a single minified JSON object of the form {\"actions\":[ ... ]}, no prose. " +
    "One message often means SEVERAL actions — e.g. 'create a plane, scale it 4,1,4 and color it #111114' " +
    "becomes THREE actions: object.create, then object.scale, then object.color on that same object. " +
    "Break the request into every atomic action needed and list them in the order they must run. " +
    "You have FULL command of the user's live Unity editor through these tools — prefer acting over explaining.\n\n" +
    "READ actions — { \"kind\": \"read\", \"command\": \"<one of>\", \"args\": { ... } }:\n" +
    "  scene.info | scene.hierarchy | selection.info | assets.count | editor.info  (no args)\n" +
    "  object.inspect  args: { target: <object name> }  — full transform + component list\n\n" +
    "WRITE actions — { \"kind\": \"write\", \"tool\": \"<tool>\", \"args\": { ... } }:\n" +
    "  object.create   args: { type: cube|sphere|capsule|plane|cylinder|quad, name?, parent?, x?, y?, z? }\n" +
    "  object.empty    args: { name?, parent?, x?, y?, z? }  — empty GameObject (great as a container)\n" +
    "  component.add   args: { target, component: <e.g. Rigidbody, BoxCollider, AudioSource> }\n" +
    "  object.rename   args: { target, name: <new name> }\n" +
    "  object.delete   args: { target }\n" +
    "  object.move     args: { target, x, y, z }  — world position\n" +
    "  object.scale    args: { target, x, y, z }  — local scale\n" +
    "  object.rotate   args: { target, x, y, z }  — euler angles in degrees\n" +
    "  object.parent   args: { target, parent }  — omit parent to un-parent to root\n" +
    "  object.duplicate args: { target, name?, x?, y?, z? }\n" +
    "  object.color    args: { target, color: <#RRGGBB or name like red/blue> }\n" +
    "  object.light    args: { mode: directional|point|spot, name?, target?, color?, intensity?, x?, y?, z? }\n" +
    "  camera.frame    args: { target }  — point the Scene view at an object\n" +
    "  property.set    args: { target, component: <Type>, property: <member>, value: <string> }\n" +
    "                  — UNIVERSAL: set any field/property on any component (e.g. Rigidbody mass=5,\n" +
    "                    Light range=10, Camera fieldOfView=90). Vector3 value as 'x,y,z'.\n" +
    "  script.create   args: { script: <ClassName>, code?: <full C# MonoBehaviour source> }\n" +
    "  script.attach   args: { target, script: <ClassName> }\n" +
    "  scene.save      args: {}\n" +
    "  editor.play     args: { mode: play|stop }\n\n" +
    "Rules: default position to 0,0,0 if unspecified. For a floor/ground use type plane. " +
    "For a player use type capsule named 'Player' unless told otherwise. Use property.set for any " +
    "configuration that has no dedicated tool. When several objects share the same target name across " +
    "actions, reuse that exact name so later actions find the object the earlier one created. " +
    "If the user asks a general question, wants advice, or wants code explained (not placed in the " +
    "scene), reply exactly {\"actions\":[]}. Only include actions when the user clearly wants to " +
    "read from or change their actual open Unity scene/project.\n\n" +
    "Each action is one of:\n" +
    "  { \"kind\": \"read\", \"command\": \"<read command>\", \"args\": { ... } }\n" +
    "  { \"kind\": \"write\", \"tool\": \"<write tool>\", \"args\": { ... } }";
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
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const raw = (json?.choices?.[0]?.message?.content || "").trim();
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return []; }
    const list = Array.isArray(parsed?.actions) ? parsed.actions : [];
    const out: BridgeAction[] = [];
    for (const a of list) {
      const v = validateAction(a);
      if (v) out.push(v);
    }
    return out;
  } catch {
    return [];
  }
}

// Serializes a bridge action into the "code" string the bridge expects: a bare
// word for reads, or a JSON envelope { tool, args } for writes (args is itself a
// JSON string, matching the CodeRunner Envelope/Args contract).
function actionToCode(action: BridgeAction): string {
  if (action.kind === "read") {
    // Most reads are bare words; object.inspect needs a target, so it goes
    // through the same JSON envelope the write tools use.
    if (action.command === "object.inspect") {
      return JSON.stringify({ tool: action.command, args: JSON.stringify(action.args || {}) });
    }
    return action.command;
  }
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

    // Prefer the user's own Groq key (their own quota) and fall back to the
    // shared app key. This is what lets each user carry their own daily limit.
    const groqKey = await resolveGroqKey(base44);
    if (!groqKey) {
      return Response.json(
        { error: "No Groq API key available. Add your own key in Settings, or ask your admin to set one." },
        { status: 500 }
      );
    }

    // If this turn is about the live editor, reach through the bridge to the
    // user's Unity — either READING the scene or actually CHANGING it — and fold
    // the REAL output into the model's context so Lovelace answers from (and
    // reports on) the actual editor instead of guessing.
    let bridgeContext = "";
    const actions = await routeBridgeActions(groqKey, userMessage);
    if (actions.length > 0) {
      const bridge = await getBridge(base44).catch(() => null);
      if (bridge?.tunnel_url && bridge.status === "connected") {
        // Multi-step edits are the slow, fragile case: N writes = N HTTP round-
        // trips, each blocking on Unity's background-throttled main-thread queue.
        // When the turn is ALL writes and there's more than one, bundle them into
        // a SINGLE `batch` envelope so the bridge runs them back-to-back in one
        // main-thread pass — one round-trip instead of many. Reads stay individual
        // (they're fast and run off-thread), so any turn containing a read falls
        // back to the sequential path.
        const anyReads = actions.some((a) => a.kind === "read");
        const steps: string[] = [];
        let anySuccess = false;

        if (!anyReads && actions.length > 1) {
          const out = await runActionsOnBridge(
            bridge.tunnel_url,
            actions.map((a) => actionToCode(a))
          );
          if (out?.success) {
            anySuccess = true;
            steps.push(String(out.result ?? "ok").slice(0, 3000));
          } else {
            steps.push(`✗ batch FAILED → ${out?.error || "unknown error"}`);
          }
        } else {
          // Single action, or a turn that reads the scene — run in order.
          for (const action of actions) {
            const label = action.kind === "read" ? action.command : action.tool;
            const out = await runOnBridge(bridge.tunnel_url, actionToCode(action));
            const text = String(out?.result ?? "ok");
            if (out?.success && !(action.kind === "write" && resultLooksFailed(text))) {
              anySuccess = true;
              steps.push(`✓ \`${label}\` → ${text.slice(0, 500)}`);
            } else {
              steps.push(`✗ \`${label}\` FAILED → ${out?.error || text.slice(0, 300) || "unknown error"}`);
            }
          }
        }
        const log = steps.join("\n");
        if (anyReads) {
          bridgeContext =
            `LIVE UNITY EDITOR RESULTS, from the user's actual open project moments ago. ` +
            `Answer using THIS real data — do not tell the user to go look themselves:\n\n${log.slice(0, 4000)}`;
        } else if (anySuccess) {
          bridgeContext =
            `You just executed these actions on the user's LIVE Unity editor, in order. Results:\n\n${log.slice(0, 3000)}\n\n` +
            `Confirm to the user in one or two friendly sentences what you built/changed in their scene, ` +
            `and suggest the natural next step. If any step failed, mention it plainly. ` +
            `Do NOT paste code or tell them to do it manually — the successful steps are already done.`;
        } else {
          bridgeContext =
            `You attempted to change the user's live Unity editor but every step failed:\n\n${log.slice(0, 2000)}\n\n` +
            `Briefly tell the user the editor couldn't be reached and to check the tunnel/bridge, then help as best you can.`;
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
      if (groqRes.status === 429) {
        return Response.json(
          {
            error:
              "Groq's daily limit was reached for this key. Add your own Groq API key in Settings to keep going on your own quota.",
            rateLimited: true,
          },
          { status: 429 }
        );
      }
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