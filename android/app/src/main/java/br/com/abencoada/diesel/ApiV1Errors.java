package br.com.abencoada.diesel;

// Never show raw API or platform exception messages to the user.
final class ApiV1Errors {
 static String message(int status,String code,org.json.JSONObject context,org.json.JSONArray fields){
  if("VALIDATION_ERROR".equals(code)&&fields!=null)for(int i=0;i<fields.length();i++){org.json.JSONObject field=fields.optJSONObject(i);if(field!=null&&java.util.Arrays.asList("refuel.data.work_front","data.work_front","work_front").contains(field.optString("path")))return "O servidor recusou o campo Frente de Trabalho. O registro continua salvo. Confira o campo ou solicite ao gestor a atualização da API. Para enviar sem a frente, deixe esse campo vazio em Conferir e corrigir.";}
  return message(status,code,context);
 }
 static String message(int status,String code,org.json.JSONObject context){
  String text=message(status,code);
  if(!"READING_CONFLICT".equals(code)||context==null)return text;
  org.json.JSONObject readings=context.optJSONObject("current_readings");if(readings==null)return text;
  String[] keys={"km","engine","elevator"},labels={"KM de referência","Horímetro do motor de referência","Horímetro do elevador de referência"};
  java.util.List<String> references=new java.util.ArrayList<>();java.text.NumberFormat format=java.text.NumberFormat.getNumberInstance(new java.util.Locale("pt","BR"));format.setMaximumFractionDigits(8);
  for(int i=0;i<keys.length;i++){String value=readings.optString(keys[i],"");if(!value.matches("[0-9]+(\\.[0-9]+)?"))continue;try{java.math.BigDecimal number=new java.math.BigDecimal(value);if(number.signum()>=0&&number.compareTo(new java.math.BigDecimal("1000000000"))<=0)references.add(labels[i]+": "+format.format(number));}catch(NumberFormatException ignored){}}
  return text+(references.isEmpty()?"":" "+String.join("; ",references)+".");
 }
 static String message(int status,String code){
  switch(code==null?"":code){
   case "UNAUTHENTICATED":case "LOCAL_AUTH_REQUIRED":return "Sua sessão expirou. Entre novamente na mesma conta para continuar.";
   case "FORBIDDEN":return "Você não tem permissão para esta ação. Consulte o gestor.";
   case "READING_CONFLICT":return "As leituras informadas conflitam com as referências atuais. Confira o KM, os horímetros e a registradora antes de reenviar.";
   case "METER_CONFIGURATION_CHANGED":return "Os medidores da frota foram alterados. Atualize os dados e confira o registro antes de reenviar.";
   case "VERSION_CONFLICT":return "Os dados foram atualizados em outro aparelho. Atualize e confira o registro antes de reenviar.";
   case "STATE_CONFLICT":return "O registro foi alterado e não permite esta ação agora. Atualize os dados e confira novamente.";
   case "IDEMPOTENCY_CONFLICT":return "O envio ainda precisa ser confirmado. O registro continua salvo; aguarde a confirmação antes de alterá-lo.";
   case "VALIDATION_ERROR":return "Existem dados inválidos ou incompletos. Confira o registro antes de reenviar.";
   case "TANK_CAPACITY_EXCEEDED":return "A quantidade informada ultrapassa a capacidade do tanque. Confira os litros antes de reenviar.";
   case "NOT_FOUND":return "O item não foi encontrado. Atualize os dados e confira os códigos informados.";
   case "RATE_LIMITED":return "Houve muitas tentativas. Aguarde um pouco; o aplicativo tentará novamente.";
   case "BODY_TOO_LARGE":return "O arquivo ou os dados são muito grandes. Reduza a foto e tente novamente.";
   case "INVALID_JSON":return "Não foi possível ler os dados enviados. O registro continua salvo. Tente novamente.";
   case "UNSUPPORTED_MEDIA_TYPE":return "O formato do arquivo não é aceito. Escolha uma imagem e tente novamente.";
   case "METHOD_NOT_ALLOWED":return "Esta ação não está disponível no servidor. Consulte o gestor.";
   case "NETWORK_ERROR":return "Não foi possível conectar ao servidor. Os registros continuam salvos no aparelho.";
   case "INVALID_API_RESPONSE":return "Não foi possível confirmar a resposta do servidor. Os registros continuam salvos.";
   case "INTERNAL_ERROR":case "SERVICE_UNAVAILABLE":return "O servidor está indisponível no momento. Os registros continuam salvos; o aplicativo tentará novamente.";
  }
  if(status==401)return message(status,"UNAUTHENTICATED");
  if(status==403)return message(status,"FORBIDDEN");
  if(status==404)return message(status,"NOT_FOUND");
  if(status==409)return "Há um conflito com os dados atuais. Confira o registro antes de reenviar.";
  if(status==422)return message(status,"VALIDATION_ERROR");
  if(status==429)return message(status,"RATE_LIMITED");
  if(status>=500)return message(status,"SERVICE_UNAVAILABLE");
  return "Não foi possível concluir a solicitação. Os registros continuam salvos. Tente novamente ou consulte o gestor.";
 }
}
