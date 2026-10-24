import { ConflictError } from "../../errors/conflictError.js";
import { InternalServerError } from "../../errors/internalServerError.js";
import { NotFound } from "../../errors/notFound.js";
import { generateShortCode } from "../../utils/shortCode.util.js";
import { AnalyticsRepository } from "../analytics/analytics.repo.js";
import { AnalyticsService } from "../analytics/analytics.service.js";

const MAX_SHORT_CODE_ATTEMPTS = 5

function isDuplicateShortCodeError(error){
    return error?.code === 11000 && Boolean(error?.keyPattern?.shortCode ?? error?.keyValue?.shortCode)
}

export class LinkService{
    constructor(linkRepository, linkCache = null){
        this.LinkRepository = linkRepository
        this.linkCache = linkCache
    }
    analyticsService = new AnalyticsService(new AnalyticsRepository())

    async createShortUrl(linkData){
        try {

            // longUrl is enforced at the route validation layer; keep a service guard as defense in depth
            if (!linkData.longUrl) {
                throw new ConflictError("URL not passed")
            }

            // the unique index on shortCode is the source of truth: insert, and retry with a new code on E11000
            for (let attempt = 1; attempt <= MAX_SHORT_CODE_ATTEMPTS; attempt++) {
                const shortUrl = {
                    linkName : linkData.linkName || "Default Name",
                    shortCode : generateShortCode(),
                    longUrl : linkData.longUrl,
                    linkOwner : linkData.linkOwner
                }

                try {
                    return await this.LinkRepository.createLink(shortUrl)
                } catch (error) {
                    if (!isDuplicateShortCodeError(error)) throw error
                    console.warn("[link] short code collision, retrying", { shortCode: shortUrl.shortCode, attempt })
                }
            }

            throw new InternalServerError("Error while generating short code")
        } catch (error) {
            throw error
        }
    }

    async getAllShortUrls(userId){
        try {
            const allShortUrls = await this.LinkRepository.getAllShortUrls(userId)

            return allShortUrls;
        } catch (error) {
            throw error
        }
    }

    async getLongUrl(shortCode){
        try {
            const longUrl = await this.LinkRepository.getShortUrl(shortCode)

            if(!longUrl){
                throw new NotFound("Long Url", "")
            }

            
            return longUrl.longUrl;
        } catch (error) {
            throw error;
        }
    }

    // redirect hot path (cache-aside): Redis first, MongoDB on a miss, then populate the cache
    async getLinkByShortCode(shortCode){
        try {
            const cached = await this.linkCache?.get(shortCode);
            if(cached){
                return cached;
            }

            const link = await this.LinkRepository.getShortUrl(shortCode);

            if(!link){
                throw new NotFound("Link", shortCode);
            }

            await this.linkCache?.set(link);

            return {
                linkId : String(link._id),
                linkOwner : String(link.linkOwner),
                shortCode : link.shortCode,
                longUrl : link.longUrl
            };
        } catch (error) {
            throw error;
        }
    }

    async incrementVisits(linkId){
        try {
            return await this.LinkRepository.incrementVisits(linkId);
        } catch (error) {
            throw error;
        }
    }

    async getUserShortUrl(linkId, ownerId){
        try {
            const shortUrl = await this.LinkRepository.getShortUrlByIdAndOwner(linkId, ownerId)

            return shortUrl;
        } catch (error) {
            throw error;
        }
    }

    async updateUserShortUrl(linkId, ownerId, linkData){
        try {
            if(!linkData.longUrl && !linkData.linkName){
                throw new ConflictError("Nothing to update")
            }

            const updatedShortUrl = await this.LinkRepository.updateShortUrl(linkId, ownerId, linkData)

            // drop the cached redirect so the next click reads the new longUrl from MongoDB
            await this.linkCache?.invalidate(updatedShortUrl.shortCode);

            // for updating long url in analytics documents when long url is updated
            await this.analyticsService.updateLongUrl(linkId, linkData.longUrl);

            return updatedShortUrl
        } catch (error) {
            throw error;
        }
    }

    async deleteUserShortUrl(linkId, ownerId){
        try {
            const deletedShortUrl = await this.LinkRepository.deleteShortUrl(linkId, ownerId)

            // a deleted link must stop redirecting immediately, not after the cache TTL
            await this.linkCache?.invalidate(deletedShortUrl.shortCode);

            // for deleting analytics documents when link is deleted
            await this.analyticsService.onDeleteCascadeAanlytics(linkId);

            return deletedShortUrl
        } catch (error) {
            throw error
        }
    }
}