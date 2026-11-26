import {config} from '../web/config.js';
export function apiV1Config(env=process.env){
 if(env===process.env&&!env.APP_BACKEND&&!env.SQL_API_URL)env={...env,APP_BACKEND:config.backend,API_V1_URL:env.API_V1_URL||config.url};
 if(env.APP_BACKEND!=='api-v1'){if(env.API_V1_URL)throw Error('API_V1_URL exige APP_BACKEND=api-v1.');return null;}
 if(!env.API_V1_URL)throw Error('Configure API_V1_URL com a origem da API do Luiz.');
 const url=new URL(env.API_V1_URL),local=['localhost','127.0.0.1','10.0.2.2','[::1]'].includes(url.hostname);
 if(url.username||url.password||url.search||url.hash||!['http:','https:'].includes(url.protocol)||/\/api\/v1\/?$/.test(url.pathname))throw Error('Use a URL base da API, sem credenciais, query ou /api/v1.');
 if(url.protocol!=='https:'&&!(local&&env.REQUIRE_HTTPS!=='true'))throw Error('A conexão exige HTTPS. HTTP é permitido somente em teste local.');
 if(env.REQUIRE_HTTPS==='true'&&local)throw Error('Publicação exige API HTTPS acessível aos usuários.');
 return {backend:'api-v1',url:url.href.replace(/\/+$/,''),publishableKey:''};
}
