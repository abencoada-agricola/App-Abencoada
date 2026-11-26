package br.com.abencoada.diesel;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import androidx.work.*;
import java.util.concurrent.TimeUnit;
import org.json.*;
@CapacitorPlugin(name="OfflineSync")
public class OfflineSyncPlugin extends Plugin {
 @PluginMethod public void configure(PluginCall call){if("api-v1".equals(call.getString("backendId"))){configureV1(call);return;}try{synchronized(OfflineStore.LOCK){JSONObject state=OfflineStore.read(getContext());String user=call.getString("userId");if(!user.equals(state.optString("userId"))&&state.optJSONArray("queue")!=null&&state.getJSONArray("queue").length()>0){call.reject("Há registros pendentes de outra conta.");return;}state.put("userId",user);state.put("token",call.getString("token"));state.put("url",call.getString("url"));state.put("apikey",call.getString("apikey"));OfflineStore.write(getContext(),state);}schedule();call.resolve();}catch(Exception e){call.reject("Não foi possível preparar o envio automático.");}}
 @PluginMethod public void mirror(PluginCall call){if("api-v1".equals(call.getString("backendId"))){mirrorV1(call);return;}try{synchronized(OfflineStore.LOCK){JSONObject state=OfflineStore.read(getContext());String user=call.getString("userId");if(!user.equals(state.optString("userId"))){call.resolve(new JSObject().put("ready",false));return;}JSONArray incoming=call.getArray("queue"),acks=state.optJSONArray("acks");if(acks==null)acks=new JSONArray();JSONArray pending=new JSONArray();for(int i=0;i<incoming.length();i++){JSONObject r=incoming.getJSONObject(i);boolean sent=false;for(int j=0;j<acks.length();j++)if(acks.getJSONObject(j).getString("id").equals(r.getString("id"))){sent=true;break;}if(!sent)pending.put(r);}state.put("queue",pending);OfflineStore.write(getContext(),state);call.resolve(new JSObject().put("ready",true).put("acks",acks).put("errors",state.optJSONArray("errors")==null?new JSONArray():state.getJSONArray("errors")));}schedule();}catch(Exception e){call.reject("Não foi possível guardar a fila de envio automático.");}}
 @PluginMethod public void acknowledge(PluginCall call){try{synchronized(OfflineStore.LOCK){JSONObject state=OfflineStore.read(getContext());if(!call.getString("userId").equals(state.optString("userId"))){call.resolve();return;}JSONArray ids=call.getArray("ids"),acks=state.optJSONArray("acks"),remaining=new JSONArray();if(acks!=null)for(int i=0;i<acks.length();i++){boolean remove=false;for(int j=0;j<ids.length();j++)if(ids.getString(j).equals(acks.getJSONObject(i).getString("id")))remove=true;if(!remove)remaining.put(acks.getJSONObject(i));}state.put("acks",remaining);OfflineStore.write(getContext(),state);}call.resolve();}catch(Exception e){call.reject("Não foi possível confirmar a fila.");}}

