import { createTask } from "../service/task.service";

export const handlerTask=async (req,res)=>{
   const name=req.body.name;
   if(!name){return res.status(400).json({error:"name is required"})};
   const task=await createTask(name);
   return res.status(201).json({taskId:task.id});
}