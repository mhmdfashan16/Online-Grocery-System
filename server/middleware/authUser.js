import jwt from 'jsonwebtoken';

const authUser = async(req, res, next)=>{
    const {token} = req.cookies;

    if(!token){
        return res.json({success:false, message:"Not Authorized"});
    }
    try{
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        if(tokenDecode.id){
            req.userId = tokenDecode.id; //changed req.body.userId= tokenDecode.id
           
        }else{
            return res.json({success:true, message:"Authorized"});
        }
        next();

    }catch(error){
        return res.json({success:false, message:error.message});
    }
}

// const authUser = async (req, res, next) => {
//     const { token } = req.cookies;
  
//     if (!token) {
//       return res.status(401).json({ success: false, message: "Not Authorized" });
//     }
  
//     try {
//       const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
  
//       if (!tokenDecode?.id) {
//         return res.status(401).json({ success: false, message: "Invalid token" });
//       }
  
//       req.userId = tokenDecode.id; // ✅ Attach to req object, not req.body
//       next();
//     } catch (error) {
//       return res.status(401).json({ success: false, message: error.message });
//     }
//   };
  

export default authUser;