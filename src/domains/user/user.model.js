import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : [true , "username is required"],
        trim : true,
        index : true,
        unique : true,
        lowercase : true
    },
    fullName : {
        type : String,
        required : [true, "FullName is required"],
        trim : true,
        index : true
    },
    email : {
        type : String,
        required : [true,"email is required"],
        trim : true,
        unique : true
    },
    password : {
        type : String,
        required : [true , "Password is required"]
    },
    refreshToken : {
        type : String
    }
})



export const User = mongoose.model("User" , userSchema)