import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userschema=new Schema({
    watchHistory:[
        {
            type:mongoose.Types.ObjectId,
            ref:"Video",
        }
    ],
    username:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true,
        index:true,     //for optimized searching enable index
    },
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        index:true
    },
    avatar:{
        type:String,  //cloudnary 3rd party for url
        required:true,
    },
    coverImage:{
        type:String,
    },
    password:{
        type:String,
        required:[true,"pass was required"],
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true})

userschema.pre("save",async function(){            //we use function(){} Syntex bcz we want to this access and in ()=>{} this will not provide
    
    if(!this.modeified("password")) return next()

    this.password= await bcrypt.hash(this.password,10)       // 10 was has rounds how many time algo will run
    next()
})

//make new method simply add by method.m_name
userschema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

const { sign } = jwt;
userschema.methods.generateAccessToken=function () {
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userschema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id             //in refreshtoken the payload was min bcz of refresh every time

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",userschema)