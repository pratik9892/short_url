import { StatusCodes } from "http-status-codes"
import { NotImplemented } from "../../errors/notImplemented.js"
import { LinkRepository } from "./link.repo.js"
import { LinkService } from "./link.service.js"

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
        throw new NotImplemented("getLongUr")
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
        throw new NotImplemented("getShortUrl")
    } catch (error) {
        next(error)
    }
}

async function updateShortUrl(req,res,next){
    try {
        throw new NotImplemented("updateShortUrl")
    } catch (error) {
        next(error)
    }
}

async function deleteShortUrl(req,res,next){
    try {
        throw new NotImplemented("deleteShortUrl")
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