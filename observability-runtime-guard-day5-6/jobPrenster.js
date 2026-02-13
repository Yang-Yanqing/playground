//Why exists?
//Because those date of error cannot go frontend for the gurrente of safe.

export const toJobResponse=(job)=>{
    const jobId=job.id;
    const jobStatus=job.status;

    let jobRespose={
        jobId,
        status:jobStatus,
    }

    if(jobStatus==="FAILED"){
        return {
            jobId,
            status:jobStatus,
            error:{
                code:job.errorCode??"JOB_FAILED",
                message:"Job failed, Please retry later"
            }

        }
    }

    return jobRespose;
}

