import {build} from 'esbuild';
import {cp,rm,mkdir,writeFile,readFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateSqlRelease} from './sql-release-config.mjs';
import {apiV1Config} from './api-v1-config.mjs';
const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_PUBLISHABLE_KEY||'',loginKey=process.env.SUPABASE_LOGIN_KEY||key;
const v1=apiV1Config();
const sqlUrl=v1?null:validateSqlRelease();
for(const publicKey of [key,loginKey]){
if(publicKey.startsWith('sb_secret_'))throw Error('Use a chave pública publishable, nunca uma chave secret.');
if(publicKey.includes('.')){try{if(JSON.parse(Buffer.from(publicKey.split('.')[1],'base64url')).role==='service_role')throw Error('A chave service_role não pode ser publicada.')}catch(e){if(e.message.includes('service_role'))throw e}}
}
if(!sqlUrl&&!v1)await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js'",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'web/vendor.js',minify:true});
await build({entryPoints:['web/qr-source.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'web/qr.js',minify:true});
await build({entryPoints:['web/checklists-source.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'web/checklists.js',minify:true});
await rm('dist',{recursive:true,force:true});await mkdir('dist');await cp('web','dist',{recursive:true});
if(v1){await cp('web/api-v1-backend.js','dist/backend.js');await writeFile('dist/vendor.js','// API v1; no Supabase runtime.\n');}
if(sqlUrl){await cp('web/sqlserver-backend.js','dist/backend.js');await writeFile('dist/vendor.js','// SQL-only release; no Supabase runtime.\n');}
if(v1)await writeFile('dist/config.js','export const config='+JSON.stringify(v1)+';\n');
if(!v1&&url&&key)await writeFile('dist/config.js',`export const config=${JSON.stringify({url,publishableKey:key,loginKey})};\n`);
if(sqlUrl)await writeFile('dist/config.js',`export const config=${JSON.stringify({backend:'sqlserver',url:sqlUrl,publishableKey:'local-sqlserver'})};\n`);
const names=['api-v1-client.js','api-v1-models.js','sqlserver-client.js','gmais-fleet.js','navigation-icons.js','report-header.js','access.js','app.js','backend.js','config.js','vendor.js','style.css','theme.js','fuel-utils.js','text-case.js','qr.js','checklists.js'];const hash=createHash('sha256');for(const name of [...names,'index.html','admin.html','sw.js','manifest.webmanifest','icon-192.png','icon-512.png'])hash.update(await readFile('dist/'+name));const version=hash.digest('hex').slice(0,12);
const renamed=Object.fromEntries(names.map(name=>[name,name.replace(/\.(js|css)$/,'-'+version+'.$1')]));
for(const name of ['index.html','admin.html','app.js','backend.js','api-v1-models.js','sqlserver-client.js','sw.js']){let content=await readFile('dist/'+name,'utf8');for(const [from,to] of Object.entries(renamed))content=content.replaceAll('./'+from,'./'+to);content=content.replaceAll('diesel-pages-v1','diesel-pages-'+version);await writeFile('dist/'+name,content)}
for(const [from,to] of Object.entries(renamed))await rename('dist/'+from,'dist/'+to);
await writeFile('dist/.nojekyll','');
console.log(v1?'Interface pronta para API v1 (validar servidor antes da publicação).':sqlUrl?'Interface local pronta para SQL Server.':url&&key?'Interface pronta para publicar com banco conectado.':'Interface pronta; conexão do banco pendente.');
