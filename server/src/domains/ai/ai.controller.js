import { StatusCodes } from "http-status-codes"
import { AIService } from "./ai.service.js"
import { getProviderInfo, probeGroqConnection } from "./ai.config.js"
import { LinkRepository } from "../link/link.repo.js"
import { AnalyticsRepository } from "../analytics/analytics.repo.js"
import { NotFound } from "../../errors/notFound.js"

const linkRepo = new LinkRepository()
const analyticsRepo = new AnalyticsRepository()

async function postDashboardInsight(req, res, next) {
  try {
    const links = await linkRepo.getAllShortUrls(req.user._id)
    const result = await AIService.dashboardInsight(req.user._id, links)
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "AI insight generated",
      error: {},
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

async function postSuggestName(req, res, next) {
  try {
    const { longUrl } = req.body
    if (!longUrl) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "longUrl is required",
        error: {},
        data: {},
      })
    }
    const result = await AIService.suggestLinkName(longUrl)
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Suggested link name",
      error: {},
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

async function getLinkAIAnalytics(req, res, next) {
  try {
    const { linkId } = req.params
    const link = await linkRepo.getShortUrlByIdAndOwner(linkId, req.user._id)
    if (!link) throw new NotFound("Link", linkId)

    let rows = (await analyticsRepo.getAnalyticsForLink(linkId, req.user._id)) || []
    if (!Array.isArray(rows)) rows = []

    const [summary, anomalies, forecast, persona] = await Promise.all([
      AIService.analyticsSummary(link, rows),
      AIService.detectAnomalies(link, rows),
      AIService.forecastClicks(link, rows),
      AIService.audiencePersona(link, rows),
    ])

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "AI analytics generated",
      error: {},
      data: { summary, anomalies, forecast, persona, clicks: rows.length },
    })
  } catch (err) {
    next(err)
  }
}

async function getAIStatus(req, res, next) {
  try {
    const data = getProviderInfo()
    if (req.query.test === "1" || req.query.test === "true") {
      data.probe = await probeGroqConnection()
    }
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "AI provider status",
      error: {},
      data,
    })
  } catch (err) {
    next(err)
  }
}

async function postAsk(req, res, next) {
  try {
    const { question, linkId } = req.body || {}
    if (!question || !String(question).trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "question is required",
        error: {},
        data: {},
      })
    }

    const userId = req.user._id ?? req.user.id
    const links = await linkRepo.getAllShortUrls(userId)
    let context = {
      links: links.map((l) => ({
        name: l.linkName,
        code: l.shortCode,
        visits: l.visits || 0,
      })),
      totalVisits: links.reduce((s, l) => s + Number(l.visits || 0), 0),
    }

    if (linkId) {
      const link = await linkRepo.getShortUrlByIdAndOwner(linkId, userId)
      if (!link) throw new NotFound("Link", linkId)
      const rows = await analyticsRepo.getAnalyticsForLink(linkId, userId)
      const stats = AIService._aggregate(Array.isArray(rows) ? rows : [])
      context = {
        link: {
          linkName: link.linkName,
          shortCode: link.shortCode,
          longUrl: link.longUrl,
          visits: link.visits || 0,
        },
        clickCount: Array.isArray(rows) ? rows.length : 0,
        stats,
      }
    }

    const result = await AIService.askQuestion(question, context)
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "AI answer generated",
      error: {},
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

export {
  postDashboardInsight,
  postSuggestName,
  getLinkAIAnalytics,
  getAIStatus,
  postAsk,
}
