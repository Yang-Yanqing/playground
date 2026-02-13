import { createJob,findJob } from "./services";
import { toJobResponse } from "./jobPrenster";


export const createJobController=(req,res)=>{
    const jobName=req.body.name;
    if(!jobName){return res.status(400).json({error:"Name is required"})};
    try {
        const job=createJob(jobName,{requestId:req.requestId});
        return res.status(201).json({jobId:job.id,status:"PENDING"});
    } catch (error) {
        return res.status(500).json({error:"INTERNAL_ERROR"});
    }
};

export const findJobController=(req,res)=>{
    const jobId=req.params.id;
    if(!jobId){return res.status(400).json({error:"Job Id is required"})};
    try {
        const found=findJob(jobId);
        const jobRespose=toJobResponse(found);
         return res.status(200).json(jobRespose);
    } catch (error) {
        if(error instanceof Error && error.message==="No job found"){
            return res.status(404).json({error:"NOT_FOUND"});
        }
        return res.status(500).json({error:"INTERNAL_ERROR"})
    }
};


// export const workJobController=async (req,res)=>{
//     const jobId=req.params.id;
//     if(!jobId){return res.status(400).json({error:"Job Id is required"})};
//     const workJob=workJob(jobId)
//     try {
//         const jobRespose=toJobResponse(workJob);
//         return res.status(200).json(jobRespose);
//     } catch (error) {
//         const jobRespose=toJobResponse(workJob);
//         return res.status(500).json(jobRespose);
//     }
// }
