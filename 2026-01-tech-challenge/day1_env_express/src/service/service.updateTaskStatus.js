import { repoFindByid } from "../db/repo.findbyid";
import { repoUpdateStatus } from "../db/repo.updateStatus";
import { assertStatus } from "../domain/taskStatus";
import { canTransition } from "../domain/taskStatus";

export const updateTaskStatus=async (id,nextStatus)=>{
    const task=await repoFindByid(id);
    if(!task){throw new Error("task not found")}
    assertStatus(nextStatus)
    
    const currentStatus=task.status;
    if(!canTransition(currentStatus,nextStatus)){throw new Error("transition invalidad");}
    return await repoUpdateStatus(id,nextStatus);
}