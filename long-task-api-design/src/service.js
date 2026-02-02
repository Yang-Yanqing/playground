import {handleStatus,allowTransition} from "./domain"
import ulid from "ulid"

let tasks=new Map();
const sleep=(ms)=>{
    return new Promise(resolve=>setTimeout(resolve,ms));
};

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


const workerTask=async (taskId)=>{
   try {
    if(!taskId){throw new Error("No task in processing")}
    statusTransition(taskId,"RUNNING");
    await sleep(30000);
    return statusTransition(taskId,"DONE");
   } catch (error) {
    statusTransition(taskId,"FAILED");
    throw new Error(`Work filed with ${error}` )
   } }

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
    workerTask
}