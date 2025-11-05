import { NotFound } from "../../errors/NotFound.js";
import { Link } from "./link.model.js";

export class LinkRepository {

    async createLink(linkData){
        try {
            const createdLink = await Link.create({
                linkName : linkData.linkName,
                shortCode : linkData.shortCode,
                longUrl : linkData.longUrl,
                linkOwner : linkData.linkOwner,
            })

            if(!createdLink){
                throw new NotFound("Create Short Link","")
            }

            return createdLink;
        } catch (error) {
            console.log(error);
            throw error
        }
    }

    async getShortUrl(shortCode){
        try {
            const shortUrl = await Link.findOne({shortCode : shortCode})

            
            return shortUrl;
        } catch (error) {
            console.log(error);
            throw error
        }
    }

    async getAllShortUrls(userId){
        try {
            const allShortUrls = await Link.find({linkOwner : userId})

            if(!allShortUrls){
                throw new NotFound("No short URLs")
            }
            return allShortUrls;
        } catch (error) {
            console.log(error);
            throw error
        }
    }

    async updateShortUrl(linkId,linkData){
        try {
            const updatedShortUrl = await Link.findByIdAndUpdate(
                linkId,
                {
                    longUrl : linkData.longUrl
                },
                {
                    new : true
                }
            )

            return updatedShortUrl
        } catch (error) {
            console.log(error);
            throw error
        }
    }

    async incrementVisits(linkId){
        try {
            const updatedVisits = await Link.findByIdAndUpdate(
                linkId,
                {
                    $inc : {visits : 1}
                },
                {
                    new : true
                }
            )

            return updatedVisits.visits
        } catch (error) {
            console.log(error);
            throw error
        }
    }

    async deleteShortUrl(linkId){
        try {
            const deletedLink = await Link.findByIdAndDelete(linkId)
            
            return deletedLink
        } catch (error) {
            console.log(error);
            throw error
        }
    }
}