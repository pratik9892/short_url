import mongoose from "mongoose";
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

    async getLongUrl(shortCode){
        try {
            const longUrl = await Link.findOne({shortCode : shortCode})

            
            return longUrl;
        } catch (error) {
            console.log(error);
            throw error
        }
    }

    async getShortUrlByIdAndOwner(linkId, ownerId){
        try {
            if(!mongoose.Types.ObjectId.isValid(linkId)){
                throw new NotFound("Link", linkId)
            }

            const shortUrl = await Link.findOne({
                _id : linkId,
                linkOwner : ownerId
            })

            if(!shortUrl){
                throw new NotFound("Link", linkId)
            }

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

    async getShortUrl(shortCode){
        try {
            const shortUrl = await Link.findOne({shortCode : shortCode})

            
            return shortUrl;
        } catch (error) {
            console.log(error);
            throw error
        }
    }

    async updateShortUrl(linkId, ownerId, linkData){
        try {
            if(!mongoose.Types.ObjectId.isValid(linkId)){
                throw new NotFound("Link", linkId)
            }

            const updatedShortUrl = await Link.findOneAndUpdate(
                {
                    _id : linkId,
                    linkOwner : ownerId
                },
                {
                    $set : {
                        ...(linkData.linkName ? { linkName : linkData.linkName } : {}),
                        ...(linkData.longUrl ? { longUrl : linkData.longUrl } : {})
                    }
                },
                {
                    new : true
                }
            )

            if(!updatedShortUrl){
                throw new NotFound("Link", linkId)
            }

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

    async deleteShortUrl(linkId, ownerId){
        try {
            if(!mongoose.Types.ObjectId.isValid(linkId)){
                throw new NotFound("Link", linkId)
            }

            const deletedLink = await Link.findOneAndDelete({
                _id : linkId,
                linkOwner : ownerId
            })

            if(!deletedLink){
                throw new NotFound("Link", linkId)
            }
            
            return deletedLink
        } catch (error) {
            console.log(error);
            throw error
        }
    }
}