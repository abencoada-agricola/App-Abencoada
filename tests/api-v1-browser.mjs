// Real browser UI over a synthetic HTTP server. Never connects to SQL Server or a real API.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/Usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const userId='660e8400-e29b-41d4-a716-446655440000',questionId='880e8400-e29b-41d4-a716-446655440000';
const user={id:userId,username:'teste',name:'TESTE LOCAL',role:'admin',permissions:{refuel:true,transfer:true,checklist:true,occurrence:true}};
const records=new Map(),calls=[],pageErrors=[];let dropped=false,allowOccurrence=true;
const bootstrap=()=>({user:{...user,permissions:{...user.permissions,occurrence:allowOccurrence}},fleets:[{code:'509',name:'FROTA DE TESTE',type:'Trator',model:'',active:true,meter_fields:{km:false,engine:true,elevator:false},tank_capacity:'200',gmais_readings:null,tank_reference:null,is_test:true,version:0}],locations:['0010','0020'].map(code=>({local_code:code,local_name:'LOCAL '+code,material_code:'20',material_name:'DIESEL',reading:'100',is_test:true,simulated_meter:false,version:0})),materials:[{code:'20',name:'DIESEL'}],rules:{allow_future_date:false},checklist_templates:[{fleet_code:'509',version:1,questions:[{id:questionId,text:'ITENS CONFERIDOS?'}]}],generated_at:new Date().toISOString()});
const server=createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost'),chunks=[];for await(const c of req)chunks.push(c);const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):undefined;
 const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(status===204?'':JSON.stringify(data));};
 if(u.pathname.startsWith('/api/')){
  calls.push({path:u.pathname,method:req.method,body,auth:req.headers.authorization});
  if(u.pathname==='/api/v1/auth/login')return json({token:'synthetic-session',user,expires_at:'2099-11-24T00:00:00Z',password_change_required:body.username.toLowerCase()==='temporario'});
  if(u.pathname==='/api/v1/auth/password'||u.pathname==='/api/v1/auth/logout')return json(null,204);
  if(!req.headers.authorization)return json({error:{code:'UNAUTHENTICATED',message:'Sem credencial.',fields:[]}},401);
  if(u.pathname==='/api/v1/bootstrap')return json(bootstrap());
  if(u.pathname.startsWith('/api/v1/submissions/')){const r=records.get(u.pathname.split('/').at(-1));return r?json(r.receipt):json({error:{code:'NOT_FOUND',message:'Não recebido.',fields:[]}},404);}
  if(u.pathname==='/api/v1/operations'&&req.method==='POST'){
   assert(!body.userId);assert(!body.data.operator);let r=records.get(body.submission_id);if(!r){const receipt={id:randomUUID(),submission_id:body.submission_id,kind:body.kind,received_at:new Date().toISOString(),duplicate:false,state:'active',warnings:[]};r={command:body,receipt};records.set(body.submission_id,r);}
   if(body.kind==='occurrence'&&!dropped){dropped=true;return json({error:{code:'SERVICE_UNAVAILABLE',message:'Resposta perdida após commit sintético.',fields:[]}},503);}return json(r.receipt,201);
  }
  if(u.pathname==='/api/v1/operations'&&req.method==='GET')return json({items:[...records.values()].filter(r=>!u.searchParams.get('kind')||r.command.kind===u.searchParams.get('kind')).map(r=>({...r.receipt,operator:user.name,fleet_code:r.command.data.fleet_code})),next_cursor:null});
  if(/^\/api\/v1\/operations\/[^/]+$/.test(u.pathname)){const r=[...records.values()].find(r=>r.receipt.id===u.pathname.split('/').at(-1));if(r)return json({...r.receipt,operator:user.name,captured_at:r.command.captured_at,data:r.command.data});}
  if(u.pathname==='/api/v1/members')return json({items:u.searchParams.get('state')==='removed'?[]:[user],next_cursor:null});
  return json({error:{code:'NOT_FOUND',message:'Rota sintética ausente.',fields:[]}},404);
 }
 const prefix=u.pathname.startsWith('/mobile/')?'mobile-dist':'dist',relative=decodeURIComponent(u.pathname.replace(/^\/(mobile|web)\//,''))||'index.html';
 const path=resolve(prefix,relative);if(!path.startsWith(resolve(prefix)+'\\')&&!path.startsWith(resolve(prefix)+'/')){res.writeHead(403);res.end();return;}
 const bytes=await readFile(path);res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json'})[extname(path)]||'application/octet-stream'});res.end(bytes);
 }catch(e){res.writeHead(500);res.end(e.message);}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 for(const file of ['scripts/build-mobile.mjs','scripts/build.mjs']){const r=spawnSync(process.execPath,[file],{env:{...process.env,APP_BACKEND:'api-v1',API_V1_URL:base,REQUIRE_HTTPS:'false'},encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
 console.log('Built local fixtures at '+base);browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const context=await browser.newContext({viewport:{width:412,height:915},serviceWorkers:'block'});let page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));
 await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 await page.goto(base+'/mobile/index.html');await page.locator('#login [name=username]').fill('teste');await page.locator('#login [name=password]').fill('senha-sintetica');await page.locator('#login button[type=submit]').click();await page.locator('[data-workflow=methods]').waitFor();
 await page.waitForFunction(()=>document.querySelector('#connection-status')?.textContent.includes('CONECTADO'));
 await page.locator('#open-observation').click();await page.locator('#occurrence-form [name=notes]').fill('OCORRÊNCIA SINTÉTICA');await page.locator('#take-photo').click();await page.locator('#capture-photo:not([disabled])').waitFor();await page.locator('#cancel-capture').click();assert.equal(await page.locator('.capture-panel').count(),0);await page.locator('#take-photo').click();await page.locator('#capture-photo:not([disabled])').waitFor();await page.locator('#capture-photo').click();await page.locator('.occurrence-photo').waitFor();assert.equal(await page.locator('.capture-panel').count(),0);await page.locator('#occurrence-form button[type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('#pending')?.textContent.includes('1 AGUARDANDO'));
 await page.waitForTimeout(300);assert.equal(records.size,1);assert.equal([...records.values()][0].command.kind,'occurrence');
 // Advance only this isolated test queue's retry deadline, preserving the captured command.
 await page.evaluate(()=>new Promise(resolve=>{const req=indexedDB.open('abencoada-diesel-mobile',1);req.onsuccess=()=>{const db=req.result,tx=db.transaction('queue','readwrite'),store=tx.objectStore('queue'),all=store.getAll();all.onsuccess=()=>{for(const r of all.result){r.retryAt=0;store.put(r);}};tx.oncomplete=()=>{db.close();resolve();};};}));
 await page.reload();await page.locator('#login [name=username]').fill('teste');await page.locator('#login [name=password]').fill('senha-sintetica');await page.locator('#login button[type=submit]').click();
 await page.waitForFunction(()=>!document.querySelector('#pending')?.textContent.includes('AGUARDANDO'));assert.equal(records.size,1);
 await page.locator('[data-screen=checklist-fleet]').click();await page.locator('#checklist-manual').click();await page.locator('#checklist-fleet [name=fleet]').fill('509');await page.locator('#checklist-fleet button').click();await page.locator('[data-answer=PERFEITO]').click();await page.locator('#checklist-form button[type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('[data-workflow=methods]')&& !document.querySelector('#pending')?.textContent.includes('AGUARDANDO'));
 await page.locator('[data-workflow=methods]').click();await page.locator('#context-form [name=localCode]').fill('0010');await page.locator('#context-form [name=materialCode]').fill('20');await page.locator('#context-form [name=workFront]').fill('FRENTE NORTE');assert.match(await page.locator('#context-form').textContent(),/LOCAL DO MATERIAL/);await mkdir('output/work-front',{recursive:true});await page.screenshot({path:'output/work-front/selecao.png',fullPage:true});await page.locator('#context-form button').click();await page.locator('#edit-context').click();assert.equal(await page.locator('#context-form [name=workFront]').inputValue(),'FRENTE NORTE');await page.locator('#context-form button').click();await page.locator('#manual-method').click();await page.locator('#fleet-code [name=fleet]').fill('509');await page.locator('#fleet-code button').click();
 assert.match(await page.locator('#refuel').textContent(),/SEM LEITURA ANTERIOR/);await page.locator('#refuel [name=engine]').fill('452');await page.locator('#refuel [name=liters]').fill('30');await context.setOffline(true);await page.locator('#refuel button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#pending')?.textContent.includes('1 AGUARDANDO'));
 const pending=await page.evaluate(()=>new Promise(resolve=>{const req=indexedDB.open('abencoada-diesel-mobile',1);req.onsuccess=()=>{const db=req.result,r=db.transaction('queue').objectStore('queue').getAll();r.onsuccess=()=>{resolve(r.result);db.close()}}}));assert.equal(pending.length,1);assert.equal(pending[0].workFront,'FRENTE NORTE');assert.equal(pending[0].command.data.work_front,'FRENTE NORTE');
 await page.close();await context.setOffline(false);page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));await page.goto(base+'/mobile/index.html');await page.locator('#login [name=username]').fill('teste');await page.locator('#login [name=password]').fill('senha-sintetica');await page.locator('#login button[type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('[data-workflow=transfer]')&&!document.querySelector('#pending')?.textContent.includes('AGUARDANDO'));
 await page.locator('[data-workflow=transfer]').click();await page.locator('#context-form [name=localCode]').fill('0010');await page.locator('#context-form [name=materialCode]').fill('20');await page.locator('#context-form button').click();await page.locator('#transfer-form [name=recorderEnd]').fill('130');await page.locator('#transfer-form [name=destination]').fill('0020');await page.locator('#transfer-form button.primary').click();
 await page.waitForFunction(()=>document.querySelector('[data-workflow=methods]')&&!document.querySelector('#pending')?.textContent.includes('AGUARDANDO'));
 assert.equal([...records.values()].find(r=>r.command.kind==='refuel').command.data.work_front,'FRENTE NORTE');console.log('Work front preserved through offline capture, browser reload and delivery. Four operations captured.');assert.equal(records.size,4);assert.deepEqual(new Set([...records.values()].map(r=>r.command.kind)),new Set(['refuel','transfer','occurrence','checklist']));
 await mkdir('output/api-v1',{recursive:true});await page.screenshot({path:'output/api-v1/mobile.png',fullPage:true});
 // Temporary-password flow and admin screen load use the same production-built modules.
 const adminContext=await browser.newContext({serviceWorkers:'block'});const admin=await adminContext.newPage();admin.on('pageerror',e=>pageErrors.push(e.message));await admin.goto(base+'/web/admin.html');await admin.locator('#login-form [name=username]').fill('temporario');await admin.locator('#login-form [name=password]').fill('temporaria');await admin.locator('#login-form button').click();await admin.locator('#web-change-password').waitFor();await admin.locator('[name=newPassword]').fill('nova-senha-sintetica');await admin.locator('[name=confirmation]').fill('nova-senha-sintetica');await admin.locator('#web-change-password button').click();await admin.locator('#login-form [name=username]').fill('teste');await admin.locator('#login-form [name=password]').fill('nova-senha-sintetica');await admin.locator('#login-form button').click();await admin.locator('[data-view=history]').waitFor();await admin.locator('[data-view=history]').click();await admin.locator('table tbody tr').first().waitFor();await admin.locator('[data-detail]').first().click();await admin.locator('.detail-grid').waitFor();assert.match(await admin.locator('.detail-grid').textContent(),/FRENTE NORTE/);await admin.screenshot({path:'output/api-v1/admin.png',fullPage:true});
 assert.deepEqual(pageErrors,[]);assert(calls.some(c=>c.path.startsWith('/api/v1/submissions/')));assert(calls.every(c=>c.path==='/api/v1/auth/login'||c.auth==='Bearer synthetic-session'));
 console.log('Browser: four mobile operations, lost-response restart reconciliation, temporary-password change and admin history passed over synthetic HTTP. Screenshots: output/api-v1/.');
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
