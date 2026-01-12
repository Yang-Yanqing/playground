    const STATUS_FLOW={
        PENDING:["RUNNING"],
        RUNNING:["DONE","FAILED"],
        DONE:[],
        FAILED:[],
    };

export const assertStatus=(status)=>{
    const ALLOW_STATUS=["PENDING","RUNNING","DONE","FAILED",]
    if(!ALLOW_STATUS.includes(status))throw new Error("Invalid status");   
    }


export const canTransition=(currentStatus,nextStatus)=>{
    assertStatus(currentStatus);
    assertStatus(nextStatus);
    if(!STATUS_FLOW[currentStatus].includes(nextStatus))return false;
    return true;    
    }