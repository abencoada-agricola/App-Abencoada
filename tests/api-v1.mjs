import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createApiV1Client} from '../web/api-v1-client.js';
import {freezeRecord,commandForRecord,validateBootstrap,assertBackendTransition,assertReceipt,decimalString} from '../web/api-v1-models.js';
import {deliverV1} from '../mobile/api-v1-sync.js';
import {apiV1Config} from '../scripts/api-v1-config.mjs';
const spec=JSON.parse(await readFile('docs/api-v1/openapi-luiz.json','utf8'));
const id='550e8400-e29b-41d4-a716-446655440000',userId='660e8400-e29b-41d4-a716-446655440000',remoteId='770e8400-e29b-41d4-a716-446655440000',questionId='880e8400-e29b-41d4-a716-446655440000';
const captured='2026-11-24T12:00:00Z',meter_fields={km:false,engine:true,elevator:false};
const bootstrap={user:{id:userId,name:'Teste de contrato',username:'teste',role:'operator',permissions:{refuel:true,transfer:true,checklist:true,occurrence:true}},fleets:[{code:'TR 02/A',name:'Frota sintética',type:'Trator',model:'',active:true,meter_fields,tank_capacity:'200.00000000',gmais_readings:null,tank_reference:null,is_test:true,version:0}],locations:[{local_code:'0010',local_name:'Origem',material_code:'0020',material_name:'Diesel',reading:'100',is_test:true,simulated_meter:false,version:0}],materials:[{code:'0020',name:'Diesel'}],rules:{allow_future_date:false},checklist_templates:[{fleet_code:'TR 02/A',version:1,questions:[{id:questionId,text:'Pergunta'}]},{fleet_code:'TR 02/A',version:2,questions:[{id:questionId,text:'Pergunta'}]}],generated_at:captured};
const record={id,kind:'refuel',userId,fleet:'TR 02/A',date:'2026-11-24',mode:'manual',liters:30,localCode:'0010',materialCode:'0020',measuredFields:meter_fields,engine:452,operator:'não enviar',signature:'não enviar',createdAt:captured};
function validateFields(value,schema){if(schema.$ref)return validateFields(value,spec.components.schemas[schema.$ref.split('/').at(-1)]);if(schema.type==='object'){for(const key of schema.required||[])assert(Object.hasOwn(value,key),'required '+key);if(schema.additionalProperties===false)for(const key of Object.keys(value))assert(Object.hasOwn(schema.properties,key),'unknown '+key);for(const [key,item] of Object.entries(value))if(schema.properties?.[key])validateFields(item,schema.properties[key]);}if(schema.type==='array')for(const item of value)validateFields(item,schema.items);if(schema.type==='string')assert.equal(typeof value,'string');if(schema.enum)assert(schema.enum.includes(value));if(schema.pattern)assert(new RegExp(schema.pattern).test(value));}
for(const r of [record,{...record,mode:'recorder',recorderStart:100,recorderEnd:130},{...record,kind:'transfer',destination:'DEST/A',recorderStart:100,recorderEnd:130},{...record,kind:'occurrence',notes:'Observação sintética'},{...record,kind:'checklist',templateVersion:2,answers:[{id:questionId,status:'PERFEITO'}]}]){
 const command=commandForRecord(r);validateFields(command,spec.components.schemas.OperationCommand);validateFields(command.data,spec.components.schemas[{refuel:'RefuelCommand',transfer:'TransferCommand',occurrence:'OccurrenceCommand',checklist:'ChecklistCommand'}[r.kind]]);assert(!('operator'in command));assert(!('user_id'in command));assert(!('liters'in command.data)||r.kind==='refuel');
}
const frontCommand=commandForRecord({...record,workFront:' FRENTE NORTE '});assert.equal(frontCommand.data.work_front,'FRENTE NORTE');assert.equal(commandForRecord({...record,workFront:''}).data.work_front,undefined);assert.equal(freezeRecord({...record,workFront:'FRENTE SUL'},'https://example.test').command.data.work_front,'FRENTE SUL');assert.throws(()=>commandForRecord({...record,workFront:'x'.repeat(121)}));
assert.equal(decimalString('452.00000000'),'452');assert.throws(()=>decimalString('1e3'));assert.throws(()=>decimalString('-1'));assert.throws(()=>decimalString('1.000000001'));
const mapped=validateBootstrap(bootstrap,userId,'https://example.test');assert.equal(mapped.fleets[0].id,'TR 02/A');assert.equal(mapped.locations[0].last_meter,100);assert.equal(mapped.checklistTemplates[0].version,2);assert.equal(mapped.fleets[0].last_engine,undefined);
assert.throws(()=>validateBootstrap(bootstrap,id,'x'));assert.throws(()=>validateBootstrap({...bootstrap,fleets:[...bootstrap.fleets,...bootstrap.fleets]},userId,'x'));assert.throws(()=>validateBootstrap({...bootstrap,user:{...bootstrap.user,permissions:{}}},userId,'x'));
assert.throws(()=>assertBackendTransition([record],{},'https://example.test'),/conexão anterior/);assert.throws(()=>assertBackendTransition([],{acks:[{id}]},'https://example.test'),/conexão anterior/);assert.throws(()=>assertBackendTransition([freezeRecord(record,'https://other.test')],{},'https://example.test'));
assertBackendTransition([freezeRecord(record,'https://example.test')],{},'https://example.test');
assert.equal(apiV1Config({APP_BACKEND:'api-v1',API_V1_URL:'https://example.test/'}).url,'https://example.test');for(const url of ['http://example.test','https://a:b@example.test','https://example.test/api/v1','https://example.test?a=b'])assert.throws(()=>apiV1Config({APP_BACKEND:'api-v1',API_V1_URL:url}));assert.throws(()=>apiV1Config({APP_BACKEND:'api-v1'}));assert.throws(()=>apiV1Config({APP_BACKEND:'sqlserver',API_V1_URL:'https://example.test'}));
const storage=new Map(),localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
let postCount=0,commits=0,dropResponse=true,receipt=null,rateLimit=false;const seen=[];
const server=createServer(async(req,res)=>{try{
 const body=[];for await(const chunk of req)body.push(chunk);const p=body.length?JSON.parse(Buffer.concat(body).toString()):undefined;seen.push({method:req.method,url:req.url,body:p,auth:req.headers.authorization});
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');const reply=(status,data)=>{res.statusCode=status;res.end(data===undefined?'':JSON.stringify(data));};
 if(req.url==='/api/v1/auth/login')return reply(200,{token:'synthetic-session',user:bootstrap.user,expires_at:'2099-11-24T12:00:00Z',password_change_required:false});
 if(!req.headers.authorization)return reply(401,{error:{code:'UNAUTHENTICATED',message:'Entre novamente.',fields:[]}});
 if(req.url==='/api/v1/bootstrap')return reply(200,bootstrap);
 if(req.url==='/api/v1/auth/logout'||req.url==='/api/v1/auth/password')return reply(204);
 if(req.url.startsWith('/api/v1/submissions/'))return reply(receipt?200:404,receipt||{error:{code:'NOT_FOUND',message:'Não recebido.',fields:[]}});
 if(req.url==='/api/v1/operations'&&req.method==='POST'){
  postCount++;if(rateLimit){res.setHeader('Retry-After','60');return reply(429,{error:{code:'RATE_LIMITED',message:'Aguarde.',fields:[]},request_id:id});}
  validateFields(p,spec.components.schemas.OperationCommand);if(!receipt){commits++;receipt={submission_id:id,id:remoteId,kind:'refuel',received_at:captured,duplicate:false,state:'active',warnings:[]};}
  if(dropResponse){dropResponse=false;req.socket.destroy();return;}return reply(200,{...receipt,duplicate:true});
 }
 return reply(404,{error:{code:'NOT_FOUND',message:'Rota de teste desconhecida.',fields:[]}});
 }catch(e){res.statusCode=500;res.end(JSON.stringify({error:{code:'TEST_ERROR',message:e.message,fields:[]}}));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port,client=createApiV1Client({url:base,storage:localStorage});
try{
 await client.signIn(' teste ','senha-sintética');const fresh=await client.request('/api/v1/bootstrap');assert.equal(fresh.user.id,userId);assert.equal(seen[0].auth,undefined);assert.equal(seen[1].auth,'Bearer synthetic-session');
 const queued=freezeRecord(record,base),saved=[];const persist=async r=>saved.push(structuredClone(r));
 await assert.rejects(deliverV1(queued,{request:client.request,persist}),e=>e.code==='NETWORK_ERROR');assert.equal(queued.deliveryState,'unknown');assert.equal(commits,1);assert.equal(saved[0].deliveryState,'sending');assert.equal(saved.at(-1).deliveryState,'unknown');
 queued.retryAt=0;const received=await deliverV1(queued,{request:client.request,persist});assert.equal(received.id,remoteId);assert.equal(postCount,1);assert.equal(commits,1);assertReceipt(received,queued);assert.throws(()=>assertReceipt({...received,submission_id:questionId},queued));
 // Rate limits are durable and suppress requests until the server's retry time.
 receipt=null;rateLimit=true;const limited=freezeRecord(record,base);await assert.rejects(deliverV1(limited,{request:client.request,persist}),e=>e.status===429&&e.requestId===id);const count=seen.length;assert(limited.retryAt>Date.now()+50000);assert.equal(await deliverV1(limited,{request:client.request,persist}),null);assert.equal(seen.length,count);
 // Validation errors preserve the command, whereas idempotency conflicts cannot be edited blindly.
 for(const [status,code,state] of [[401,'UNAUTHENTICATED','blocked'],[403,'FORBIDDEN','blocked'],[409,'READING_CONFLICT','needs_review'],[422,'VALIDATION_ERROR','needs_review'],[409,'IDEMPOTENCY_CONFLICT','unknown'],[503,'SERVICE_UNAVAILABLE','unknown']]){
  const r=freezeRecord(record,base),before=JSON.stringify(r.command);await assert.rejects(deliverV1(r,{persist,request:async()=>{throw Object.assign(Error('Falha sintética'),{status,code});}}));assert.equal(r.deliveryState,state);assert.equal(JSON.stringify(r.command),before);
 }
 await client.changePassword('senha-atual','senha-nova-sintética');assert.equal(client.session(),null);await client.signIn('teste','senha');await client.signOut();assert.equal(client.session(),null);
 assert(seen.every(r=>!r.url.includes('/api/login')&&!r.url.includes('rpc')));
 console.log('API v1 contract, four commands, bootstrap isolation, legacy preservation, Bearer auth, lost-response recovery, stable receipts, Retry-After, blocked/review states and password revocation passed (synthetic local HTTP).');
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
