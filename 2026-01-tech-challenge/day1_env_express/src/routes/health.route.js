import "dotenv/config";
import express from "express";
import pool from "../db/index.js";

const router=express.Router();

router.get("/health",(req,res)=>{
  res.status(200).json({status:"Ok"});
})

router.get("/db-check",async (req,res)=>{
    try {const result=await pool.query("SELECT NOW() as now");
    res.status(200).json({now:result.rows[0].now});}
    catch(err){console.error(err);
        res.status(500).json({error:"DB check failed."})
    }
})

export default router;
