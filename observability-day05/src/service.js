import { handleStatus,handleTransition } from "./domain";
import ulid from "ulid"


let jobs=new Map();
const sleep=async (ms)=>{
    return new Promise((resolve)=>setTimeout(resolve,ms));
}

const createJob=(jobName)=>{
    if(!jobName){throw new Error("Job name is required")};
       const jobId=ulid();
       const createdAt=Date.now();
       const updatedAt=createdAt;
       const result=null;
       const error=null;
       const errorCode=null;
       const errorDetail=null;
       const job={
           name:jobName,
           id:jobId,
           status:"PENDING",
           createdAt:createdAt,
           updatedAt:updatedAt,
           result:result,
           error:error,
           errorCode:errorCode,
           errorDetail:errorDetail,
        }

        jobs.set(jobId,job);
        return job;   
}

const findJob=(jobId)=>{
    if(!jobId){throw new Error("Job Id is required")};
        const found=jobs.get(jobId);
        if(!found){throw new Error("Job not found")};
        return found;
   
}

const workJob=async (jobId)=>{
    if(!jobId){throw new Error("Job Id is required")};
    const job=jobs.get(jobId);
    const currentStatus=job.status;
    if(handleTransition(currentStatus,"RUNNING")){
      job.status="RUNNING";
      jobs.set(jobId,job);    
    };
    try {
        await sleep(30000);
        const jobStatus=job.status;
        if(handleTransition(jobStatus,"DONE")){
            job.status="DONE";
            jobs.set(jobId,job);
            return job;
        }
        
    } catch (error) {
        job.status="FAILED";
        job.errorCode="JOB_FAILED";
        job.errorDetail=error instanceof Error ? error.message:String(error);
        job.updatedAt=Date.now();
        jobs.set(jobId,job);
        return job;
        }     
}

export {createJob,findJob,workJob};  