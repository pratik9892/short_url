import { ConflictError } from "../../errors/conflictError.js";
import { InternalServerError } from "../../errors/internalServerError.js";
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
}