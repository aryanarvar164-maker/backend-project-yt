import {asynchandler} from "../utlis/asynchandler.js"
import {ApiError} from "../utlis/apiError..js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utlis/cloudinary.js"
import {ApiResponse} from "../utlis/Apiresponse.js"

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
    console.log("username ",username);

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


export {registerUser}