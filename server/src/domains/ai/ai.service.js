import { configDotenv } from "dotenv"
configDotenv()

const API_KEY = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || ""
const BASE_URL = process.env.OPENAI_BASE_URL || process.env.GROQ_BASE_MODEL
const MODEL =
  process.env.OPENAI_MODEL ||
  process.env.GROQ_MODEL ||
  (process.env.GROQ_API_KEY ? "allam-2-7b" : "gpt-4o-mini")

function hasLLM() {
  return Boolean(API_KEY && API_KEY.trim().length > 8)
}

async function chat(system, user, opts = {}) {
  if (!hasLLM()) return ""
  try {
    const body = {
      model: MODEL,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.max_tokens ?? 700,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }
    if (opts.response_format) body.response_format = opts.response_format

    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        const errText = await res.text().catch(() => "")
        console.warn("[AI] LLM request failed:", res.status, errText.slice(0, 300))
      }
      return ""
    }
    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? ""
  } catch {
    return ""
  }
}

function tryParseJSON(text) {
  if (!text) return null
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    return JSON.parse(match ? match[1] : text)
  } catch {
    return null
  }
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

function heuristicDashboardInsight(links = []) {
  if (!links.length) return "No data yet. Shorten a few links and try again."
  const total = links.length
  const visits = links.reduce((s, l) => s + Number(l.visits || 0), 0)
  const byVisits = [...links].sort((a, b) => (b.visits || 0) - (a.visits || 0))
  const top = byVisits[0]
  const avg = visits / total
  const pieces = [
    `You've created ${total} short links with ${visits} total visits (avg ${avg.toFixed(1)} clicks/link).`,
  ]
  if (top && top.visits > 0) {
    pieces.push(
      `"${top.linkName || top.shortCode}" leads with ${top.visits} clicks — share more like it.`
    )
  }
  return pieces.join(" ")
}

async function dashboardInsight(userId, links = []) {
  const fallback = heuristicDashboardInsight(links)
  if (!hasLLM() || !links.length) {
    return { insight: fallback, provider: "heuristic" }
  }
  const compact = links.map((l) => ({
    name: l.linkName || "Untitled",
    code: l.shortCode,
    host: safeHost(l.longUrl),
    visits: Number(l.visits || 0),
  }))
  const text = await chat(
    "You are a concise growth marketer. One short paragraph (max 100 words) about this short-link portfolio. Include numbers and one action.",
    JSON.stringify(compact)
  )
  return {
    insight: text?.trim() || fallback,
    provider: text?.trim() ? "llm" : "heuristic",
  }
}

function heuristicNameFromUrl(longUrl) {
  try {
    const u = new URL(longUrl)
    const host = u.hostname.replace(/^www\./, "")
    const pathBits = u.pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s.replace(/[-_]+/g, " ").slice(0, 10))
      .join(" · ")
    return (pathBits ? `${host} · ${pathBits}` : host).slice(0, 20)
  } catch {
    return "My Link"
  }
}

