import { User } from "../models/user.models";
import { ApiError } from "../utlis/apiError.";
import { asynchandler } from "../utlis/asynchandler";
import jwt from "jsonwebtoken"

export const verifyJWT = asynchandler(async (req,res,next)=>{

    try {
        const token = req.cookies?.accessToken || req.header("Autherization")?.replace("Bearer","")
    
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
    
        const decodeToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user=await User.findById(decodeToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401,"invalid Access Token")
        }
    
        req.user=user;
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "error invalid  access token")
    }
})