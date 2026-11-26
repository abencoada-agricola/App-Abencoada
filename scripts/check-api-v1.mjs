import {readFile} from 'node:fs/promises';
import {apiV1Config} from './api-v1-config.mjs';
const args=process.argv.slice(2),contractAt=args.indexOf('--contract');
if(contractAt>=0){
 const expected=JSON.parse(await readFile(new URL('../docs/api-v1/openapi-luiz.json',import.meta.url),'utf8')),actual=JSON.parse(await readFile(args[contractAt+1],'utf8')),missing=[];
 for(const [path,verbs] of Object.entries(expected.paths))for(const verb of Object.keys(verbs))if(['get','post','put','patch','delete'].includes(verb)&&!actual.paths?.[path]?.[verb])missing.push(verb.toUpperCase()+' '+path);
 if(missing.length)throw Error('Rotas ausentes no contrato recebido:\n'+missing.join('\n'));
 const keys=new Set(['type','properties','required','additionalProperties','items','oneOf','allOf','anyOf','not','if','then','enum','const','pattern','format','minLength','maxLength','minimum','maximum','maxItems','uniqueItems','minProperties','$ref']);
 const shape=(value,dictionary=false)=>Array.isArray(value)?value.map(v=>shape(v)):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(k=>dictionary||keys.has(k)).map(k=>[k,shape(value[k],k==='properties')])):value;
 const changed=Object.keys(expected.components.schemas).filter(name=>JSON.stringify(shape(expected.components.schemas[name]))!==JSON.stringify(shape(actual.components?.schemas?.[name])));
 if(changed.length)throw Error('Schemas diferentes da apresentação; revisar o cliente antes de ativar:\n'+changed.join(', '));
 console.log('Rotas e schemas compatíveis com o OpenAPI da apresentação. Ainda é necessário testar o servidor.');
}
const url=args.find((v,i)=>!v.startsWith('--')&&(contractAt<0||i!==contractAt+1));
if(url){const config=apiV1Config({APP_BACKEND:'api-v1',API_V1_URL:url,REQUIRE_HTTPS:process.env.REQUIRE_HTTPS});for(const path of ['/health/live','/health/ready']){const response=await fetch(config.url+path,{signal:AbortSignal.timeout(15000),redirect:'error',cache:'no-store'});if(!response.ok)throw Error(path+': HTTP '+response.status);const body=await response.json();if(!['ok','ready'].includes(body.status))throw Error(path+': resposta fora do contrato');console.log(path+': '+body.status);}}
if(!url&&contractAt<0)throw Error('Uso: node scripts/check-api-v1.mjs URL_BASE [--contract caminho/openapi.json]');
