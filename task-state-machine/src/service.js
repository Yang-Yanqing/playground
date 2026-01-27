import {handleStatus,allowTransition} from "./domain"
import ulid from "ulid"

let tasks=new Map();

const createTask=(taskName)=>{
    if(!taskName){throw new Error("Name is required")};
    const taskId=ulid();
    const status="PENDING";
    const task={
        name:taskName,
        id:taskId,
        status:status,
    }
    tasks.set(taskId,task);
    return task;
}

const findTask=(taskId)=>{
    if(!taskId){throw new Error("Invalid taskid")};
    const found=tasks.get(taskId);
    if(!found){throw new Error("Task not found")};
    return found;    
}

const statusTransition=(taskId,nextStatus)=>{
    if(!taskId){throw new Error("Invalid taskid")};
    handleStatus(nextStatus);
    const task=findTask(taskId);
    const currentStatus=task.status;
    allowTransition(currentStatus,nextStatus);
    task.status=nextStatus    
    return task;
}

export {
    createTask,
    findTask,
    statusTransition,
}