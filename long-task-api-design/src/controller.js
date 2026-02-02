import {createTask,findTask,statusTransition,workerTask} from "./service"


const createTaskController=(req,res)=>{
  const taskName=req.body.name;
  try {
    const task=createTask(taskName);
    workerTask(task.id);
    return res.status(201).json(task);
      } catch (error) {
    return res.status(400).json({error:"Task create failed"});
  }
  
};


const findTaskController=async (req,res)=>{
    const taskId=req.params.id;
    try {
           const found=findTask(taskId);
           return res.status(200).json(found);           
    } catch (error) {
        return res.status(404).json({error:"Task not found"});
    }
};

const statusTransitionController=(req,res)=>{
    const nextStatus=req.body.status;
    const taskId=req.params.id;
    try {
        const task=statusTransition(taskId,nextStatus);
        return res.status(200).json(task);
        
    } catch (error) {
        const msg=String(error?.message||"");
        if(msg.includes("not found")){return res.status(404).json({error:"Task not found"})};
        if(msg.includes("transition")){return res.status(409).json({error:"Invalid transition"})};
        return res.status(400).json({error:"Invalid input"});
    }
    
}

export {
    createTaskController,
    findTaskController,
    statusTransitionController
}