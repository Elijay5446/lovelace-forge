export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export function getGroqKey() {
  return Deno.env.get("GROQ_API_KEY");
}

/**
 * Call Groq's OpenAI-compatible chat endpoint with a system + user message.
 * Returns { content } on success or { error } on failure — never throws.
 */
export async function groqChat({ systemPrompt, userMessage, temperature, maxTokens, model }) {
  const groqKey = getGroqKey();
  if (!groqKey) {
    return { error: "Groq API key is not configured. Set GROQ_API_KEY in the app secrets." };
  }
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { error: `Groq API error (${res.status}): ${errText}` };
    }
    const json = await res.json();
    const content = (json?.choices?.[0]?.message?.content || "").trim();
    if (!content) return { error: "The model returned an empty response." };
    return { content };
  } catch (err) {
    return { error: `Groq request failed: ${err?.message || "unknown error"}` };
  }
}