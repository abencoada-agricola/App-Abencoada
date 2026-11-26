package br.com.abencoada.diesel;
import android.content.Context;
import androidx.work.ListenableWorker.Result;
import org.json.*;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

// All network work happens outside OfflineStore.LOCK. Results merge into the latest encrypted state.
final class ApiV1Sync {
 private final Context context;
 ApiV1Sync(Context context){this.context=context;}
 static JSONObject find(JSONArray rows,String id){if(rows!=null)for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);if(row!=null&&id.equals(row.optString("id")))return row;}return null;}
 static JSONArray without(JSONArray rows,String id){JSONArray result=new JSONArray();if(rows!=null)for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);if(row!=null&&!id.equals(row.optString("id")))result.put(row);}return result;}
 static boolean pending(JSONObject s){return s.optJSONArray("queue")!=null&&s.optJSONArray("queue").length()>0||s.optJSONArray("acks")!=null&&s.optJSONArray("acks").length()>0;}
 static boolean validBase(String base){try{URL url=new URL(base);boolean local=Arrays.asList("localhost","127.0.0.1","10.0.2.2","[::1]").contains(url.getHost());return url.getUserInfo()==null&&url.getQuery()==null&&url.getRef()==null&&(url.getProtocol().equals("https")||local&&url.getProtocol().equals("http"));}catch(Exception e){return false;}}
 static Set<String> dependencies(JSONObject r){Set<String> result=new HashSet<>();if(r.has("localCode")&&r.has("materialCode"))result.add("local:"+r.optString("localCode")+":"+r.optString("materialCode"));if(r.has("fleet"))result.add((r.optString("kind").equals("checklist")?"checklist:":"fleet:")+r.optString("fleet"));if(r.optString("kind").equals("transfer"))result.add("local:"+r.optString("destination")+":"+r.optString("materialCode"));return result;}
 static boolean receiptMatches(JSONObject receipt,JSONObject record){try{return UUID.fromString(receipt.getString("id"))!=null&&receipt.getString("submission_id").equalsIgnoreCase(record.getJSONObject("command").getString("submission_id"))&&receipt.getString("kind").equals(record.getJSONObject("command").getString("kind"))&&Arrays.asList("active","removed").contains(receipt.getString("state"))&&receipt.get("duplicate") instanceof Boolean&&receipt.getJSONArray("warnings")!=null&&java.time.OffsetDateTime.parse(receipt.getString("received_at"))!=null;}catch(Exception e){return false;}}
 static final class HttpFailure extends Exception {final int status;final String code;final long retryAt;HttpFailure(int status,JSONObject body,long retryAt){super(body.optJSONObject("error")==null?"A API não concluiu o envio.":body.optJSONObject("error").optString("message","Falha no envio."));this.status=status;this.code=body.optJSONObject("error")==null?"HTTP_ERROR":body.optJSONObject("error").optString("code");this.retryAt=retryAt;}}
 private JSONObject request(String base,String token,String path,JSONObject body) throws Exception {
  HttpURLConnection c=(HttpURLConnection)new URL(base+path).openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(15000);c.setReadTimeout(45000);c.setRequestMethod(body==null?"GET":"POST");c.setRequestProperty("Authorization","Bearer "+token);c.setRequestProperty("Accept","application/json");
  try{if(body!=null){c.setRequestProperty("Content-Type","application/json");c.setDoOutput(true);byte[] data=body.toString().getBytes(StandardCharsets.UTF_8);c.setFixedLengthStreamingMode(data.length);try(OutputStream out=c.getOutputStream()){out.write(data);}}
   int status=c.getResponseCode();InputStream stream=status>=400?c.getErrorStream():c.getInputStream();String raw="";if(stream!=null)try(InputStream in=stream;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[4096];int n;while((n=in.read(buffer))!=-1){out.write(buffer,0,n);if(out.size()>1200000)throw new IOException("Resposta muito grande.");}raw=out.toString("UTF-8");}
   JSONObject result=raw.isEmpty()?new JSONObject():new JSONObject(raw);if(status<200||status>=300){long retryAt=System.currentTimeMillis()+30000;String header=c.getHeaderField("Retry-After");if(header!=null)try{retryAt=System.currentTimeMillis()+Math.max(0,Long.parseLong(header))*1000;}catch(Exception e){try{retryAt=java.time.ZonedDateTime.parse(header,java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME).toInstant().toEpochMilli();}catch(Exception ignored){}}
    throw new HttpFailure(status,result,retryAt);}return result;
  }finally{c.disconnect();}
 }
 Result run(){boolean retry=false;try{
  JSONObject snapshot;synchronized(OfflineStore.LOCK){snapshot=OfflineStore.read(context);}
  if(!validBase(snapshot.optString("url"))||snapshot.optString("token").isEmpty())return Result.failure();
  JSONArray queue=snapshot.optJSONArray("queue");if(queue==null)return Result.success();Set<String> blocked=new HashSet<>();List<String> delivered=new ArrayList<>();
  for(int i=0;i<queue.length();i++){
   JSONObject record=queue.getJSONObject(i);String id=record.getString("id"),base=snapshot.getString("url"),user=snapshot.getString("userId");Set<String> deps=dependencies(record);
   synchronized(OfflineStore.LOCK){JSONObject latest=OfflineStore.read(context),current=find(latest.optJSONArray("queue"),id);
    if(!sameIdentity(latest,snapshot)||current==null||!OfflineStore.sameJson(current.optJSONObject("command"),record.optJSONObject("command")))continue;
    record=new JSONObject(current.toString());String state=record.optString("deliveryState");
    if(!record.optString("backendId").equals("api-v1")||!record.optString("apiBase").equals(base)||!record.optString("userId").equals(user)||record.has("error")||state.equals("needs_review")||state.equals("blocked")||!Collections.disjoint(blocked,deps)){blocked.addAll(deps);continue;}
    if(record.optLong("retryAt")>System.currentTimeMillis()){blocked.addAll(deps);retry=true;continue;}
    current.put("deliveryState","sending");current.put("attempted",true);OfflineStore.write(context,latest);
   }
   JSONObject receipt=null;Exception failure=null;
   try{
    // Always GET first: a foreground request or a previous process may already have committed.
    try{receipt=request(base,snapshot.getString("token"),"/api/v1/submissions/"+record.getJSONObject("command").getString("submission_id"),null);}catch(HttpFailure e){if(e.status!=404)throw e;}
    if(receipt==null)receipt=request(base,snapshot.getString("token"),"/api/v1/operations",record.getJSONObject("command"));
    if(!receiptMatches(receipt,record))throw new IOException("Recebimento não confirmado.");
   }catch(Exception e){failure=e;}
   synchronized(OfflineStore.LOCK){JSONObject latest=OfflineStore.read(context),current=find(latest.optJSONArray("queue"),id);if(!sameIdentity(latest,snapshot))continue;
    if(failure==null){JSONArray acks=latest.optJSONArray("acks");if(acks==null)acks=new JSONArray();if(find(acks,id)==null)acks.put(new JSONObject().put("id",id).put("userId",user).put("backendId","api-v1").put("apiBase",base).put("receipt",receipt));latest.put("acks",acks);latest.put("queue",without(latest.optJSONArray("queue"),id));delivered.add(id);}
    else if(current!=null&&OfflineStore.sameJson(current.optJSONObject("command"),record.optJSONObject("command"))){int status=failure instanceof HttpFailure?((HttpFailure)failure).status:0;String code=failure instanceof HttpFailure?((HttpFailure)failure).code:"NETWORK_ERROR";String state=status==401||status==403?"blocked":(status==409||status==422)&&!code.equals("IDEMPOTENCY_CONFLICT")?"needs_review":"unknown";current.put("deliveryState",state);current.put("attempted",true);current.put("lastSendError",failure.getMessage());current.put("retryAt",failure instanceof HttpFailure?((HttpFailure)failure).retryAt:System.currentTimeMillis()+30000);if(state.equals("needs_review"))current.put("error",failure.getMessage());blocked.addAll(deps);if(state.equals("unknown"))retry=true;}
    OfflineStore.write(context,latest);
   }
  }
  DeliveryNotifications.showConfirmed(context,snapshot.getString("userId"),delivered);return retry?Result.retry():Result.success();
 }catch(Exception e){return Result.retry();}}
 private boolean sameIdentity(JSONObject a,JSONObject b){return a.optString("userId").equals(b.optString("userId"))&&a.optString("url").equals(b.optString("url"))&&a.optString("backendId").equals("api-v1");}
}
