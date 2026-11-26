export const API_BACKEND='api-v1';
const meters=['km','engine','elevator'];
const invalid=message=>Object.assign(Error(message),{code:'INVALID_API_RESPONSE'});
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function decimalString(value){const text=String(value);if(!/^(0|[1-9][0-9]*)(\.[0-9]{1,8})?$/.test(text)||Number(text)>1e9)throw Error('Valor numérico inválido para envio.');return text.includes('.')?text.replace(/0+$/,'').replace(/\.$/,''):text;}
export function validateBootstrap(data,userId,base){
 if(!data?.user||data.user.id!==userId||!uuid(userId)||!['admin','operator'].includes(data.user.role)||typeof data.user.name!=='string'||!data.user.name||typeof data.user.username!=='string')throw invalid('O catálogo recebido não pertence à conta autenticada.');
 if(!['refuel','transfer','checklist','occurrence'].every(k=>typeof data.user.permissions?.[k]==='boolean'))throw invalid('Permissões incompletas na API.');
 for(const k of ['fleets','locations','materials','checklist_templates'])if(!Array.isArray(data[k]))throw invalid('Catálogo incompleto: '+k);
 if(typeof data.rules?.allow_future_date!=='boolean'||!Number.isFinite(Date.parse(data.generated_at)))throw invalid('Regras ou data do catálogo inválidas.');
 const unique=(items,key)=>{const keys=items.map(key);if(new Set(keys).size!==keys.length)throw invalid('Catálogo contém identificadores duplicados.');};
 unique(data.fleets,f=>f.code);unique(data.locations,l=>JSON.stringify([l.local_code,l.material_code]));unique(data.materials,m=>m.code);unique(data.checklist_templates,t=>JSON.stringify([t.fleet_code,t.version]));
 const fleets=data.fleets.map(f=>{if(typeof f.code!=='string'||!f.code||typeof f.active!=='boolean'||typeof f.is_test!=='boolean'||!Number.isSafeInteger(f.version)||!meters.every(k=>typeof f.meter_fields?.[k]==='boolean')||!meters.some(k=>f.meter_fields[k]))throw invalid('Configuração de frota inválida.');if(f.tank_capacity!==null)decimalString(f.tank_capacity);
  // The published bootstrap does not define current fleet readings. Never infer them from GMAIS metadata.
  return {...f,id:f.code,record_count:0,tank_capacity:f.tank_capacity,referenceUnavailable:true};});
 const locations=data.locations.map(l=>{if(!['local_code','material_code','local_name','material_name'].every(k=>typeof l[k]==='string')||typeof l.is_test!=='boolean'||!Number.isSafeInteger(l.version)||typeof l.simulated_meter!=='boolean')throw invalid('Local inválido.');if(l.reading!==null)decimalString(l.reading);return {...l,name:l.local_name,last_meter:l.reading===null?null:Number(l.reading),last_verified_meter:l.reading===null?null:Number(l.reading)};});
 const templates=data.checklist_templates.map(t=>{if(!data.fleets.some(f=>f.code===t.fleet_code)||!Number.isSafeInteger(t.version)||t.version<1||!Array.isArray(t.questions)||!t.questions.every(q=>uuid(q.id)&&typeof q.text==='string'))throw invalid('Modelo de checklist inválido.');unique(t.questions,q=>q.id);return {...t,fleet:t.fleet_code};});
 return {backendId:API_BACKEND,apiBase:base,user:data.user,fleets,locations,materials:data.materials.map(m=>({...m,material_code:m.code,material_name:m.name})),rules:{futureDate:data.rules.allow_future_date,matchMeter:true,checklistEnabled:true},checklistTemplates:templates.sort((a,b)=>b.version-a.version),generatedAt:data.generated_at};
}
export function commandForRecord(record){
 const kind=record.kind||'refuel',data={};
 if(!uuid(record.id)||!Number.isFinite(Date.parse(record.createdAt)))throw Error('Identificação do registro inválida.');
 if(kind==='refuel'){
  Object.assign(data,{fleet_code:record.fleet,date:record.date,mode:record.mode,liters:decimalString(record.liters),local_code:record.localCode,material_code:record.materialCode,meter_fields:record.measuredFields,readings:{}});
  if(record.workFront!=null){if(typeof record.workFront!=='string'||record.workFront.trim().length>120)throw Error('Informe a frente de trabalho com até 120 caracteres.');if(record.workFront.trim())data.work_front=record.workFront.trim();}
  for(const k of meters)if(record.measuredFields?.[k])data.readings[k]=decimalString(record[k]);
  if(record.mode==='recorder')Object.assign(data,{recorder_start:decimalString(record.recorderStart),recorder_end:decimalString(record.recorderEnd)});
 }else if(kind==='transfer')Object.assign(data,{local_code:record.localCode,material_code:record.materialCode,destination_code:record.destination,recorder_start:decimalString(record.recorderStart),recorder_end:decimalString(record.recorderEnd)});
 else if(kind==='occurrence'){data.notes=record.notes||'';if(record.photo)data.photo=record.photo;for(const [local,remote] of [['fleet','fleet_code'],['localCode','local_code'],['materialCode','material_code']])if(record[local])data[remote]=record[local];}
 else if(kind==='checklist')Object.assign(data,{fleet_code:record.fleet,template_version:record.templateVersion,answers:record.answers.map(a=>({question_id:a.id,status:a.status}))});
 else throw Error('Tipo de operação desconhecido.');
 return {submission_id:record.id,kind,captured_at:record.createdAt,data};
}
export function freezeRecord(record,base){return {...record,backendId:API_BACKEND,apiBase:base,command:commandForRecord(record),deliveryState:'pending',retryAt:0};}
export function assertReceipt(receipt,record){if(!uuid(receipt?.id)||receipt.submission_id?.toLowerCase()!==record.command.submission_id.toLowerCase()||receipt.kind!==record.command.kind||!Number.isFinite(Date.parse(receipt.received_at))||typeof receipt.duplicate!=='boolean'||!['active','removed'].includes(receipt.state)||!Array.isArray(receipt.warnings))throw invalid('O recebimento ainda não foi confirmado.');return receipt;}
export function assertBackendTransition(records,nativeState,base){
 const pending=[...records,...(nativeState?.queue||[])],acks=nativeState?.acks||[];
 if(pending.some(r=>r.backendId!==API_BACKEND||r.apiBase!==base)||acks.some(r=>r.backendId!==API_BACKEND||r.apiBase!==base))throw Object.assign(Error('Há registros de uma conexão anterior. Envie-os pelo aplicativo anterior antes de atualizar a conexão. Os dados foram preservados.'),{code:'MIGRATION_BLOCKED'});
}
