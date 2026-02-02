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

export function handleStatus(status){


if (!Object.values(ALLOW_STATUS).includes(status)){throw new Error("Invalid status")};
return status;
}

export function allowTransition(currentStatus,nextStatus){

    handleStatus(currentStatus);
    handleStatus(nextStatus);
    if(!STATUS_FLOW[currentStatus].includes(nextStatus)){throw new Error("Invalid transition")};
    return true;
}