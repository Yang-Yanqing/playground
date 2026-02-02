// src/app.js
import express from "express"
import router from "./ruoter";


const app=express();
app.use(express.json());
app.use(router);

export default app;