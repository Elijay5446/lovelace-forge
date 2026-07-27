import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { getBridge, runActionsOnBridge } from '../../shared/bridge.ts';

// Runs ONE pre-authored logo-build step directly against the user's live Unity
// bridge — with ZERO Groq/LLM calls. The frontend passes the step's exact
// ordered `actions` (from buildSequence.js) plus a canned `narration` line.
// We bundle the writes into a single `batch` envelope (one main-thread pass,
// one round-trip), verify success, post the narration as Lovelace's message,
// and return { success } so the auto-runner only advances after verification.

const MODEL_SOURCE = "lovelace-forge/demo";

// Serializes one action into the "code" the bridge expects: a bare word for
// reads, a JSON { tool, args } envelope for writes (args itself a JSON string).
function actionToCode(action: any): string {
  if (action?.kind === "read") {
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
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const conversationId = body?.conversation_id;
    const actions = Array.isArray(body?.actions) ? body.actions : [];
    const narration = typeof body?.narration === "string" ? body.narration : "";

    if (!conversationId || actions.length === 0) {
      return Response.json(
        { error: "conversation_id and a non-empty actions array are required" },
        { status: 400 }
      );
    }

    const conversation = await base44.entities.Conversation.get(conversationId).catch(() => null);
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    const bridge = await getBridge(base44).catch(() => null);
    if (!bridge?.tunnel_url || bridge.status !== "connected") {
      return Response.json(
        { success: false, error: "Unity bridge is not connected. Connect Unity, then run the demo again." },
        { status: 200 }
      );
    }

    // Try one batch envelope first (single main-thread pass); older bridge
    // versions without `batch` fall back to sequential — and error text inside
    // any step's result marks the step failed instead of a false success.
    const out = await runActionsOnBridge(
      bridge.tunnel_url,
      actions.map((a: any) => actionToCode(a))
    );

    if (!out?.success) {
      const errMsg = out?.error || "The editor could not run this step.";
      await base44.entities.Message.create({
        conversation_id: conversationId,
        role: "assistant",
        content: `That step didn't land in Unity — ${errMsg} I've paused the build here.`,
        model_source: MODEL_SOURCE,
      });
      return Response.json({ success: false, error: errMsg }, { status: 200 });
    }

    // Verified success — post Lovelace's canned narration for this step.
    const reply = narration || "Step complete.";
    await base44.entities.Message.create({
      conversation_id: conversationId,
      role: "assistant",
      content: reply,
      model_source: MODEL_SOURCE,
    });
    await base44.entities.Conversation.update(conversationId, {
      last_message_preview: reply.slice(0, 120),
    });

    return Response.json({ success: true, reply });
  } catch (error) {
    return Response.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
});