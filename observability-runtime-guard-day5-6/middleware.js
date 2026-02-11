import ulid from 'ulid'

const requestIdMiddleware=(req,res,next)=>{
    const requestId=ulid();
    req.requestId=requestId;
    res.setHeader("x-request-id",requestId)
    next();
}

export default requestIdMiddleware