import { getTaskById } from "../service/service.getTaskByid";

export const handlerGetTaskById=async (req,res) => {
    const taskId=req.params.id;
    if(!taskId){return res.status(400).json({error:"taskId required"})}
    const found=await getTaskById(taskId);
    if(!found){return res.status(404).json({error:"task not found"})}
    return res.status(200).json(found)
}