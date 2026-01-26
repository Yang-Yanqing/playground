import {createTask} from "./services"
import {changeStastus} from "./services"
import { Router } from "express"
import app from "./app"

const router=express.Router;
router.post("/create",createTask);
router.patch("/change",changeStastus);

export default router;