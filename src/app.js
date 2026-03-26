import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

// .use  use when we want to use middlewares and cors settings
app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))   //urlencoded for url special character management
app.use(express.static("public"))   // static use for public folder open for all  and also public was folder name not an mendatory naming co nvention
app.use(cookieParser())   //cookieparser use for set and read cookie from user browser


//import router
import router from "./routes/user.routes.js"

//routes declaration
// app.use("/register",userRouter) router or controller middleware after routing hit

//best practice tell api version also 
app.use("/api/v1/users",router)

//http:local8000/api/v1/user/register




export {app}



/// middlewares was nothing but checker the  given condition was satisy or not before give response or computing the process
