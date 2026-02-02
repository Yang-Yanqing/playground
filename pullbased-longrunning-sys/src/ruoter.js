// src/router.js
import express from "express"
import { Router } from "express"
import { createJobController,findJobController } from "./controllers";


const router=Router();
router.post("/jobs",createJobController);
router.get("/jobs/:id",findJobController);


export default router;