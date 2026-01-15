import { updateTaskStatus } from "../service/service.updateTaskStatus";

export const handlerUpdateTaskStatus=async(req,res)=>{
    const id=req.params.id;
    if(!id){return res.status(400).json({error:"invalidad id"})};
    const status=req.body.status;
    if(!status){return res.status(400).json({error:"status is required"})}

    const updated=await updateTaskStatus(id, status)
    if(!updated){return res.status(409).json({error:"update failed"})}
    return res.status(200).json(updated)   
}