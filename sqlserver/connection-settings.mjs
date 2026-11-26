import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {isAbsolute,resolve} from 'node:path';
const projectRoot=fileURLToPath(new URL('..',import.meta.url));
export function connectionSettings(env=process.env){
 if(env.SQL_PROFILE==='local')throw Error('O banco local de teste foi desativado para o aplicativo.');
 let saved={};try{saved=JSON.parse(readFileSync(new URL('./connection.local.json',import.meta.url),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
 const server=env.SQL_SERVER||saved.server||'177.234.159.74',database=env.SQL_DATABASE||saved.database||'APP_ABENCOADA';
 if(server!=='177.234.159.74'||database!=='APP_ABENCOADA')throw Error('O aplicativo está restrito a 177.234.159.74 / APP_ABENCOADA.');
 const local=false;
 const credential=env.SQL_CREDENTIAL_PATH||(server===saved.server?saved.credentialPath:null);
 if(!credential)throw Error('Configure a credencial protegida do banco APP_ABENCOADA. Não há fallback para outro banco.');
 return {server,database,local,credentialPath:credential?(isAbsolute(credential)?credential:resolve(projectRoot,credential)):null,trustServerCertificate:env.SQL_TRUST_SERVER_CERTIFICATE!==undefined?env.SQL_TRUST_SERVER_CERTIFICATE==='true':server===saved.server?Boolean(saved.trustServerCertificate):local};
}
export const settings=connectionSettings();
