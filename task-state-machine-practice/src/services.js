import express from "express"
import { handleStatus } from "./handle";
import { allowTransition } from "./handle";
import uuid from "uuid"
import { error } from "console";


const tasks=new Map();
const queue=[];

const createTask=(req,res)=>{
    const name=req.body.name;
    if(!name){return res.status(500).json({error:"name is required"})};
    const id=uuid();
    const status="PENDING";
    if(!handleStatus(status)){return res.status(500).json({error:"Invalid status"})};
    queue.post(id);
    const task=[id,status];
    tasks.set(id,task);
    return res.status(200).json(task);
}

const changeStastus=(req,res)=>{
    const id=req.params.id;
    if(!id){return res.status(500).json({error:"Id is invalid"})};
    const found=tasks.get(id);
    if(!found){return res.status(404).json({error:"Task not found"})}
    const nextStatus=req.body.nextStatus;
    if(!allowTransition(found.status,nextStatus)){return res.status(500).json({error:"Transition is not allowed"})}
    return res.status(201).json(nextStatus);
}

export {createTask,changeStastus};