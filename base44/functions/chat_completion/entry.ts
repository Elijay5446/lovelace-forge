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

// The commands the Forge Bridge CodeRunner understands out of the box.
const BRIDGE_COMMANDS = [
  "scene.info",
  "scene.hierarchy",
  "selection.info",
  "assets.count",
  "editor.info",
];

// Ask the model whether this user turn needs the live Unity editor, and if so
// which bridge command answers it. Returns { command } or null. Kept tiny and
// deterministic (temperature 0) so it's a fast, cheap router — not a chat turn.
async function routeBridgeCommand(groqKey: string, userMessage: string): Promise<string | null> {
  const routerSystem =
    "You route a game developer's message to a Unity editor bridge. " +
    "The bridge can run exactly these read commands:\n" +
    "- scene.info: summary of the active scene (name, object counts)\n" +
    "- scene.hierarchy: the full object tree of the open scene\n" +
    "- selection.info: what is currently selected in the editor\n" +
    "- assets.count: counts of scripts, prefabs, scenes in the project\n" +
    "- editor.info: Unity version, platform, play state\n" +
    "If the user is asking about the state of THEIR open scene, hierarchy, selection, " +
    "project assets, or editor, reply with ONLY the single matching command word. " +
    "Otherwise (general questions, code writing, advice) reply with ONLY the word NONE. " +
    "Reply with nothing but the command word or NONE.";
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
        max_tokens: 12,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = (json?.choices?.[0]?.message?.content || "").trim().toLowerCase().replace(/[^a-z.]/g, "");
    return BRIDGE_COMMANDS.includes(raw) ? raw : null;
  } catch {
    return null;
  }
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
    // user's Unity and fold the REAL output into the model's context — so
    // Lovelace answers from the actual scene instead of guessing.
    let bridgeContext = "";
    const command = await routeBridgeCommand(groqKey, userMessage);
    if (command) {
      const bridge = await getBridge(base44).catch(() => null);
      if (bridge?.tunnel_url && bridge.status === "connected") {
        const out = await runOnBridge(bridge.tunnel_url, command);
        if (out?.success) {
          bridgeContext =
            `LIVE UNITY EDITOR OUTPUT (command \`${command}\`), read moments ago from the user's actual open project. ` +
            `Answer using THIS real data — do not tell the user to go look themselves:\n\n` +
            String(out.result ?? "").slice(0, 4000);
        } else {
          bridgeContext =
            `You attempted to read the user's live Unity editor (\`${command}\`) but the bridge call failed: ` +
            `${out?.error || "unknown error"}. Briefly tell the user the editor couldn't be reached and to check the tunnel/bridge, then help as best you can.`;
        }
      } else {
        bridgeContext =
          `The user is asking about their live Unity editor, but no connected bridge is available. ` +
          `Tell them to connect Unity (Connect Unity page) so you can read their scene directly, then help generally.`;
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