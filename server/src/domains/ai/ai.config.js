import { configDotenv } from "dotenv"

configDotenv()

const GROQ_DEFAULT_BASE = "https://api.groq.com/openai/v1"
const GROQ_CHAT_URL = `${GROQ_DEFAULT_BASE}/chat/completions`

function cleanEnv(value) {
  return String(value || "")
    .trim()
    .replace(/\r/g, "")
    .replace(/^['"]|['"]$/g, "")
}

/**
 * Groq expects POST https://api.groq.com/openai/v1/chat/completions
 * 404 often means OPENAI_BASE_URL already includes /chat/completions (doubled)
 * or is https://api.groq.com without /openai/v1
 */
export function resolveGroqUrls(envBase = "") {
  let raw = String(envBase || "").trim()
  if (!raw) {
    return { baseUrl: "", chatCompletionsUrl: "" }
  }

  raw = raw.replace(/\/+$/, "")

  if (/\/chat\/completions$/i.test(raw)) {
    const chatCompletionsUrl = raw
    const baseUrl = raw.replace(/\/chat\/completions$/i, "")
    return { baseUrl, chatCompletionsUrl }
  }

  let baseUrl = raw
  if (/^https?:\/\/api\.groq\.com$/i.test(baseUrl)) {
    baseUrl = GROQ_DEFAULT_BASE
  } else if (/groq\.com/i.test(baseUrl) && !/\/openai\/v1/i.test(baseUrl)) {
    baseUrl = `${baseUrl}/openai/v1`
  }

  baseUrl = baseUrl.replace(/\/+$/, "")
  const chatCompletionsUrl = `${baseUrl}/chat/completions`
  return { baseUrl, chatCompletionsUrl }
}

export function getAIConfig() {
  const apiKey = cleanEnv(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY)
  const envBase = cleanEnv(
    process.env.OPENAI_BASE_URL || process.env.GROQ_BASE_URL || ""
  )

  let { baseUrl, chatCompletionsUrl } = resolveGroqUrls(envBase)

  const usingGroqKey = Boolean(cleanEnv(process.env.GROQ_API_KEY))
  if (!baseUrl && usingGroqKey) {
    const resolved = resolveGroqUrls(GROQ_DEFAULT_BASE)
    baseUrl = resolved.baseUrl
    chatCompletionsUrl = resolved.chatCompletionsUrl
  }

  // If Groq key is set but env base still resolves to a bad path, force the known-good URL
  if (usingGroqKey && chatCompletionsUrl !== GROQ_CHAT_URL) {
    console.warn("[ai] GROQ_API_KEY set but chat URL looks wrong; using default Groq endpoint", {
      env_base: envBase || "(empty)",
      resolved: chatCompletionsUrl,
      using: GROQ_CHAT_URL,
    })
    const resolved = resolveGroqUrls(GROQ_DEFAULT_BASE)
    baseUrl = resolved.baseUrl
    chatCompletionsUrl = resolved.chatCompletionsUrl
  }

  const model =
    process.env.GROQ_MODEL ||
    process.env.OPENAI_MODEL ||
    (process.env.GROQ_API_KEY ? "llama-3.1-8b-instant" : "gpt-4o-mini")

  return {
    apiKey,
    baseUrl,
    model,
    chatCompletionsUrl,
    keySource: process.env.GROQ_API_KEY
      ? "GROQ_API_KEY"
      : process.env.OPENAI_API_KEY
        ? "OPENAI_API_KEY"
        : null,
  }
}

/** Safe startup log — never prints full API key */
export function logAIConfig() {
  const c = getAIConfig()
  console.log("[ai] config", {
    api_key_present: Boolean(c.apiKey),
    api_key_length: c.apiKey.length,
    api_key_source: c.keySource,
    base_url: c.baseUrl || "(missing — set OPENAI_BASE_URL=https://api.groq.com/openai/v1)",
    model: c.model,
    chat_completions_url: c.chatCompletionsUrl || "(missing)",
  })
}

export function getProviderInfo() {
  const c = getAIConfig()
  return {
    llmEnabled: Boolean(c.apiKey && c.apiKey.length >= 8 && c.baseUrl),
    model: c.model,
    baseUrl: c.baseUrl || null,
    chatCompletionsUrl: c.chatCompletionsUrl || null,
    expectedGroqChatUrl: GROQ_CHAT_URL,
    chatUrlMatchesGroqDefault: c.chatCompletionsUrl === GROQ_CHAT_URL,
    apiKeyPresent: Boolean(c.apiKey),
    apiKeyLength: c.apiKey.length,
    apiKeySource: c.keySource,
    mode: "llm",
  }
}

/** One minimal Groq call to verify key, model, and URL (for debugging). */
export async function probeGroqConnection() {
  const c = getAIConfig()
  if (!c.apiKey || c.apiKey.length < 8) {
    return { ok: false, step: "config", error: "Missing or short API key" }
  }
  if (!c.chatCompletionsUrl) {
    return { ok: false, step: "config", error: "Missing chat completions URL" }
  }

  const body = {
    model: c.model,
    max_tokens: 8,
    messages: [{ role: "user", content: "Reply with OK" }],
  }

  let res
  let rawText = ""
  try {
    res = await fetch(c.chatCompletionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${c.apiKey}`,
      },
      body: JSON.stringify(body),
    })
    rawText = await res.text()
  } catch (err) {
    return {
      ok: false,
      step: "network",
      url: c.chatCompletionsUrl,
      model: c.model,
      error: err?.message || String(err),
    }
  }

  let parsed = null
  try {
    parsed = JSON.parse(rawText)
  } catch {
    parsed = { raw: rawText.slice(0, 300) }
  }

  return {
    ok: res.ok,
    httpStatus: res.status,
    url: c.chatCompletionsUrl,
    model: c.model,
    groq_error: parsed?.error || null,
    usage: parsed?.usage || null,
    content_preview: parsed?.choices?.[0]?.message?.content?.slice(0, 80) || null,
  }
}
