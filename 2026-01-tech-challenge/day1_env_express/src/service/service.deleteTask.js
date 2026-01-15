import { repoDeleteById } from "../db/repo.deleteById";

export const deleteTaskById=async (id)=>{
    if(!id){throw new Error("id is required");}
    const deleted=await repoDeleteById(id);
    if(!deleted){throw new Error("task not found");}
    return deleted;
}