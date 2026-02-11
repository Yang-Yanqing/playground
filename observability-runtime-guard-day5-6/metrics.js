const metrics={
    job_total:0,
    job_running:0,
    job_failed:0,
}


const inc=(metricsName,n=1)=>{
    if(!metricsName){
        throw new Error(`Unknow metrics:${metricsName}`);
    }
    metrics[metricsName]+=n;
};

const set=(metricsName,value)=>{
    if(!metricsName){
        throw new Error(`Unknow metrics:${metricsName}`);
    }
    metrics[metricsName]=value;
}

const getMetrics=()=>{
    return {...metrics};
};

export {
    inc,set,getMetrics
}