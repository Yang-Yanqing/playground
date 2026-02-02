// src/services.js
import { handleTransitions } from "./domain";
import ulid from "ulid";


const jobs=new Map();
const queue=[];
const sleep=async (ms)=>{
    return new Promise(resolve=>setTimeout(resolve,ms));
}

const createJob=(jobName)=>{
    if(!jobName){throw new Error("Job name is required")};
    const jobId=String(ulid());
    const jobStatus="PENDING";
    const result=null;
    const error=null;
    const createdAt=Date.now();
    const updatedAt=createdAt;
    const job={
        id:jobId,
        status:jobStatus,
        result:result,
        error:error,
        createdAt:createdAt,
        updatedAt:updatedAt,
    }
    if(!job){throw new Error("No job has created")};
    jobs.set(jobId,job);
    queue.push(jobId);
    setImmediate(()=>workJob(jobId));
    return job;
}

const workJob=async (jobId)=>{
    try {if(!jobId){throw new Error("Job id is required")};
         const job=jobs.get(jobId);
         const currentStatus=job.status;
         if(currentStatus!=="PENDING"){throw new Error("Invalid job for workon")};
         const runningStatus="RUNNING";
         handleTransitions(job.status,runningStatus);
         job.status=runningStatus;
         job.updatedAt=Date.now();
         jobs.set(jobId,job);
         await sleep(30000);  
        const nextStatus="DONE";
        if(!handleTransitions(currentStatus,nextStatus)){
           throw new Error("Invalid transition");
        }
        job.status=nextStatus;
        const result="I have done this"
        job.result=result;
        job.updatedAt=Date.now();
        jobs.set(jobId,job);
        return {nextStatus,result};
    } catch (error) {
        const nextStatus="FAILED";
        const job=jobs.get(jobId)
        handleTransitions(job.status,nextStatus);
        job.status=nextStatus;
        job.error=error instanceof Error?error.message:String(error);
        job.updatedAt=Date.now();
        jobs.set(jobId,job);
        return {
            nextStatus,error
        }
    }
}


const findJob=(jobId)=>{
    if(!jobId){throw new Error("Job id is required")};
    const found=jobs.get(jobId);
    if(!found){throw new Error("Job not found")};
    const jobStatus=found.status;
    if(jobStatus==="DONE"){
        const jobResult=found.result;
        return {jobId,status:jobStatus,result:jobResult}
    }else if(jobStatus==="FAILED"){
        const jobError=found.error;
        return {jobId,status:jobStatus,error:jobError};
    }else{
        return {jobId,status:jobStatus};
    }
}


export {
    createJob,
    workJob,
    findJob
}