package br.com.abencoada.diesel;
import static org.junit.Assert.*;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.SharedPreferences;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.*;
import org.junit.runner.RunWith;
import org.json.*;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

@RunWith(AndroidJUnit4.class)
public class ApiV1SyncTest {
 private Context context;private String saved;
 // Android may load instrumentation and target classes with different class loaders.
 // Reflect package-private internals here instead of widening the production API for tests.
 private static Object call(String type,String name,Class<?>[] signature,Object... args) throws Exception {java.lang.reflect.Method m=Class.forName("br.com.abencoada.diesel."+type).getDeclaredMethod(name,signature);m.setAccessible(true);return m.invoke(null,args);}
 private static Object storeLock() {try{java.lang.reflect.Field f=Class.forName("br.com.abencoada.diesel.OfflineStore").getDeclaredField("LOCK");f.setAccessible(true);return f.get(null);}catch(Exception e){throw new IllegalStateException(e);}}
 private static JSONObject read(Context c) throws Exception {return (JSONObject)call("OfflineStore","read",new Class<?>[]{Context.class},c);}
 private static void write(Context c,JSONObject s) throws Exception {call("OfflineStore","write",new Class<?>[]{Context.class,JSONObject.class},c,s);}
 private static boolean sameJson(Object a,Object b) throws Exception {return (Boolean)call("OfflineStore","sameJson",new Class<?>[]{Object.class,Object.class},a,b);}
 private static JSONObject find(JSONArray rows,String id) throws Exception {return (JSONObject)call("ApiV1Sync","find",new Class<?>[]{JSONArray.class,String.class},rows,id);}
 private static boolean pending(JSONObject s) throws Exception {return (Boolean)call("ApiV1Sync","pending",new Class<?>[]{JSONObject.class},s);}
 private static boolean receiptMatches(JSONObject receipt,JSONObject record) throws Exception {return (Boolean)call("ApiV1Sync","receiptMatches",new Class<?>[]{JSONObject.class,JSONObject.class},receipt,record);}
 private static boolean validBase(String base) throws Exception {return (Boolean)call("ApiV1Sync","validBase",new Class<?>[]{String.class},base);}
 private static String errorMessage(int status,String code) throws Exception {return (String)call("ApiV1Errors","message",new Class<?>[]{int.class,String.class},status,code);}
 private static Exception httpFailure(int status,JSONObject body) throws Exception {java.lang.reflect.Constructor<?> c=Class.forName("br.com.abencoada.diesel.ApiV1Sync$HttpFailure").getDeclaredConstructor(int.class,JSONObject.class,long.class);c.setAccessible(true);return (Exception)c.newInstance(status,body,0L);}
 private void runSync() throws Exception {Class<?> type=Class.forName("br.com.abencoada.diesel.ApiV1Sync");java.lang.reflect.Constructor<?> constructor=type.getDeclaredConstructor(Context.class);constructor.setAccessible(true);Object sync=constructor.newInstance(context);java.lang.reflect.Method run=type.getDeclaredMethod("run");run.setAccessible(true);run.invoke(sync);}

