// why exist
// Output boundary for GET /jobs/:id.
// Never leak internal fields (e.g., errorDetail, stack, raw result).

const toJobResponse=(job)=>{
    const jobId=job.id;
    const jobStatus=job.status;

       
    let jobResponse={
        jobId,
        status:jobStatus,
    }

    if(jobStatus==="FAILED"){
        return {
            jobId,
            status:jobStatus,
            error:{code:job.errorCode??"JOB_FAILED",
            message:"Job failed,Please retry later"}
        }
    }
    return jobResponse;
}


export default toJobResponse;