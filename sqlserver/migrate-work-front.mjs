import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export async function applyWorkFront(db){
 await db.query(await readFile(new URL('./migrations/20261126-work-front.sql',import.meta.url),'utf8'));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {Database}=await import('./database.mjs');
 const db=new Database();
 try{
  await db.transaction(()=>applyWorkFront(db));
  const [column]=await db.query("SELECT c.name,c.is_nullable FROM sys.columns c WHERE c.object_id=OBJECT_ID('app.records') AND c.name='work_front'");
  if(!column?.is_nullable)throw Error('A coluna work_front não foi confirmada.');
  console.log('APP_ABENCOADA: work_front disponível e opcional; registros existentes preservados.');
 }finally{db.close()}
}
