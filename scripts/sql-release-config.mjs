export function validateSqlRelease(env=process.env){
 const endpoint=env.SQL_API_URL||'';
 if(env.APP_BACKEND&&env.APP_BACKEND!=='sqlserver')throw Error('O aplicativo usa somente SQL Server.');
 if(!endpoint)throw Error('Configure SQL_API_URL com o endereço HTTPS da API. A publicação não usará Supabase.');
 if(endpoint){const url=new URL(endpoint);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('Endereço da API inválido.');if(env.REQUIRE_HTTPS==='true'&&(url.protocol!=='https:'||['localhost','127.0.0.1','10.0.2.2'].includes(url.hostname)))throw Error('Publicação exige uma API HTTPS acessível aos usuários.');}
 return endpoint.replace(/\/$/,'');
}
