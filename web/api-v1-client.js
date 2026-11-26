// HTTP contract supplied by Luiz; no SQL credentials or legacy RPC fallback.
export function createApiV1Client({url,storage=globalThis.localStorage,fetcher=globalThis.fetch,now=Date.now}){
 const base=url.replace(/\/+$/,''),key='abencoada-api-v1-auth:'+base;
 const session=()=>{try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}};
 async function request(path,{method='GET',body,token,authenticated=true}={}){
  if(!path.startsWith('/')||path.startsWith('//'))throw Error('Caminho da API inválido.');
  const auth=session();if(authenticated&&!token){if(!auth?.token||Date.parse(auth.expires_at)<=now())throw Object.assign(Error('Entre novamente na mesma conta.'),{status:401,code:'LOCAL_AUTH_REQUIRED'});token=auth.token;}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try{
   const response=await fetcher(base+path,{method,headers:{Accept:'application/json',...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:controller.signal,redirect:'error',cache:'no-store'});
   const raw=response.status===204?'':await response.text();let data;
   try{data=raw?JSON.parse(raw):null}catch{throw Object.assign(Error('Resposta inválida do servidor. Os registros continuam salvos.'),{code:'INVALID_API_RESPONSE',status:response.status})}
   if(!response.ok){const detail=data?.error,header=response.headers.get('Retry-After');let retryAt;if(header){const seconds=Number(header);retryAt=Number.isFinite(seconds)?now()+Math.max(0,seconds)*1000:Date.parse(header);}
    throw Object.assign(Error(detail?.message||'A API não concluiu a solicitação.'),{status:response.status,code:detail?.code||'HTTP_ERROR',fields:detail?.fields||[],context:detail?.context||{},requestId:data?.request_id,retryAt:Number.isFinite(retryAt)?retryAt:undefined,data});}
   return data;
  }catch(error){if(error.name==='TypeError'||error.name==='AbortError')throw Object.assign(Error('Não foi possível conectar. Os registros continuam salvos neste aparelho.'),{code:'NETWORK_ERROR'});throw error}finally{clearTimeout(timer)}
 }
 async function signIn(username,password,loginFetcher){
  // loginFetcher is the existing timeout-aware mobile transport.
  const client=loginFetcher?createApiV1Client({url:base,storage,fetcher:loginFetcher,now}):{request};
  const result=await client.request('/api/v1/auth/login',{method:'POST',body:{username:String(username).trim(),password},authenticated:false});
  if(typeof result?.token!=='string'||!result.token||!result.user?.id||!Number.isFinite(Date.parse(result.expires_at))||typeof result.password_change_required!=='boolean')throw Object.assign(Error('Resposta de login inválida.'),{code:'INVALID_API_RESPONSE'});
  storage.setItem(key,JSON.stringify(result));return result;
 }
 async function signOut(){try{if(session()?.token)await request('/api/v1/auth/logout',{method:'POST'})}finally{storage.removeItem(key)}}
 async function changePassword(current_password,new_password){await request('/api/v1/auth/password',{method:'PUT',body:{current_password,new_password}});storage.removeItem(key);}
 async function pages(path){const items=[],seen=new Set();let cursor;do{const p=new URLSearchParams(path.split('?')[1]||'');p.set('limit','200');if(cursor)p.set('cursor',cursor);const result=await request(path.split('?')[0]+'?'+p);if(!Array.isArray(result?.items)||!(result.next_cursor===null||typeof result.next_cursor==='string'))throw Error('Página inválida da API.');items.push(...result.items);cursor=result.next_cursor;if(cursor&&seen.has(cursor))throw Error('Paginação repetida da API.');if(cursor)seen.add(cursor);}while(cursor);return items;}
 return {base,session,request,signIn,signOut,changePassword,pages,userId:()=>session()?.user?.id||null};
}
