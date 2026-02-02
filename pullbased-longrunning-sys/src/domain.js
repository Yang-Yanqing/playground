// src/domain.js

const ALLOW_STATUS={
    PENDING:"PENDING",
    RUNNING:"RUNNING",
    DONE:"DONE",
    FAILED:"FAILED",
}
const STATUS_FLOW={
    PENDING:["RUNNING"],
    RUNNING:["DONE","FAILED"],
    DONE:[],
    FAILED:[],
}


const handleStatus=(jobStatus)=>{
   if(!Object.values(ALLOW_STATUS).includes(jobStatus)){
    throw new Error("Invalid status")
   }
   return jobStatus;
}

const handleTransitions=(currentStatus,nextStatus)=>{
   handleStatus(currentStatus);
   handleStatus(nextStatus);
   if(!STATUS_FLOW[currentStatus].includes(nextStatus)){
    throw new Error("Invalid transitions")
   }
   return true;
}

export {handleStatus,handleTransitions};