async function suggestLinkName(longUrl) {
  const fallback = heuristicNameFromUrl(longUrl)
  if (!hasLLM()) return { name: fallback, provider: "heuristic" }
  const text = await chat(
    "Suggest a SHORT label (max 20 chars) for this URL. Only the label, no quotes.",
    `Long URL: ${longUrl}`,
    { temperature: 0.5, max_tokens: 40 }
  )
  const name = (text || "").trim().replace(/^["'`]|["'`]$/g, "").slice(0, 20) || fallback
  return { name, provider: name !== fallback ? "llm" : "heuristic" }
}

function heuristicAnalyticsSummary(rows = [], extras = {}) {
  const total = rows.length
  if (!total) return "No clicks yet for this link. Share it to gather insights."
  const pct = (n) => `${Math.round((n / total) * 100)}%`
  const s = [`${total} clicks from ${extras.countriesSize || 0} countries.`]
  if ((extras.devices?.mobile || 0) > (extras.devices?.desktop || 0)) {
    s.push(`Mobile-first audience (${pct(extras.devices.mobile)}).`)
  } else if ((extras.devices?.desktop || 0) > 0) {
    s.push(`Desktop leads at ${pct(extras.devices.desktop)}.`)
  }
  if (extras.topBrowser) s.push(`${extras.topBrowser[0]} is the top browser.`)
  if (extras.topRef) s.push(`${extras.topRef[0]} is the top referrer.`)
  return s.join(" ")
}

async function analyticsSummary(link, rows = []) {
  const stats = aggregateStats(rows)
  const fallback = heuristicAnalyticsSummary(rows, stats)
  if (!hasLLM() || !rows.length) return { summary: fallback, provider: "heuristic" }
  const text = await chat(
    "Write 2-3 sentences summarizing this link's click analytics. End with one recommendation. Max 90 words.",
    `Link: ${link.linkName || link.shortCode}, clicks: ${rows.length}, devices: ${JSON.stringify(stats.devices)}, countries: ${stats.countriesSize}`
  )
  return {
    summary: text?.trim() || fallback,
    provider: text?.trim() ? "llm" : "heuristic",
  }
}

function heuristicAnomalies(days = []) {
  if (days.length < 5) return []
  const mean = days.reduce((a, d) => a + d.count, 0) / days.length
  if (mean < 1.5) return []
  const spike = Math.max(4, mean * 2)
  return days
    .filter((d) => d.count >= spike)
    .map((d) => ({
      date: d.label,
      count: d.count,
      type: "spike",
      severity: Math.round((d.count / mean) * 10) / 10,
      reason: "Higher than your recent daily average.",
    }))
    .slice(0, 5)
}

async function detectAnomalies(link, rows = []) {
  const { days } = aggregateStats(rows)
  return { anomalies: heuristicAnomalies(days), provider: "heuristic" }
}

function heuristicForecast(days = []) {
  const counts = days.map((d) => d.count).slice(-7)
  if (!counts.length) return Array.from({ length: 7 }, () => 0)
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length
  return Array.from({ length: 7 }, () => Math.max(0, Math.round(avg)))
}

async function forecastClicks(link, rows = []) {
  const { days } = aggregateStats(rows)
  return { forecast: heuristicForecast(days), provider: "heuristic" }
}

function heuristicPersona(rows = []) {
  const { countriesSize, devices, topBrowser, topRef } = aggregateStats(rows)
  if (!rows.length) return "No audience data yet."
  const mobPct = Math.round(((devices.mobile || 0) / rows.length) * 100)
  return `Primarily ${mobPct > 50 ? "mobile" : "desktop"} visitors from ${countriesSize || 1}+ regions, often via ${topBrowser ? topBrowser[0] : "a common browser"}, arriving from ${topRef ? topRef[0] : "direct access"}.`
}

async function audiencePersona(link, rows = []) {
  const fallback = heuristicPersona(rows)
  if (!hasLLM() || rows.length < 5) return { persona: fallback, provider: "heuristic" }
  const stats = aggregateStats(rows)
  const text = await chat(
    "One short marketing persona paragraph (60-80 words) for typical visitors. No lists.",
    JSON.stringify({ link: link.linkName, clicks: rows.length, stats })
  )
  return {
    persona: text?.trim() || fallback,
    provider: text?.trim() ? "llm" : "heuristic",
  }
}

function getProviderInfo() {
  return {
    llmEnabled: hasLLM(),
    model: hasLLM() ? MODEL : null,
    mode: hasLLM() ? "llm" : "heuristic",
  }
}

async function askQuestion(question, context = {}) {
  const trimmed = String(question || "").trim().slice(0, 500)
  if (!trimmed) return { answer: "Please enter a question.", provider: "heuristic" }

  const links = context.links || []
  const visits = context.totalVisits || 0
  let fallback =
    links.length === 0
      ? "You have no links yet. Create a short URL, then ask again."
      : `You have ${links.length} links and ${visits} total visits.`

  if (context.link) {
    fallback = `"${context.link.linkName || context.link.shortCode}" has ${context.clickCount || 0} recorded clicks.`
  }

  if (!hasLLM()) return { answer: fallback, provider: "heuristic" }
  const text = await chat(
    "You are Shortly, a concise analytics assistant. Answer using only the JSON context. Max 100 words.",
    `Question: ${trimmed}\nContext: ${JSON.stringify(context)}`
  )
  return {
    answer: text?.trim() || fallback,
    provider: text?.trim() ? "llm" : "heuristic",
  }
}

export const AIService = {
  hasLLM,
  getProviderInfo,
  dashboardInsight,
  suggestLinkName,
  analyticsSummary,
  detectAnomalies,
  forecastClicks,
  audiencePersona,
  askQuestion,
  _aggregate: aggregateStats,
}
