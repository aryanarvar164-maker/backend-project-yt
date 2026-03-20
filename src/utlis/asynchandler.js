// we call as higher function means function accept function in parameter

// const asynchandler=()=>{}
// const asynchandler=(func)=>{()=>{}}
// const asynchandler=(func)=>()=>{}
// const asynchandler=(func)=>async()=>{}


// m-1 by using try catch
// const asynchandler=(fun)=>async(req,res,next)=>{
//     try {
//         await fun(req,res,next)
//     } catch (error) {
//         res.status(error.code||500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }

//m-2 by usign promises

const asynchandler=(requesthandler)=>{
    (req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asynchandler}