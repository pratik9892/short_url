import { StatusCodes } from "http-status-codes"
import { NotImplemented } from "../../errors/notImplemented.js"
import { LinkRepository } from "./link.repo.js"
import { LinkService } from "./link.service.js"
import { analyticsQueue } from "../../infrastructure/queue/analyticsQueue.js"

const linkService = new LinkService(new LinkRepository)


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

        // fire-and-forget: track click asynchronously via queue
        try {
            const ip =
                (req.headers["x-forwarded-for"] &&
                    req.headers["x-forwarded-for"].split(",")[0].trim()) ||
                req.ip;

            const userAgent = req.headers["user-agent"];
            const referer = req.headers["referer"] || req.headers["referrer"];

            await analyticsQueue.add("track-link-click", {
                linkId: link._id,
                linkOwnerId: link.linkOwner,
                shortCode: link.shortCode,
                longUrl: link.longUrl,
                ip,
                userAgent,
                referer,
                clickedAt: new Date(),
            });

            // increment total visits counter on the link document
            await linkService.incrementVisits(link._id);
        } catch (queueError) {
            console.error("Failed to enqueue analytics job", queueError);
        }

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