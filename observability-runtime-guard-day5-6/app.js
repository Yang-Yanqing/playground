import express from 'express';
import router from './router.js';
import requestIdMiddleware from './middleware.js';

const app=express();
app.use(requestIdMiddleware);
app.use(express.json());
app.use("/api",router);

export default app;
