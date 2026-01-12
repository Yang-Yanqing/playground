import pool from "./index";

const insertTask=async (taskId,input)=>{
    if(!taskId)throw new Error("taskId is required.");
    if(!input)throw new Error("input is required");
    
    const query=
    'INSERT INTO tasks (id,name,status,created_at) VALUES ($1,$2,$3,$4) RETURNING *;';
    const values=[input.id,input.name,input.status,input.created_at];
    try {
        const result=await pool.query(query,values);
        console.log("Inserted task",result.rows[0]);
        return result.rows[0];
    } catch (error) {
       throw new Error("Inserted task error",{cause:error});  
    }
}

export default insertTask;