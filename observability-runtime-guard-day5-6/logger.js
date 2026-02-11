const logInfo=(event,meta)=>{
    const payload={
        level:"info",
        event,
        at:new Date().toISOString(),
        ...meta,
    }
    console.log(JSON.stringify(payload));
};


const logError=(event,meta)=>{
    const payload={
        level:"error",
        event,
        at:new Date().toDateString(),
        ...meta,
    }
    console.log(JSON.stringify(payload));
};

export {
    logInfo,
    logError,
};