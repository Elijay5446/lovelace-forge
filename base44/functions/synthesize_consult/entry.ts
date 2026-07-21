import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SYNTH_SYSTEM =
  "You are Lovelace Forge. Several expert council members independently answered the user's question. Synthesize their answers into one clear, authoritative best answer for a Unity/UFE2 game developer. Note where the council agreed, resolve where they disagreed with your own judgment, and be warm but precise. Do not just list the answers — integrate them.";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const consultSessionId = body?.consult_session_id;
    if (!consultSessionId) {
      return Response.json(
        { error: "consult_session_id is required" },
        { status: 400 }
      );
    }

    const session = await base44.entities.ConsultSession.get(consultSessionId).catch(() => null);
    if (!session) {
      return Response.json({ error: "Consult session not found" }, { status: 404 });
    }

    const responses = await base44.entities.ModelResponse.filter({
      consult_session_id: consultSessionId,
    });
    const completed = (responses || []).filter(
      (r) => r.status === "completed" && r.content
    );

    if (completed.length === 0) {
      return Response.json(
        { error: "No completed council responses to synthesize." },
        { status: 409 }
      );
    }

    const councilContext = completed
      .map((r) => `--- Council member (${r.model_id}) ---\n${r.content}`)
      .join("\n\n");

    const userContent =
      `Original question:\n${session.prompt}\n\nCouncil answers:\n${councilContext}\n\nSynthesize these into the single best answer.`;

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
        messages: [
          { role: "system", content: SYNTH_SYSTEM },
          { role: "user", content: userContent },
        ],
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

    const json = await groqRes.json();
    const synthesis = (json?.choices?.[0]?.message?.content || "").trim();
    if (!synthesis) {
      return Response.json(
        { error: "Synthesis returned an empty response." },
        { status: 502 }
      );
    }

    // Persist the synthesis as a message in the conversation.
    await base44.entities.Message.create({
      conversation_id: session.conversation_id,
      role: "consult_synthesis",
      content: synthesis,
      model_source: "lovelace-synthesis",
    });

    await base44.entities.Conversation.update(session.conversation_id, {
      last_message_preview: synthesis.slice(0, 120),
    }).catch(() => {});

    return Response.json({ synthesis });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
});