 private static final String ID="550e8400-e29b-41d4-a716-446655440000",OTHER="660e8400-e29b-41d4-a716-446655440000",USER="770e8400-e29b-41d4-a716-446655440000";
 @Before public void before(){// Separate preference namespace; never replace the application's real queue.
  context=new ContextWrapper(InstrumentationRegistry.getInstrumentation().getTargetContext()){@Override public SharedPreferences getSharedPreferences(String name,int mode){return super.getSharedPreferences("api-v1-instrumentation-"+name,mode);}};
  saved=context.getSharedPreferences("abastece-sync",0).getString("encrypted",null);
 }
 @After public void after(){if(saved==null)context.getSharedPreferences("abastece-sync",0).edit().remove("encrypted").commit();else context.getSharedPreferences("abastece-sync",0).edit().putString("encrypted",saved).commit();}
 private JSONObject record(String id,String base) throws Exception{return new JSONObject().put("id",id).put("kind","occurrence").put("userId",USER).put("backendId","api-v1").put("apiBase",base).put("deliveryState","pending").put("command",new JSONObject().put("submission_id",id).put("kind","occurrence").put("captured_at","2026-11-24T12:00:00Z").put("data",new JSONObject().put("notes","TESTE NATIVO")));}
 private JSONObject state(String base) throws Exception{return new JSONObject().put("backendId","api-v1").put("url",base).put("userId",USER).put("token","synthetic-device-token").put("queue",new JSONArray().put(record(ID,base)));}
 private JSONObject receipt() throws Exception{return new JSONObject().put("submission_id",ID).put("id",OTHER).put("kind","occurrence").put("received_at","2026-11-24T12:00:00Z").put("duplicate",false).put("state","active").put("warnings",new JSONArray());}
 @Test public void structuralEqualityAndReceiptIdentity() throws Exception {
  assertTrue(sameJson(new JSONObject("{\"x\":[1,2.00]}"),new JSONObject("{\"x\":[1.0,2]}")));
  assertFalse(sameJson(new JSONObject("{\"x\":1}"),new JSONObject("{\"x\":2}")));
  assertTrue(receiptMatches(receipt(),record(ID,"http://127.0.0.1")));
  assertFalse(receiptMatches(receipt().put("submission_id",OTHER),record(ID,"http://127.0.0.1")));
  assertFalse(validBase("http://example.test"));assertFalse(validBase("https://user:pass@example.test"));
 }
 @Test public void serverErrorsUsePortugueseAndSafeReferenceReadings() throws Exception {
  JSONObject detail=new JSONObject().put("code","READING_CONFLICT").put("message","Operation conflicts with current references").put("context",new JSONObject().put("current_readings",new JSONObject().put("km","51000").put("engine","2100").put("elevator","Raw English")));
  Exception failure=httpFailure(409,new JSONObject().put("error",detail));
  assertTrue(failure.getMessage().contains("KM de referência: 51.000"));assertTrue(failure.getMessage().contains("Horímetro do motor de referência: 2.100"));assertFalse(failure.getMessage().contains("English"));assertFalse(failure.getMessage().contains("Operation conflicts"));
  assertTrue(errorMessage(503,"FUTURE_ERROR").contains("indisponível"));assertTrue(errorMessage(0,"NETWORK_ERROR").contains("salvos no aparelho"));
 }
 @Test public void lostResponseReconcilesAndNetworkDoesNotHoldStoreLock() throws Exception {
  try(ServerSocket server=new ServerSocket(0,20,InetAddress.getByName("127.0.0.1"))){
   server.setSoTimeout(20000);String base="http://127.0.0.1:"+server.getLocalPort();write(context,state(base));
   AtomicInteger posts=new AtomicInteger(),gets=new AtomicInteger();AtomicReference<Throwable> error=new AtomicReference<>();
   Thread responder=new Thread(()->{try{for(int i=0;i<3;i++)try(Socket socket=server.accept()){
    BufferedReader in=new BufferedReader(new InputStreamReader(socket.getInputStream(),StandardCharsets.UTF_8));String first=in.readLine(),line;int length=0;boolean bearer=false;while((line=in.readLine())!=null&&!line.isEmpty()){if(line.toLowerCase().startsWith("content-length:"))length=Integer.parseInt(line.split(":",2)[1].trim());if(line.equals("Authorization: Bearer synthetic-device-token"))bearer=true;}assertTrue(bearer);for(int j=0;j<length;j++)in.read();
    // A separate thread must acquire the store lock while HTTP is in progress.
    CountDownLatch acquired=new CountDownLatch(1);Thread concurrent=new Thread(()->{synchronized(storeLock()){try{JSONObject latest=read(context);latest.put("marker","kept");if(find(latest.optJSONArray("queue"),OTHER)==null)latest.getJSONArray("queue").put(record(OTHER,base).put("deliveryState","needs_review").put("error","captura sintética preservada"));write(context,latest);acquired.countDown();}catch(Exception e){error.set(e);}}});concurrent.start();assertTrue("network held storage lock",acquired.await(3,TimeUnit.SECONDS));concurrent.join();
    if(first.startsWith("POST")){posts.incrementAndGet();continue;} // simulate a committed operation whose response was lost
    int n=gets.incrementAndGet();String json=n==1?"{\"error\":{\"code\":\"NOT_FOUND\",\"message\":\"Ausente\",\"fields\":[]}}":receipt().toString();byte[] bytes=json.getBytes(StandardCharsets.UTF_8);OutputStream out=socket.getOutputStream();out.write(("HTTP/1.1 "+(n==1?"404 Not Found":"200 OK")+"\r\nContent-Type: application/json\r\nContent-Length: "+bytes.length+"\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.UTF_8));out.write(bytes);out.flush();
   }}catch(Throwable e){error.set(e);}});responder.start();
   runSync();JSONObject after=read(context);assertEquals("unknown",after.getJSONArray("queue").getJSONObject(0).getString("deliveryState"));after.getJSONArray("queue").getJSONObject(0).put("retryAt",0);write(context,after);
   runSync();responder.join(20000);if(error.get()!=null)throw new AssertionError(error.get());assertFalse(responder.isAlive());
   JSONObject done=read(context);assertEquals(1,posts.get());assertEquals(2,gets.get());assertEquals(1,done.getJSONArray("queue").length());assertEquals(OTHER,done.getJSONArray("queue").getJSONObject(0).getString("id"));assertEquals(1,done.getJSONArray("acks").length());assertEquals("kept",done.getString("marker"));assertEquals(OTHER,done.getJSONArray("acks").getJSONObject(0).getJSONObject("receipt").getString("id"));
  }
 }
 @Test public void legacyEncryptedStateCanBeReadWithoutRewriting() throws Exception {
  JSONObject legacy=new JSONObject().put("queue",new JSONArray().put(new JSONObject().put("id",ID))).put("draft","preservar");write(context,legacy);String before=context.getSharedPreferences("abastece-sync",0).getString("encrypted",null);assertTrue(pending(read(context)));assertEquals(before,context.getSharedPreferences("abastece-sync",0).getString("encrypted",null));assertFalse(read(context).has("backendId"));
 }
}
