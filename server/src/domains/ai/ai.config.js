import { configDotenv } from "dotenv"

configDotenv()

const GROQ_DEFAULT_BASE = "https://api.groq.com/openai/v1"

export function getAIConfig() {
  const apiKey = (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || "").trim()
  let baseUrl = (
    process.env.OPENAI_BASE_URL ||
    process.env.GROQ_BASE_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "")

  if (!baseUrl && process.env.GROQ_API_KEY) {
    baseUrl = GROQ_DEFAULT_BASE
  }

  const model =
    process.env.GROQ_MODEL ||
    process.env.OPENAI_MODEL ||
    (process.env.GROQ_API_KEY ? "allam-2-7b" : "gpt-4o-mini")

  return {
    apiKey,
    baseUrl,
    model,
    chatCompletionsUrl: baseUrl ? `${baseUrl}/chat/completions` : "",
    keySource: process.env.GROQ_API_KEY ? "GROQ_API_KEY" : process.env.OPENAI_API_KEY ? "OPENAI_API_KEY" : null,
  }
}

/** Safe startup log — never prints full API key */
export function logAIConfig() {
  const c = getAIConfig()
  console.log("[ai] config", {
    api_key_present: Boolean(c.apiKey),
    api_key_length: c.apiKey.length,
    api_key_source: c.keySource,
    base_url: c.baseUrl || "(missing — set OPENAI_BASE_URL or GROQ_BASE_URL)",
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
    apiKeyPresent: Boolean(c.apiKey),
    apiKeyLength: c.apiKey.length,
    apiKeySource: c.keySource,
    mode: "llm",
  }
}
