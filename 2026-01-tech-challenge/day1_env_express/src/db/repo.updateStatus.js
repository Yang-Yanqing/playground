import pool from "./index.js";

export const repoUpdateStatus=async (id,nextStatus)=>{
if(!id){throw new Error("id is required");}
if(!nextStatus){throw new Error("status is required");
}
const query=
`UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *`
const values=[nextStatus,id];
try {
    const result=await pool.query(query,values);
    if(result.rows.length===0){return null;}
    return result.rows[0];
} catch (error) {
    throw new Error("failed to update task status",{cause:error});    
}
}