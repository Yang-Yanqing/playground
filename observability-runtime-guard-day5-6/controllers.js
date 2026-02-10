import { createJob,findJob,workJob,workJob,workJob,workJob,workJob } from "./services";
import { toJobResponse } from "./jobPrenster";


export const createJobController=(req,res)=>{
    const jobName=req.body.name;
    if(!jobName){return res.status(400).json({error:"Name is required"})};
    const job=createJob(jobName);
    return res.status(201).json(job);
};

export const findJobController=(req,res)=>{
    const jobId=req.params.id;
    if(!jobId){return res.status(400).json({error:"Job Id is required"})};
    const found=findJob(jobId);
    if(!found){return res.status(404).json({error:"Job not found"})};
    const jobRespose=toJobResponse(found)
    return res.status(200).json(jobRespose);
};


export const workJobController=async (req,res)=>{
    const jobId=req.params.id;
    if(!jobId){return res.status(400).json({error:"Job Id is required"})};
    const workJob=workJob(jobId)
    try {
        const jobRespose=toJobResponse(workJob);
        return res.status(200).json(jobRespose);
    } catch (error) {
        const jobRespose=toJobResponse(workJob);
        return res.status(500).json(jobRespose);
    }
}
