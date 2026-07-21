import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { groqChat } from '../../shared/groq.ts';

const SYSTEM_PROMPT =
  "You are Lovelace Forge, an elite Unity (C#) and game-development engineer. Generate clean, production-quality, well-commented code for the user's request. Prefer Unity 2021.6/Unity 6 and UFE2 idioms when relevant. Return ONLY the code in a single fenced code block, preceded by one short sentence describing what it does.";

const isGroqKeyError = (msg) => /groq api key|GROQ_API_KEY/i.test(msg || "");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const projectId = body?.project_id || undefined;
    const language = body?.language;
    const description = body?.description;
    // conversation_id is accepted for forward-compat but not required here.
    const conversationId = body?.conversation_id || undefined;

    if (!language || typeof description !== "string" || !description.trim()) {
      return Response.json(
        { error: "language and a non-empty description are required" },
        { status: 400 }
      );
    }

    const userMessage = `Language: ${language}\n\nRequest: ${description.trim()}`;
    const result = await groqChat({
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      temperature: 0.4,
      maxTokens: 4096,
    });

    if (result.error) {
      return Response.json(
        { error: result.error },
        { status: isGroqKeyError(result.error) ? 500 : 502 }
      );
    }

    // Split the model output into an explanation sentence + the fenced code.
    let explanation = "";
    let code = result.content;
    const fenceStart = result.content.indexOf("```");
    if (fenceStart !== -1) {
      explanation = result.content.slice(0, fenceStart).trim();
      const afterFence = result.content.slice(fenceStart);
      const firstNewline = afterFence.indexOf("\n");
      const innerStart = firstNewline !== -1 ? firstNewline + 1 : 3;
      let inner = afterFence.slice(innerStart);
      const closeFence = inner.lastIndexOf("```");
      if (closeFence !== -1) inner = inner.slice(0, closeFence);
      code = inner.trim();
    } else {
      const nl = result.content.indexOf("\n");
      if (nl !== -1) {
        explanation = result.content.slice(0, nl).trim();
        code = result.content.slice(nl + 1).trim();
      }
    }

    // Derive a short title from the description.
    const title = description.trim().split(/\s+/).slice(0, 8).join(" ").slice(0, 60);

    const artifact = await base44.entities.CodeArtifact.create({
      name: title,
      language,
      content: code,
      description: explanation || description.trim(),
      artifact_type: "script",
      project_id: projectId,
    });

    return Response.json({
      artifact_id: artifact.id,
      title,
      language,
      code,
      explanation,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
});