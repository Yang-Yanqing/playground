import { Router } from "express";
import {
    createTaskController,
    findTaskController,
    statusTransitionController
} from "./controller"


const router=Router();
router.post("/tasks",createTaskController);
router.get("/tasks/:id",findTaskController);
router.patch("/tasks/:id/status",statusTransitionController);


export default router;