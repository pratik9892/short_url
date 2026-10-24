import { StatusCodes } from "http-status-codes"
import { LinkRepository } from "./link.repo.js"
import { LinkService } from "./link.service.js"
import { analyticsQueue } from "../../infrastructure/queue/analyticsQueue.js"
import { linkCache } from "../../infrastructure/cache/linkCache.js"

const linkService = new LinkService(new LinkRepository, linkCache)


async function createShortUrl(req,res,next){
    try {
        
        const {linkName,longUrl} = req.body
        
        
        const createdLink = await linkService.createShortUrl({linkName,longUrl,linkOwner:req.user._id})

        return res
            .status(StatusCodes.CREATED)
            .json({
                status : true,
                message : "Short URL created successfully",
                error : {},
                data : createdLink
            })
    } catch (error) {
        next(error)
    }
}

async function redirectToLongUrl(req,res,next){
    try {
        const {shortCode} = req.params;

        const link = await linkService.getLinkByShortCode(shortCode)

        const ip =
            (req.headers["x-forwarded-for"] &&
                req.headers["x-forwarded-for"].split(",")[0].trim()) ||
            req.ip;

        const userAgent = req.headers["user-agent"];
        const referer = req.headers["referer"] || req.headers["referrer"];

        // fire-and-forget: not awaited, so the redirect never waits on Redis.
        // the worker saves the click event and increments the visits counter.
        analyticsQueue
            .add("track-link-click", {
                linkId: link.linkId,
                linkOwnerId: link.linkOwner,
                shortCode: link.shortCode,
                longUrl: link.longUrl,
                ip,
                userAgent,
                referer,
                clickedAt: new Date(),
            })
            .catch((queueError) => {
                console.error("Failed to enqueue analytics job", queueError);
            });

        return res.redirect(link.longUrl)

    } catch (error) {
        next(error)
    }
}

async function getAllShortUrl(req,res,next){
    try {
        const allShortUrls = await linkService.getAllShortUrls(req.user._id)

        return res
            .status(StatusCodes.OK)
            .json({
                status : true,
                message : "All short URLs fetched successfully",
                error : {},
                data : allShortUrls
            })
    } catch (error) {
        next(error)
    }
}

async function getShortUrl(req,res,next){
    try {
        const { id } = req.params

        const shortUrl = await linkService.getUserShortUrl(id, req.user._id)

        return res
            .status(StatusCodes.OK)
            .json({
                status : true,
                message : "Short URL fetched successfully",
                error : {},
                data : shortUrl
            })
    } catch (error) {
        next(error)
    }
}

async function updateShortUrl(req,res,next){
    try {
        const { id } = req.params
        const { longUrl, linkName } = req.body

        const updatedShortUrl = await linkService.updateUserShortUrl(id, req.user._id, {
            longUrl,
            linkName
        })

        return res
            .status(StatusCodes.OK)
            .json({
                status : true,
                message : "Short URL updated successfully",
                error : {},
                data : updatedShortUrl
            })
    } catch (error) {
        next(error)
    }
}

async function deleteShortUrl(req,res,next){
    try {
        
        const { id } = req.params
        
        await linkService.deleteUserShortUrl(id, req.user._id)

        return res
            .status(StatusCodes.OK)
            .json({
                status : true,
                message : "Short URL deleted successfully",
                error : {},
                data : {}
            })
    } catch (error) {
        next(error)
    }
}

export {
    createShortUrl,
    redirectToLongUrl,
    getAllShortUrl,
    getShortUrl,
    updateShortUrl,
    deleteShortUrl
}