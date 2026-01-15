import pool from "./index";

export const repoDeleteById=async (id)=>{
    if(!id){throw new Error("id is required");}
    const query=
    `DELETE FROM tasks WHERE id=$1 RETURNING *`;
    const values=[id];
    try {
        const result=await pool.query(query,values);
        if(result.rows.length===0){return null};
        return result.rows[0];
    } catch (error) {
        throw new Error("Delete task error",{cause:error});       
    }
}