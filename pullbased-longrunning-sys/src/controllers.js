// src/controllers.js
import { createJob,findJob } from "./services";



const createJobController=(req,res)=>{
 const jobName=req.body.name;
 const job=createJob(jobName);
 if(!job){return res.status(400).json({error:"Job create failed"})};
 return res.status(201).json({jobId:job.id,status:"PENDING"});
}


const findJobController=(req,res)=>{
    const jobId=req.params.id;
    if(!jobId){res.status(400).json({error:"Job id is required"})};
    const found=findJob(jobId);
    if(!found){res.status(404).json({error:"No job found"})};
    return res.status(200).json(found);
}


export {createJobController,findJobController}