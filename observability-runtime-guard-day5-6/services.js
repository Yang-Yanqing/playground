import { handleStatus } from "./domain";
import { handleTransitions } from "./domain";
import ulid from 'ulid'

const sleep=async(ms)=>{
    return new Promise((resolve)=>setTimeout(resolve,ms));
}
const jobs=new Map();

export const createJob=(jobName)=>{
    if(!jobName){throw new Error("Job name is required")};
    const jobId=ulid();
    const jobName=jobName;
    const jobStatus="PENDING";
    const createdAt=Date.now();
    const updatedAt=createdAt;
    const result=null;
    const error=null;
    const errorCode=null;
    const errorDetail=null; 

    const job={
        id:jobId,
        name:jobName,
        status:jobStatus,
        createdAt:createdAt,
        updatedAt:updatedAt,
        result:result,
        error:error,
        errorCode:errorCode,
        errorDetail:errorDetail,
    }

    jobs.set(jobId,job);
    return job;
};

export const findJob=(jobId)=>{
    if(!jobId){throw new Error("Job id is required")};
    const found=jobs.get(jobId);
    if(!found){throw new Error("No job found")};
    return found;
}

export const workJob=async (jobId)=>{
    if(!jobId){throw new Error("Job id is required")};
    const found=findJob(jobId);
    const currentStatus=found.status;
    if(currentStatus!=="PENDING"){throw new Error("Invalid status")};
    const nextStatus=handleTransitions(currentStatus,"RUNNING");
    found.status=nextStatus;
    jobs.set(jobId,found);
    try {
        await sleep(30000);
        const jobStatus=found.status;
        if(handleTransitions(jobStatus,"DONE")){
            found.status="DONE";
            found.updatedAt=Date.now();
            jobs.set(jobId,found);
            return found;
        }
    } catch (error) {
        found.status="FAILED";
        found.errorCode="JOB_FAILED";
        found.errorDetail=Error instanceof Error ? error.message:String(error);
        found.updatedAt=Date.now();
        jobs.set(jobId,found);
        return found;
            }
}