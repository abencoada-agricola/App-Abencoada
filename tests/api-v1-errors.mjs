import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {apiErrorMessage} from '../web/api-v1-errors.js';
import {createApiV1Client} from '../web/api-v1-client.js';
import {deliverV1} from '../mobile/api-v1-sync.js';

const spec=JSON.parse(await readFile('docs/api-v1/openapi-luiz.json','utf8'));
for(const code of [...spec.components.schemas.ErrorCode.enum,'FUTURE_SERVER_ERROR']){
 const message=apiErrorMessage({code,status:400,message:'Raw server failure in English'});
 assert(!message.includes('Raw server failure'));
 assert(!message.includes(code),code);
}
assert.match(apiErrorMessage({message:'OPERATION CONFLICTS WITH CURRENT REFERENCES'}),/leituras.*referências/);
assert.match(apiErrorMessage({status:409,code:'UNRECOGNIZED_CONFLICT'}),/conflito/);
assert.match(apiErrorMessage({status:503}),/servidor.*indisponível/);
assert.match(apiErrorMessage({code:'READING_CONFLICT',context:{current_readings:{km:'51000',engine:'2100',elevator:'Raw English'}}}),/KM de referência: 51\.000; Horímetro do motor de referência: 2\.100\./);
assert(!apiErrorMessage({code:'READING_CONFLICT',context:{current_readings:{km:'Raw English',engine:null}}}).includes('Raw English'));
assert.match(apiErrorMessage({code:'VALIDATION_ERROR',fields:[{path:'refuel.data.work_front',message:'Invalid value'}]}),/Frente de Trabalho.*campo vazio/);

for(const [status,code,pattern] of [[409,'READING_CONFLICT',/leituras/],[422,'VALIDATION_ERROR',/inválidos/],[503,'INTERNAL_ERROR',/indisponível/],[400,'UNRECOGNIZED_ERROR',/Não foi possível/]]){
 const client=createApiV1Client({url:'https://example.test',storage:{getItem:()=>null},fetcher:async()=>new Response(JSON.stringify({error:{code,message:'Raw server failure in English',fields:[]}}),{status})});
 await assert.rejects(client.request('/api/v1/operations',{authenticated:false}),e=>e.code===code&&e.status===status&&pattern.test(e.message)&&!e.message.includes('English'));
 const command={submission_id:'test-stable-id',kind:'refuel',data:{liters:'5.5'}};
 const record={deliveryState:'pending',command:structuredClone(command)};let persisted;
 await assert.rejects(deliverV1(record,{persist:async r=>{persisted=structuredClone(r)},request:async()=>{throw Object.assign(Error('Raw server failure in English'),{status,code})}}));
 assert.deepEqual(record.command,command);
 assert.equal(persisted.errorCode,code);assert.equal(persisted.errorStatus,status);
 assert(pattern.test(persisted.lastSendError));assert(!persisted.lastSendError.includes('English'));
}
const login=createApiV1Client({url:'https://example.test',storage:{getItem:()=>null},fetcher:async()=>new Response(JSON.stringify({error:{code:'UNAUTHENTICATED',message:'Invalid credentials',fields:[]}}),{status:401})});
await assert.rejects(login.signIn('teste','senha-ficticia'),/Usuário ou senha incorretos/);
console.log('API errors: every contract code, unknown errors, legacy queue, login, persisted foreground failures and immutable commands use Portuguese.');
