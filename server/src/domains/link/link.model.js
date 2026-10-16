import mongoose from "mongoose"

const linkSchema = new mongoose.Schema({
    linkName : {
        type : String,
        maxlength : 20,
        default : "Default Name"
    },
    shortCode : {
        type : String,
        required : true,
        unique : true,
        index : true,
        maxlength : 10
    },
    longUrl : {
        type : String,
        required : true
    },
    linkOwner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    visits : {
        type : Number,
        default : 0
    }
},
{
    timestamps : true
})

export const Link = mongoose.model("Link" , linkSchema)