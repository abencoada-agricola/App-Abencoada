import {assertReceipt} from '../web/api-v1-models.js';
export async function deliverV1(record,{request,persist,now=Date.now}){
 if(record.deliveryState==='needs_review'||record.deliveryState==='blocked'||record.retryAt>now())return null;
 try{
  // Every retry first reconciles with the durable server receipt, including restarts and native races.
  if(record.deliveryState!=='pending'||record.attempted){
   try{return assertReceipt(await request('/api/v1/submissions/'+record.command.submission_id),record)}catch(e){if(e.status!==404)throw e;}
  }
  record.deliveryState='sending';record.attempted=true;await persist(record);
  return assertReceipt(await request('/api/v1/operations',{method:'POST',body:record.command}),record);
 }catch(error){
  record.deliveryState=[401,403].includes(error.status)?'blocked':[409,422].includes(error.status)&&error.code!=='IDEMPOTENCY_CONFLICT'?'needs_review':'unknown';
  record.retryAt=error.retryAt||now()+30000;record.lastSendError=error.message;
  if(record.deliveryState==='needs_review')record.error=error.message;
  await persist(record);throw error;
 }
}
