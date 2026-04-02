import {asynchandler} from "../utlis/asynchandler.js"
import {ApiError} from "../utlis/apiError..js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utlis/cloudinary.js"
import {ApiResponse} from "../utlis/Apiresponse.js"
import JWT from "jsonwebtoken"
import mongoose from "mongoose"

const registerUser=asynchandler(async(req,res)=>{
    //if error occur check and return it
    // return res.Status(200).json({
    //     message:"ok"
    // })


    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {username,fullName,email,password}=req.body      //data from form and json can extract from body 
    // console.log("username ",username);

    // if(fullName=== ""){                                            ///we check all fields like this 
    //     throw new ApiError(400,"fullName was rewuired")
    // }
    
    if ([username,fullName,email,password].some((fields)=>(fields?.trim()===""))) {
        throw new ApiError(400,"all fields must compulsory")
    }

    const existeduser= await User.findOne({
        $or:[{username: username},{email}]
    })
    if(existeduser){
        throw new ApiError(400,"user already exist")
    }

    // console.log("the body  :> ",res.body);

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar was mendatory to fill")
    }
    
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar was mendatory to fill")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")      //this select syntex add in string by -name who dont add

    if(!createdUser){
        throw new ApiError(500,"something went wrong while register the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registred succesfully")
    )

})

const generateAccessAndRefereshTokens  = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"tokens not valid")
    }
}

const loginUser=asynchandler(async(req,res)=>{
    //username or email
    //find the user
    //check password
    //access token and refresh token
    //send cookie    ??

    const { username,password,email } = req.body

    if(!username && !email){
        throw new ApiError(401,"username or email must required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(400,"user was not found || detailes are invalid")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
 
    if(!isPasswordValid){
        throw new ApiError(402,"user credential not found")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens (user._id)    

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken" )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken,
            },
            "loggenIn successfully"

        )
    )

})

const logoutUser = asynchandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asynchandler( async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unaouthorized request")
    }

    try {
        const decoded =  JWT.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decoded._id)
    
        if(!user){
            throw new ApiError(401,"invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refresh token was expired or use")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
                new ApiResponse(
                    200, 
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asynchandler(async(req,res)=>{
    const { oldPassword,newPassword } = req.body

    const user = User.findById( req?.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect( oldPassword )

    if(!isPasswordCorrect){
        throw new ApiError(400,"password was incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"password changed successfully")
    )

})

const getCurrentUser = asynchandler(async(req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "current user details fetched successfully")
    )
})

const updateAccountDetails = asynchandler(async(req,res)=>{
    const { fullName,email } = req.body

    if(!fullName || !email){
        throw new ApiError(400, "all fields are necessay to fill")
    }

    const user = await User.findByIdAndUpdate (
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    return res.status(200)
    .json(
        new ApiResponse(200, user, "update account details")
    )
})

const updateUserAvatar = asynchandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file was missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar?.url){
        throw new ApiError(500, "avatar image on cloudinary was failed")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "updated avatar image")
    )
})

const updateUserCoverImage = asynchandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file was missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage?.url){
        throw new ApiError(500, "cover image on cloudinary was failed")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "updated cover image")
    )
})

const getUserChannelProfile = asynchandler(async(req,res)=>{
    const { username } = req.params

    if(!username){
        throw new ApiError(400, "username is not found")
    }

    const channel = await User.aggregate([
        {
            $match:{
            username:username
            }
        },

        {
            $lookup:{
                from:"subscriptions",            //always right the dp name menas plural small letter
                localField:"_id",
                foreignField:"channel",
                as:"channel-subsriber"
            }
        },
        {
            $lookup:{
                from:"subscriptions",            //always right the dp name menas plural small letter
                localField:"_id",
                foreignField:"subscriber",
                as:"user-subscribed-channels"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$channel-subsriber"
                },
                channelSubscribedTo:{
                    $size:"$user-subscribed-channels"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$channel-subsriber?.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                username:1,
                fullName:1,
                email:1,
                avatar:1,
                coverImage:1,
                isSubscribed:1,
                subscriberCount:1,
                channelSubscribedTo:1
            }
        }
    ])

    if(!channel?.length){
        return new ApiError(400,"channel not exist")
    }

    return res
    .status(200)
    .jaon(
        new ApiResponse(200,channel[0],"channel data fetched succesfully")
    )

})

const getWatchHistory = asynchandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                       $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                       } 
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "watchHistory fetch successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    generateAccessAndRefereshTokens,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}