// SQL-only entry point for new releases. No Supabase client or fallback.
import {config} from './config.js';
import {sqlSignIn,sqlSignOut,sqlUserId,sqlApi} from './sqlserver-client.js';
export const isConfigured=()=>config.backend==='sqlserver'&&/^https?:\/\//.test(config.url);
export const getAuthUserId=sqlUserId;
export const signIn=sqlSignIn;
export const signOut=sqlSignOut;
export const api=sqlApi;
export async function fieldApi(){throw Error('Entre com seu usuário e senha para conectar ao banco local.')}
