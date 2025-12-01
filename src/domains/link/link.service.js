import { ConflictError } from "../../errors/conflictError.js";
import { InternalServerError } from "../../errors/internalServerError.js";
import { NotFound } from "../../errors/NotFound.js";
import { generateShortCode } from "../../utils/shortCode.util.js";

export class LinkService{
    constructor(linkRepository){
        this.LinkRepository = linkRepository
    }

    async createShortUrl(linkData){
        try {

            if(!linkData.linkName || !linkData.longUrl){
                throw new ConflictError("Name or URL not passed")
            }

            const shortCode = generateShortCode()
            
            
            
            const ifShortCodeExists = await this.LinkRepository.getShortUrl(shortCode)
            
            
            if(ifShortCodeExists){
                throw new InternalServerError("Error while generating short code")
            }

            const shortUrl = {
                linkName : linkData.linkName,
                shortCode : shortCode,
                longUrl : linkData.longUrl,
                linkOwner : linkData.linkOwner
            }
            
            
            
            const createdShortUrl = await this.LinkRepository.createLink(shortUrl)
           
            
            return createdShortUrl
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

    async getLinkByShortCode(shortCode){
        try {
            const link = await this.LinkRepository.getShortUrl(shortCode);

            if(!link){
                throw new NotFound("Link", shortCode);
            }

            return link;
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

            return updatedShortUrl
        } catch (error) {
            throw error;
        }
    }

    async deleteUserShortUrl(linkId, ownerId){
        try {
            const deletedShortUrl = await this.LinkRepository.deleteShortUrl(linkId, ownerId)

            return deletedShortUrl
        } catch (error) {
            throw error
        }
    }
}