 @PluginMethod public void inspect(PluginCall call){try{synchronized(OfflineStore.LOCK){JSONObject s=OfflineStore.read(getContext());call.resolve(new JSObject().put("userId",s.optString("userId")).put("backendId",s.optString("backendId")).put("url",s.optString("url")).put("queue",array(s,"queue")).put("acks",array(s,"acks")));}}catch(Exception e){call.reject("Não foi possível conferir a fila anterior. Os dados foram preservados.");}}
 private JSONArray array(JSONObject s,String key){JSONArray a=s.optJSONArray(key);return a==null?new JSONArray():a;}
 private void configureV1(PluginCall call){try{synchronized(OfflineStore.LOCK){
  JSONObject s=OfflineStore.read(getContext());String user=call.getString("userId"),url=call.getString("url"),token=call.getString("token");
  if(user==null||token==null||token.isEmpty()||!ApiV1Sync.validBase(url))throw new Exception();
  if(ApiV1Sync.pending(s)&&(!s.optString("backendId").equals("api-v1")||!s.optString("url").equals(url)||!s.optString("userId").equals(user))){call.reject("Há registros de outra conta ou conexão. Os dados foram preservados.");return;}
  s.put("backendId","api-v1");s.put("userId",user);s.put("url",url);s.put("token",token);s.put("expiresAt",call.getString("expiresAt"));s.remove("apikey");
  for(int i=0;i<array(s,"queue").length();i++){JSONObject r=array(s,"queue").getJSONObject(i);if(r.optString("deliveryState").equals("blocked")){r.put("deliveryState","unknown");r.put("retryAt",0);}}
  OfflineStore.write(getContext(),s);
 }schedule();call.resolve();}catch(Exception e){call.reject("Não foi possível preparar o envio automático. Os dados foram preservados.");}}
 private void mirrorV1(PluginCall call){try{synchronized(OfflineStore.LOCK){
  JSONObject s=OfflineStore.read(getContext());String user=call.getString("userId");
  if(!s.optString("backendId").equals("api-v1")||!s.optString("url").equals(call.getString("url"))||!s.optString("userId").equals(user)){call.resolve(new JSObject().put("ready",false));return;}
  JSONArray incoming=call.getArray("queue"),existing=array(s,"queue"),acks=array(s,"acks"),pending=new JSONArray();
  for(int i=0;i<incoming.length();i++){JSONObject r=incoming.getJSONObject(i);String id=r.getString("id");
   if(!r.optString("backendId").equals("api-v1")||!r.optString("apiBase").equals(s.optString("url"))||!r.optString("userId").equals(user)||r.optJSONObject("command")==null)throw new Exception();
   if(ApiV1Sync.find(acks,id)!=null)continue;
   JSONObject old=ApiV1Sync.find(existing,id);
   if(old!=null&&!OfflineStore.sameJson(old.optJSONObject("command"),r.optJSONObject("command"))){call.reject("Confirme o recebimento antes de alterar o registro.");return;}
   // Preserve native in-flight state and backoff. A fresh foreground rejection may also stop native retries.
   if(old!=null&&(old.optString("deliveryState").equals("sending")||old.optLong("retryAt")>r.optLong("retryAt")||old.optString("deliveryState").equals("needs_review")))pending.put(old);else pending.put(r);
  }
  for(int i=0;i<existing.length();i++){JSONObject r=existing.getJSONObject(i);if(r.optString("deliveryState").equals("sending")&&ApiV1Sync.find(pending,r.optString("id"))==null&&ApiV1Sync.find(acks,r.optString("id"))==null)pending.put(r);}
  s.put("queue",pending);OfflineStore.write(getContext(),s);call.resolve(new JSObject().put("ready",true).put("queue",pending).put("acks",acks));
 }schedule();}catch(Exception e){call.reject("Não foi possível guardar a fila. Os dados foram preservados.");}}
 @PluginMethod public void revise(PluginCall call){try{synchronized(OfflineStore.LOCK){
  JSONObject s=OfflineStore.read(getContext()),record=call.getObject("record");String id=record.getString("id");
  if(!s.optString("backendId").equals("api-v1")||!s.optString("userId").equals(call.getString("userId"))||!record.optString("apiBase").equals(s.optString("url")))throw new Exception();
  JSONObject old=ApiV1Sync.find(array(s,"queue"),id);
  if(ApiV1Sync.find(array(s,"acks"),id)!=null||old!=null&&(!old.optString("deliveryState").equals("needs_review")||!OfflineStore.sameJson(old.optJSONObject("command"),call.getObject("previousCommand")))){call.reject("Aguarde a confirmação do envio antes de corrigir.");return;}
  JSONArray queue=ApiV1Sync.without(array(s,"queue"),id);queue.put(record);s.put("queue",queue);OfflineStore.write(getContext(),s);call.resolve();
 }}catch(Exception e){call.reject("Não foi possível revisar o registro. Os dados foram preservados.");}}

 private void schedule(){Constraints constraints=new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();WorkManager manager=WorkManager.getInstance(getContext());manager.enqueueUniqueWork("abastece-sync-now",ExistingWorkPolicy.KEEP,new OneTimeWorkRequest.Builder(OfflineSyncWorker.class).setConstraints(constraints).setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.SECONDS).build());manager.enqueueUniquePeriodicWork("abastece-sync-periodic",ExistingPeriodicWorkPolicy.KEEP,new PeriodicWorkRequest.Builder(OfflineSyncWorker.class,15,TimeUnit.MINUTES).setConstraints(constraints).build());}
}
