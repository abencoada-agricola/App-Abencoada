import {vehicleLoaderHTML} from '../web/vehicle-icons.js';
import {build} from 'esbuild';
import {versionForBuild} from './app-version.mjs';
const appVersion=versionForBuild(process.env.APP_BUILD_NUMBER);
import {mkdir,rm,cp,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateSqlRelease} from './sql-release-config.mjs';
import {apiV1Config} from './api-v1-config.mjs';
const config={url:process.env.SUPABASE_URL||'',publishableKey:process.env.SUPABASE_PUBLISHABLE_KEY||'',loginKey:process.env.SUPABASE_LOGIN_KEY||process.env.SUPABASE_PUBLISHABLE_KEY||''};
const v1=apiV1Config();
const sqlUrl=v1?null:validateSqlRelease();
if(v1)Object.assign(config,v1);
if(sqlUrl)Object.assign(config,{backend:'sqlserver',url:sqlUrl,publishableKey:'local-sqlserver',loginKey:''});
for(const key of [config.publishableKey,config.loginKey]){if(key.startsWith('sb_secret_'))throw Error('Use somente chaves públicas.');if(key.includes('.')&&JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role==='service_role')throw Error('Chave administrativa proibida no aplicativo.')}
await rm('mobile-dist',{recursive:true,force:true});await mkdir('mobile-dist');
await writeFile('mobile-dist/index.html',(await readFile('mobile/index.html','utf8')).replaceAll('__APP_VERSION__',appVersion.name).replace('__APP_LOADER__',vehicleLoaderHTML()));await cp('mobile/mobile.css','mobile-dist/mobile.css');await cp('mobile/material.css','mobile-dist/material.css');await cp('mobile/loading.css','mobile-dist/loading.css');await cp('mobile/app-icon.png','mobile-dist/app-icon.png');await cp('mobile/login-logo.png','mobile-dist/login-logo.png');await cp('mobile/header-logo.png','mobile-dist/header-logo.png');
for(const file of ['logo.png','fleets.json'])await cp('web/'+file,'mobile-dist/'+file);
await build({entryPoints:['mobile/app.js'],outfile:'mobile-dist/mobile.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,plugins:[{name:'public-config',setup(b){if(v1)b.onLoad({filter:/web[\\/]backend\.js$/},async()=>({contents:await readFile('web/api-v1-backend.js','utf8'),resolveDir:resolve('web'),loader:'js'}));if(sqlUrl)b.onLoad({filter:/web[\\/]backend\.js$/},async()=>({contents:await readFile('web/sqlserver-backend.js','utf8'),resolveDir:resolve('web'),loader:'js'}));b.onLoad({filter:/web[\\/]config\.js$/},()=>({contents:'export const config='+JSON.stringify(config),loader:'js'}))}}]});
console.log('Interface Android/iOS preparada.');
