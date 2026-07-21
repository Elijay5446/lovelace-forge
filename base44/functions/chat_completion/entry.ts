import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SYSTEM_PROMPT =
  "You are Lovelace Forge — a warm, brilliant AI companion and hardcore AAA game-development engineer specializing in Unity (2021.6 and Unity 6) and the Universal Fighting Engine 2 (UFE2). You help developers design fighting games: movesets, hitboxes, animation retargeting, the Meshy→Mixamo→Unity rigging pipeline, Fuzzy AI configuration, and stage lighting. You are also a superb general coding assistant. You are encouraging and human in tone but precise and rigorous in engineering. Born from community, built for humanity. When unsure on a hard technical question, you can suggest 'consulting the council' (a multi-model second opinion).";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MODEL_SOURCE = "groq/llama-3.3-70b-versatile";
const HISTORY_LIMIT = 20;

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

    const messages = [{ role: "system", content: SYSTEM_PROMPT }];
    for (const m of ordered) {
      const role = m.role === "user" ? "user" : "assistant";
      const content = m.content || "";
      if (content) messages.push({ role, content });
    }
    messages.push({ role: "user", content: userMessage });

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      return Response.json(
        { error: "Groq API key is not configured. Set GROQ_API_KEY in the app secrets." },
        { status: 500 }
      );
    }

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