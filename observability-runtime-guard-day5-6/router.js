import { Router } from "express";
import { createJobController,findJobController,workJobController } from "./controllers.js";

const router=Router();

router.post("/jobs",createJobController);

router.get("/jobs/:id",findJobController);

router.post("/jobs/:id/work",workJobController);

export default router;