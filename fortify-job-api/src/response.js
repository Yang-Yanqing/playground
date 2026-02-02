const toJobResponse=(job)=>{
    const jobId=null;
    const status=["PENDING","RUNNING","DONE","FALIED"];
    const result=[];
    const error={
        code:null,
        messagr:null,
    }
    
    
    return job={
        id:jobId,
        status:status,
        result:result,
        error:error,
    }
}


export default toJobResponse;