import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const COUNCIL_SYSTEM =
  "You are one expert voice on a council convened by Lovelace Forge, an AI game-dev studio for Unity + UFE2. Answer the user's question directly and concisely with your best independent technical judgment.";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const conversationId = body?.conversation_id;
    const prompt = body?.prompt;

    if (!conversationId || typeof prompt !== "string" || !prompt.trim()) {
      return Response.json(
        { error: "conversation_id and a non-empty prompt are required" },
        { status: 400 }
      );
    }

    // Verify the conversation belongs to this user (RLS enforces ownership).
    const conversation = await base44.entities.Conversation.get(conversationId).catch(() => null);
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      return Response.json(
        { error: "Groq API key is not configured. Set GROQ_API_KEY in the app secrets." },
        { status: 500 }
      );
    }

    // Enabled providers, lowest priority number first.
    const providers = await base44.entities.ModelProvider.filter(
      { enabled: true },
      "priority",
      50
    );
    if (!providers || providers.length === 0) {
      return Response.json(
        { error: "No enabled model providers configured." },
        { status: 503 }
      );
    }

    const consult = await base44.entities.ConsultSession.create({
      conversation_id: conversationId,
      prompt,
      status: "streaming",
      model_ids: providers.map((p) => p.model_id),
    });

    const consultOne = async (provider) => {
      const started = Date.now();
      const mr = await base44.entities.ModelResponse.create({
        consult_session_id: consult.id,
        model_id: provider.model_id,
        provider: provider.name,
        status: "pending",
      });
      try {
        const res = await fetch(provider.api_base_url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: provider.model_id,
            messages: [
              { role: "system", content: COUNCIL_SYSTEM },
              { role: "user", content: prompt },
            ],
            temperature: provider.temperature_default ?? 0.7,
            max_tokens: provider.max_tokens ?? 2048,
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          await base44.entities.ModelResponse.update(mr.id, {
            status: "failed",
            content: `Provider error (${res.status}): ${errText}`,
            latency_ms: Date.now() - started,
          });
          return;
        }

        const json = await res.json();
        const content = (json?.choices?.[0]?.message?.content || "").trim();
        const usage = json?.usage || {};
        const tokenCount = usage.completion_tokens || usage.total_tokens || 0;

        await base44.entities.ModelResponse.update(mr.id, {
          status: content ? "completed" : "failed",
          content: content || "The model returned an empty response.",
          token_count: tokenCount,
          latency_ms: Date.now() - started,
        });
      } catch (err) {
        await base44.entities.ModelResponse.update(mr.id, {
          status: "failed",
          content: `Request failed: ${err?.message || "unknown error"}`,
          latency_ms: Date.now() - started,
        }).catch(() => {});
      }
    };

    // Fan out concurrently; each provider saves its own result as it resolves
    // so the UI can poll/subscribe and watch answers appear live.
    await Promise.all(providers.map((p) => consultOne(p)));

    const completedAt = new Date().toISOString();
    await base44.entities.ConsultSession.update(consult.id, {
      status: "completed",
      completed_at: completedAt,
    });

    const responses = await base44.entities.ModelResponse.filter({
      consult_session_id: consult.id,
    });

    return Response.json({
      consult_session_id: consult.id,
      responses,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
});