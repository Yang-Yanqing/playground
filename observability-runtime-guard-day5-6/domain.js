const ALLOWED_STATUS={
    PENDING:"PENDING",
    RUNNING:"RUNNING",
    DONE:"DONE",
    FAILED:"FAILED",
}

const STATUS_FLOW={
    PENDING:[RUNNING],
    RUNNING:[DONE,FAILED],
    DONE:[],
    FAILED:[]
}

export const handleStatus=(jobStatus)=>{
    if(!Object.values(ALLOWED_STATUS).includes(jobStatus)){
        throw new Error("Status is invalid");
    }
    return jobStatus;
}

export const handleTransitions=(currentStatus,nextStatus)=>{
    handleStatus(currentStatus);
    handleStatus(nextStatus);
    if(!STATUS_FLOW[currentStatus].includes(nextStatus)){
        throw new Error("Transition is invalid");
    }
    return nextStatus;
}