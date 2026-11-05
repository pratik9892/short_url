import { badRequest } from "../../errors/badRequest.js"
import { getAIConfig } from "./ai.config.js"
import { logger } from "../../infrastructure/logger/logger.js"

function requireAIConfig() {
  const c = getAIConfig()
  if (!c.apiKey || c.apiKey.length < 8) {
    throw new badRequest("AI API key", {
      hint: "Set GROQ_API_KEY (or OPENAI_API_KEY) on the server",
      api_key_present: Boolean(c.apiKey),
      api_key_length: c.apiKey.length,
    })
  }
  if (!c.baseUrl || !c.chatCompletionsUrl) {
    throw new badRequest("AI base URL", {
      hint: "Set OPENAI_BASE_URL=https://api.groq.com/openai/v1 for Groq",
      base_url: c.baseUrl || null,
    })
  }
  return c
}

async function chat(system, user, opts = {}) {
  const c = requireAIConfig()
  const body = {
    model: c.model,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.max_tokens ?? 700,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  }
  if (opts.response_format) body.response_format = opts.response_format

  logger.debug({
    url: c.chatCompletionsUrl,
    model: c.model,
    system_chars: system.length,
    user_chars: user.length,
  }, "groq request")

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
    logger.error({ err }, "groq network error")
    throw new badRequest("Groq request failed", {
      reason: err?.message || "network error",
    })
  }

  if (!res.ok) {
    let groqError = null
    try {
      groqError = JSON.parse(rawText)?.error
    } catch {
      groqError = null
    }
    logger.error({
      status: res.status,
      statusText: res.statusText,
      url: c.chatCompletionsUrl,
      model: c.model,
      groq_error: groqError,
      body: rawText.slice(0, 1000),
    }, "groq http error")
    throw new badRequest(
      groqError?.message || `Groq API HTTP ${res.status}`,
      {
        status: res.status,
        requested_url: c.chatCompletionsUrl,
        model: c.model,
        groq_code: groqError?.code,
        hint:
          res.status === 404
            ? "Groq 404 = wrong path. Expected https://api.groq.com/openai/v1/chat/completions — redeploy latest server or remove a bad OPENAI_BASE_URL."
            : res.status === 401
              ? "Invalid GROQ_API_KEY on Render"
              : undefined,
        body: rawText.slice(0, 500),
      }
    )
  }

  let data
  try {
    data = JSON.parse(rawText)
  } catch {
    logger.error({ body: rawText.slice(0, 300) }, "groq invalid json")
    throw new badRequest("Groq API invalid JSON", { body: rawText.slice(0, 300) })
  }

  const choice = data?.choices?.[0]
  const content = choice?.message?.content ?? ""

  logger.debug({
    id: data.id,
    model: data.model,
    usage: data.usage,
    finish_reason: choice?.finish_reason,
    content_length: content.length,
  }, "groq response")

  if (!String(content).trim()) {
    throw new badRequest("Groq API empty completion", {
      finish_reason: choice?.finish_reason,
      raw: data,
    })
  }

  return String(content).trim()
}

function safeHost(longUrl) {
  try {
    return new URL(longUrl).hostname.replace(/^www\./, "")
  } catch {
    return "unknown"
  }
}

function topN(obj, n = 3) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

function aggregateCounters(rows = []) {
  const countries = {}
  const cities = {}
  const browsers = {}
  const referrers = {}
  const rawDevices = { desktop: 0, mobile: 0, tablet: 0 }
  const byDay = {}

  rows.forEach((r) => {
    if (r.country) countries[r.country] = (countries[r.country] || 0) + 1
    if (r.city) cities[r.city] = (cities[r.city] || 0) + 1
    const dt = r.deviceType ? String(r.deviceType).toLowerCase() : "desktop"
    if (rawDevices[dt] !== undefined) rawDevices[dt]++
    else rawDevices.desktop++
    if (r.browser) browsers[r.browser] = (browsers[r.browser] || 0) + 1
    if (r.referer) {
      try {
        const host = new URL(r.referer).hostname.replace(/^www\./, "")
        referrers[host] = (referrers[host] || 0) + 1
      } catch {
        referrers[r.referer] = (referrers[r.referer] || 0) + 1
      }
    }
    const day = r.clickedAt
      ? new Date(r.clickedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
  })

  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: byDay[key] || 0,
    })
  }

  return {
    countries: topN(countries, 5),
    cities: topN(cities, 5),
    browsers: topN(browsers, 5),
    referrers: topN(referrers, 5),
    rawDevices,
    days,
  }
}

function aggregateStats(rows = []) {
  const counters = aggregateCounters(rows)
  return {
    ...counters,
    countriesSize: counters.countries.length,
    devices: {
      mobile: counters.rawDevices.mobile || 0,
      desktop: counters.rawDevices.desktop || 0,
      tablet: counters.rawDevices.tablet || 0,
    },
    topBrowser: counters.browsers[0] || null,
    topRef: counters.referrers[0] || null,
  }
}

async function dashboardInsight(_userId, links = []) {
  if (!links.length) {
    throw new badRequest("links", { hint: "Create at least one short link first" })
  }
  const compact = links.map((l) => ({
    name: l.linkName || "Untitled",
    code: l.shortCode,
    host: safeHost(l.longUrl),
    visits: Number(l.visits || 0),
  }))
  const insight = await chat(
    "You are a concise growth marketer. One short paragraph (max 100 words) about this short-link portfolio. Include numbers and one action.",
    JSON.stringify(compact)
  )
  return { insight, provider: "llm" }
}

async function suggestLinkName(longUrl) {
  const text = await chat(
    "Suggest a SHORT label (max 20 chars) for this URL. Only the label, no quotes.",
    `Long URL: ${longUrl}`,
    { temperature: 0.5, max_tokens: 40 }
  )
  const name = text.replace(/^["'`]|["'`]$/g, "").slice(0, 20)
  return { name, provider: "llm" }
}

async function analyticsSummary(link, rows = []) {
  const stats = aggregateStats(rows)
  const summary = await chat(
    "Summarize this link's click analytics in 50-70 words, in plain sentences. End with one recommendation. If there are zero clicks, say so and suggest how to get traffic.",
    `Link: ${link.linkName || link.shortCode}, clicks: ${rows.length}, devices: ${JSON.stringify(stats.devices)}, countries: ${stats.countriesSize}, top_countries: ${JSON.stringify(stats.countries)}`
  )
  return { summary, provider: "llm" }
}

async function audiencePersona(link, rows = []) {
  const stats = aggregateStats(rows)
  const persona = await chat(
    "One short marketing persona paragraph (60-80 words) for typical visitors. No lists. If there are few clicks, describe who you expect might click.",
    JSON.stringify({ link: link.linkName || link.shortCode, clicks: rows.length, stats })
  )
  return { persona, provider: "llm" }
}

async function askQuestion(question, context = {}) {
  const trimmed = String(question || "").trim().slice(0, 500)
  if (!trimmed) {
    throw new badRequest("question", { hint: "Question is required" })
  }
  const answer = await chat(
    "You are Shortly, a concise analytics assistant. Answer the question using only the data provided. Reply in plain conversational sentences, never JSON, code blocks or raw field names. Max 100 words.",
    `Question: ${trimmed}\nContext: ${JSON.stringify(context)}`
  )
  return { answer, provider: "llm" }
}

export const AIService = {
  dashboardInsight,
  suggestLinkName,
  analyticsSummary,
  audiencePersona,
  askQuestion,
  _aggregate: aggregateStats,
}
