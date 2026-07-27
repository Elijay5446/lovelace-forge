export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export function getGroqKey() {
  return Deno.env.get("GROQ_API_KEY");
}

/**
 * Resolves the Groq key to use for THIS request: the authenticated user's own
 * saved key (from their UserProfile) if they've provided one, otherwise the
 * shared app-level GROQ_API_KEY. Letting each user bring their own key means
 * they draw on their own daily quota, so one busy person can't exhaust everyone.
 * Never throws — returns the shared key (or undefined) on any lookup failure.
 */
export async function resolveGroqKey(base44: any): Promise<string | undefined> {
  try {
    const profiles = await base44.entities.UserProfile.filter({}, "-created_date", 1);
    const userKey = profiles && profiles[0] ? String(profiles[0].groq_api_key || "").trim() : "";
    if (userKey) return userKey;
  } catch {
    // fall through to the shared key
  }
  return getGroqKey();
}

/**
 * True when a Groq HTTP status means "you've hit a rate/usage limit" — used so
 * callers can degrade gracefully with a clear message instead of a raw error.
 */
export function isRateLimited(status: number) {
  return status === 429;
}

/**
 * Call Groq's OpenAI-compatible chat endpoint with a system + user message.
 * Pass an explicit `key` (e.g. from resolveGroqKey) to use a specific user's
 * key; falls back to the shared app key when omitted.
 * Returns { content } on success or { error, rateLimited? } on failure — never throws.
 */
export async function groqChat({ systemPrompt, userMessage, temperature, maxTokens, model, key }: any) {
  const groqKey = key || getGroqKey();
  if (!groqKey) {
    return { error: "No Groq API key available. Add your own key in Settings, or ask your admin to set one." };
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
      if (isRateLimited(res.status)) {
        return {
          error:
            "Groq's daily limit was reached for this key. Add your own Groq API key in Settings to keep going on your own quota.",
          rateLimited: true,
        };
      }
      return { error: `Groq API error (${res.status}): ${errText}` };
    }
    const json = await res.json();
    const content = (json?.choices?.[0]?.message?.content || "").trim();
    if (!content) return { error: "The model returned an empty response." };
    return { content };
  } catch (err: any) {
    return { error: `Groq request failed: ${err?.message || "unknown error"}` };
  }
}