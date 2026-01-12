import { assertStatus } from "../domain/taskStatus";
import insertTask from "../db/task.repo";
import {ulid} from "ulid"


export const createTask=async (name)=>{
    if(!name)throw new Error("Name is required");
    const id=ulid();
    const created_at=Date.now();
    assertStatus("PENDING");
    const status="PENDING";
    const task={
        id:id,
        name:name,
        status:status,
        created_at:created_at,
    };
    return await insertTask(id,task);
}