import { handleTransitions } from "./domain.js";
import {ulid} from 'ulid';
import { logInfo,logError } from "./logger.js";
import { inc } from "./metrics.js";

const JOB_SIM_MS=30000;
const JOB_TIMEOUT_MS=60000;


const sleep=async(ms)=>{
    return new Promise((resolve)=>setTimeout(resolve,ms));
}
const jobs=new Map();

export const createJob=(jobName,meta={})=>{
    if(!jobName){throw new Error("Job name is required")};
    const jobId=ulid();
    
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
        requestId:meta.requestId??null,
        createdAt:createdAt,
        updatedAt:updatedAt,
        result:result,
        error:error,
        errorCode:errorCode,
        errorDetail:errorDetail,
    }

    jobs.set(jobId,job);
    logInfo("job_created",{jobId,status:jobStatus,requestId:meta.requestId});
    inc("job_total");
    setImmediate(()=>workJob(jobId))
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
    logInfo("job_status_changed",{jobId,from:currentStatus,to:nextStatus});
    jobs.set(jobId,found);
    try {
        await sleep(JOB_SIM_MS);
        const jobStatus=found.status;
        const jobWorkTime=Date.now()-found.jobStartedAt;
        if(Number(jobWorkTime)<=JOB_TIMEOUT_MS){
        if(handleTransitions(jobStatus,"DONE")){
            found.status="DONE";
            found.result="COMPLETED"
            found.updatedAt=Date.now();
            jobs.set(jobId,found);

            inc("job_running",-1);
            logInfo("job_status_changed",{jobId,from:jobStatus,to:"DONE"});
            return found;
        }}else{
            found.status="FAILED";
            found.errorCode="JOB_TIMEOUT";
            found.errorDetail="exceeded 60000 ms";
            found.updatedAt=Date.now();
            jobs.set(jobId,found);
            logError("job_timeout",{jobId,requestId:found.requestId,errorCode:found.errorCode,errorDetail:found.errorDetail})
            inc("job_running",-1);
            inc("job_failed");
            return found;
        }
    } catch (error) {
        found.status="FAILED";
        found.errorCode="JOB_FAILED";
        found.errorDetail=error instanceof Error ? error.message:String(error);
        found.updatedAt=Date.now();
        jobs.set(jobId,found);
        logError("job_Failed",found);
        inc("job_running",-1);
        inc("job_failed")
        return found;
            }
}