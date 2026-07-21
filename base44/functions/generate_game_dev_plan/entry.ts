import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { groqChat } from '../../shared/groq.ts';

const SYSTEM_PROMPT =
  "You are Lovelace Forge, an AAA game-development director specializing in Unity + UFE2 fighting games. Break the user's goal into a clear, ordered, actionable build plan. For each step give: a short title, a 1-2 sentence description, whether it is Automatable or Manual, and a rough effort estimate. Be concrete and Unity-specific (menu paths, asset types, UFE2 concepts like MoveSet/HitBox/CharacterInfo where relevant). Return the plan as a JSON array of objects with keys: title, description, type ('Automatable' or 'Manual'), effort. Return ONLY valid JSON, no prose.";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const projectId = body?.project_id || undefined;
    const goal = body?.goal;
    // conversation_id accepted for forward-compat but not required here.
    const conversationId = body?.conversation_id || undefined;

    if (typeof goal !== "string" || !goal.trim()) {
      return Response.json(
        { error: "A non-empty goal is required" },
        { status: 400 }
      );
    }

    const result = await groqChat({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: goal.trim(),
      temperature: 0.5,
      maxTokens: 4096,
    });

    if (result.error) {
      return Response.json({ error: result.error }, { status: 502 });
    }

    // Strip a possible ```json fence before parsing.
    let raw = result.content;
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) raw = fenceMatch[1];
    raw = raw.trim();

    let plan = null;
    try {
      plan = JSON.parse(raw);
      if (!Array.isArray(plan)) {
        throw new Error("Model did not return a JSON array.");
      }
    } catch (parseErr) {
      // Don't crash — surface the raw text so the UI can show it.
      return Response.json({
        project_id: projectId,
        tasks: [],
        raw_text: result.content,
        error: "Could not parse the plan as JSON.",
      });
    }

    const tasksToCreate = plan.map((step, i) => {
      const type = step?.type === "Automatable" ? "Automatable" : "Manual";
      return {
        title: String(step?.title || `Step ${i + 1}`),
        description: String(step?.description || ""),
        task_type: type,
        effort_estimate: String(step?.effort || ""),
        status: "todo",
        order_index: i,
        project_id: projectId,
      };
    });

    const created = await base44.entities.GameDevTask.bulkCreate(tasksToCreate);

    return Response.json({
      project_id: projectId,
      tasks: created,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
});