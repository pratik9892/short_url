import { StatusCodes } from "http-status-codes"
import { AnalyticsRepository } from "./analytics.repo.js"
import { AnalyticsService } from "./analytics.service.js"

const analyticsService = new AnalyticsService(new AnalyticsRepository())

async function getAnalyticsForLink(req, res, next) {
  try {
    const { linkId } = req.params
    const userId = req.user._id || req.user.id
    const analytics = await analyticsService.getAnalyticsForLink(linkId, userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Analytics fetched successfully",
      error: {},
      data: analytics,
    })
  } catch (error) {
    next(error)
  }
}

async function getAnalyticsForAllLinks(req, res, next) {
  try {
    const userId = req.user._id || req.user.id
    const analytics = await analyticsService.getAnalyticsForAllLinks(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Analytics fetched successfully",
      error: {},
      data: analytics,
    })
  } catch (error) {
    next(error)
  }
}

export { getAnalyticsForLink, getAnalyticsForAllLinks }
