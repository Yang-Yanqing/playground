import { repoFindByid } from "../db/repo.findbyid";

export const getTaskById=async (taskId)=>{
    if(!taskId){throw new Error("taskId is required"); }
    return await repoFindByid(taskId);
}