import { deleteTaskById } from "../service/service.deleteTask";

export const handlerDeleteTaskById=async (req , res,next)=>{
    const id=req.params.id;
    if(!id){return res.status(400).json({error:"id is required"})};
    
    try{const deleted=await deleteTaskById(id);
    return res.status(204).send();}
    catch(error){next(error)};
}