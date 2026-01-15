import pool from "./index.js";

export const repoFindByid=async (taskId)=>{
    if(!taskId)throw new Error("taskId is required");
    const query=
    'SELECT * FROM tasks WHERE id=$1'
    const values=[taskId];
    try {
        const result=await pool.query(query,values);
        if (result.rows.length===0){return null;}
        return result.rows[0];
    } catch (error) {
        throw new Error("Find task error",{cause:error});   
    }
    }