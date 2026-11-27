const meters=['km','engine','elevator'];
const valid=value=>(typeof value==='number'||typeof value==='string'&&/^\d+(\.\d+)?$/.test(value))&&value!==null&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=1e9;

export function retainSavedFleetReadings(session,previous){
 if(!previous||previous.user?.id!==session.user.id||previous.user.role!==session.user.role||previous.apiBase!==session.apiBase)return session;
 return {...session,fleets:session.fleets.map(fleet=>{
  if(!fleet.readingRefreshFailed)return fleet;
  const old=previous.fleets.find(f=>f.id===fleet.id);
  if(!old?.savedReadingSource)return fleet;
  const cached={};for(const meter of meters)if(valid(old['last_'+meter]))cached['last_'+meter]=old['last_'+meter];
  return {...fleet,...cached,record_count:old.record_count,savedReadingSource:old.savedReadingSource,readingScope:old.readingScope,referenceUnavailable:!Object.keys(cached).length};
 })};
}

// The bootstrap omits saved readings. Read accepted operations, never GMAIS metadata or pending submissions.
export async function hydrateSavedFleetReadings(session,client,{previous,detailCache=new Map()}={}){
 if(!session.user.permissions.refuel)return session;
 try{
  const rows=(await client.pages('/api/v1/operations?kind=refuel&state=active')).filter(r=>r.kind==='refuel'&&r.state==='active').sort((a,b)=>String(b.received_at).localeCompare(String(a.received_at))||String(b.id).localeCompare(String(a.id)));
  const fleets=[];
  for(const fleet of session.fleets){
   const history=rows.filter(r=>r.fleet_code===fleet.id),readings={},sources={};
   for(const row of history){
    if(meters.filter(k=>fleet.meter_fields[k]).every(k=>readings[k]!==undefined))break;
    const key=session.user.id+':'+session.apiBase+':'+row.id;
    let detail=detailCache.get(key);if(!detail){detail=await client.request('/api/v1/operations/'+encodeURIComponent(row.id));detailCache.set(key,detail);}
    if(detail.id!==row.id||detail.state!=='active'||detail.kind!=='refuel'||detail.data?.fleet_code!==fleet.id)throw Error('Resposta de leituras inválida.');
    for(const meter of meters)if(fleet.meter_fields[meter]&&readings[meter]===undefined&&detail.data.meter_fields?.[meter]&&valid(detail.data.readings?.[meter])){readings[meter]=Number(detail.data.readings[meter]);sources[meter]=row.id;}
   }
   fleets.push({...fleet,...Object.fromEntries(Object.entries(readings).map(([k,v])=>['last_'+k,v])),record_count:history.length,savedReadingSource:sources,readingScope:session.user.role==='admin'?'all':'own',referenceUnavailable:!Object.keys(readings).length,readingRefreshFailed:false});
  }
  return {...session,fleets};
 }catch(error){
  if([401,403].includes(error.status))throw error;
  return retainSavedFleetReadings({...session,fleets:session.fleets.map(f=>({...f,readingRefreshFailed:true}))},previous);
 }
}
