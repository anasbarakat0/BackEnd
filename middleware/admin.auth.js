const jwt = require('jsonwebtoken');

const isAdmin = (req,res , next)=>{
    if (req.user && req.user.role === 'admin'){
        next();
    }else{
        res.status(401).json({message: "Unauthorized Access"});
    }
};

module.exports={isAdmin};