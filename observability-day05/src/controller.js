import { createJob,findJob,workJob } from "./service";
import toJobResponse from "./jobPresenter";

const createJobCrntroller=(req,res)=>{
    const jobName=req.body.name;
    if(!jobName){return res.status(400).json({error:"Name is required"})};
    try {
         createJob(jobName);
         res.status(201).json()
    } catch (error) {
        toJobResponse(jobName);
    }
   
}