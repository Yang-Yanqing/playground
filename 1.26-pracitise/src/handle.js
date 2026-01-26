const handleStatus=(status)=>{
  const ALLOWED_STATUS={
    PENDING:"PENDING",
    RUNNING:"RUNNING",
    DONE:"DONE",
    FAILED:"FAILED",
  }
 
  
  if(!Object.values(ALLOWED_STATUS).includes(status)){throw new Error("Invalid task status")};
  
  return status;  
}

const allowTransition=(status,nextStatus)=>{
    const STATUS_FLOW={
    PENDING:["RUNNING"],
    RUNNING:["DONE","FAILED"],
    DONE:[],
    FAILED:[],
  }
  if(!task||!id){throw new Error("Invalid task")};
  const status=task.get(id);
  if(!Object.values(ALLOWED_STATUS).includes(status)){throw new Error("Invalid task status")};
  if(!STATUS_FLOW[status].includes(nextStatus)){throw new Error("Invalid status changing")};
  return nextStatus;  

}
export  {handleStatus,allowTransition};