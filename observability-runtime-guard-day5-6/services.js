import { handleTransitions } from "./domain.js";
import ulid from 'ulid';
import { logInfo,logError } from "./logger.js";
import { inc } from "./metrics.js";


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
    logInfo("Job_created",job);
    inc("job_total");
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
    const jobStartedAt=Date.now();
    found.status=nextStatus;
    found.jobStartedAt=jobStartedAt;
    inc("job_running");
    logInfo("Status_changed",{found,from:currentStatus,to:nextStatus});
    jobs.set(jobId,found);
    try {
        await sleep(30000);
        const jobStatus=found.status;
        const jobWorkTime=Date.now()-found.jobStartedAt;
        if(Number(jobWorkTime)<=30000){
        if(handleTransitions(jobStatus,"DONE")){
            found.status="DONE";
            found.updatedAt=Date.now();
            jobs.set(jobId,found);
            inc("job_running",-1);
            logInfo("Status_changed",{found,from:jobStatus,to:"DONE"});
            return found;
        }}else{
            found.status="FAILED";
            found.errorCode="JOB_TIMEOUT";
            found.errorDetail="exceeded 30000 ms"
            logError("job_failed",found)
            inc("job_running",-1);
            inc("job_failed");
        }
    } catch (error) {
        found.status="FAILED";
        found.errorCode="JOB_FAILED";
        found.errorDetail=Error instanceof Error ? error.message:String(error);
        found.updatedAt=Date.now();
        jobs.set(jobId,found);
        logError("Job_Failed",found);
        inc("job_running",-1);
        inc("job_failed")
        return found;
            }
}