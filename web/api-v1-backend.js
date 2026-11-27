import {config} from './config.js';
import {createApiV1Client} from './api-v1-client.js';
import {validateBootstrap,decimalString} from './api-v1-models.js';
import {hydrateSavedFleetReadings} from './api-v1-readings.js';
export const client=createApiV1Client({url:config.url||''});
export const isConfigured=()=>config.backend==='api-v1'&&/^https?:\/\//.test(config.url);
export const signIn=client.signIn,signOut=client.signOut,getAuthUserId=client.userId;
export const changePassword=client.changePassword;
export const requestV1=client.request;
const enc=encodeURIComponent;
let snapshot=null,members=[];
const readingDetails=new Map();let readingOwner=null;
export async function fieldApi(){throw Error('Use o aplicativo Android autenticado para registrar operações.');}
function operation(o){const d=o.data||{},readings=d.readings||{};return {...d,apiV1:true,id:o.id,submission_id:o.submission_id,kind:o.kind,state:o.state,operator:o.operator||'',fleet:d.fleet_code||o.fleet_code||'',date:d.date||o.captured_at?.slice(0,10),created_at:o.captured_at,received_at:o.received_at,liters:d.liters==null?undefined:Number(d.liters),...Object.fromEntries(Object.entries(readings).map(([k,v])=>[k,Number(v)])),capture_mode:'quick',measured_fields:d.meter_fields||{},destination:d.destination_code,recorder_liters:d.liters==null?undefined:Number(d.liters),answers:d.answers?.map(a=>({...a,id:a.question_id,text:snapshot?.checklistTemplates.find(t=>t.fleet===d.fleet_code&&t.version===d.template_version)?.questions.find(q=>q.id===a.question_id)?.text||'Pergunta histórica'})),resolutions:d.resolutions||{},has_photo:d.has_photo,removal_reason:o.removal_reason};}
async function operations(kind,state='active'){
 const rows=await client.pages('/api/v1/operations?'+new URLSearchParams({...(kind?{kind}:{}),state}));
 // Lists are summaries in v1. Fetch details before displaying quantities or photos.
 const result=[];for(let i=0;i<rows.length;i+=6)result.push(...await Promise.all(rows.slice(i,i+6).map(o=>client.request('/api/v1/operations/'+enc(o.id)).then(operation))));return result;
}
const memberKey=m=>({...m,email:m.email||m.id}); // Existing UI uses this opaque key; never display UUID as an email.
async function memberId(key){if(!members.length)members=(await client.pages('/api/v1/members')).map(memberKey);const member=members.find(m=>m.id===key||m.email===key);if(!member)throw Error('Atualize a lista de usuários antes de continuar.');return member.id;}
async function adminSave(p){
 const fleet='/api/v1/fleets/'+enc(p.id||'');let result;
 switch(p.action){
 case 'fleet':return client.request('/api/v1/fleets',{method:'POST',body:{code:p.id,name:p.name,type:p.type}});
 case 'fleet-edit':return client.request(fleet,{method:'PATCH',body:{name:p.name,model:p.model||'',type:p.type,active:p.active,tank_capacity:p.tankCapacity==null?null:decimalString(p.tankCapacity)}});
 case 'fleet-meters':return client.request(fleet,{method:'PATCH',body:{meter_fields:p.meterFields}});
 case 'import-fleets':{const response=await fetch('./fleets.json');if(!response.ok)throw Error('Catálogo indisponível.');const rows=await response.json();if(rows.length>1000)throw Error('A API aceita até 1.000 frotas por importação.');return client.request('/api/v1/fleets/import',{method:'POST',body:{items:rows.map(f=>({code:f.id,name:f.name,type:f.type,...(f.model?{model:f.model}:{}),...(f.meter_fields?{meter_fields:f.meter_fields}:{})}))}});}
 case 'member':result=await client.request('/api/v1/members',{method:'POST',body:{username:p.username.toLowerCase(),email:p.email,name:p.name,role:p.role,permissions:p.permissions}});members=[];return result;
 case 'member-access':return client.request('/api/v1/members/'+enc(await memberId(p.email)),{method:'PATCH',body:{role:p.role,permissions:p.permissions}});
 case 'member-remove':case 'member-restore':result=await client.request('/api/v1/members/'+enc(await memberId(p.email))+'/'+(p.action==='member-remove'?'remove':'restore'),{method:'POST'});members=[];return result;
 case 'rules':return client.request('/api/v1/rules',{method:'PUT',body:{allow_future_date:p.rules.futureDate===true}});
 default:throw Error('Esta alteração não está disponível no contrato da API.');
 }
}
export async function api(path,options={}){
 const [route,query]=path.split('?'),p=options.body?JSON.parse(options.body):null,params=new URLSearchParams(query);
 if(route==='session'){
  const auth=client.session();if(auth?.password_change_required)throw Object.assign(Error('Troque sua senha temporária para continuar.'),{code:'PASSWORD_CHANGE_REQUIRED'});
  if(readingOwner!==auth?.user?.id){readingDetails.clear();readingOwner=auth?.user?.id;}
  const fresh=validateBootstrap(await client.request('/api/v1/bootstrap'),auth?.user?.id,client.base);
  snapshot=await hydrateSavedFleetReadings(fresh,client,{previous:snapshot,detailCache:readingDetails});return snapshot;
 }
 if(route==='device-register')return client.request('/api/v1/devices',{method:'POST',body:{device_id:p.deviceId}});
 if(route==='records'){if(options.method==='POST')throw Error('Envie registros pelo aplicativo Android.');return params.has('id')?operation(await client.request('/api/v1/operations/'+enc(params.get('id')))):{records:await operations('refuel')};}
 if(route==='operations-admin')return {operations:(await operations()).filter(o=>['transfer','occurrence'].includes(o.kind))};
 if(route==='occurrence-photo')return client.request('/api/v1/operations/'+enc(params.get('id'))+'/photo');
 if(route==='record-controls'){if(!p)return {records:await operations(null,'removed')};return client.request('/api/v1/operations/'+enc(p.id)+'/'+p.action,{method:'POST',...(p.action==='remove'?{body:{reason:p.reason}}:{})});}
 if(route==='admin'){if(p)return adminSave(p);const [active,removed]=await Promise.all([client.pages('/api/v1/members?state=active'),client.pages('/api/v1/members?state=removed')]);members=[...active,...removed].map(memberKey);return {members:active.map(memberKey),removedMembers:removed.map(memberKey)};}
 if(route==='team-password')return client.request('/api/v1/members/'+enc(await memberId(p.email))+'/password-reset',{method:'POST'});
 if(route==='checklists-admin'){
  if(p?.action==='resolve')await client.request('/api/v1/checklists/'+enc(p.id)+'/resolutions',{method:'POST',body:{question_id:p.questionId,notes:p.notes}});
  if(p?.action==='save-template'){
   const known=new Set(snapshot?.checklistTemplates.filter(t=>t.fleet===p.fleet).flatMap(t=>t.questions.map(q=>q.id))||[]);
   await client.request('/api/v1/fleets/'+enc(p.fleet)+'/checklist-templates',{method:'POST',body:{expected_version:p.expectedVersion,questions:p.questions.map(q=>({...(known.has(q.id)?{id:q.id}:{}),text:q.text}))}});
   await api('session');return {templates:snapshot.checklistTemplates};
  }
  return {records:await operations('checklist'),templates:snapshot?.checklistTemplates||[]};
 }
 throw Error('Operação indisponível nesta conexão.');
}
