// Only app-owned Portuguese text reaches the UI; API messages may be technical or in another language.
export function apiErrorMessage(error={}){
 const code=String(error.code||error.errorCode||''),status=Number(error.status||error.errorStatus||0);
 if(code==='VALIDATION_ERROR'&&Array.isArray(error.fields)&&error.fields.some(f=>['refuel.data.work_front','data.work_front','work_front'].includes(f?.path)))return 'O servidor recusou o campo Frente de Trabalho. O registro continua salvo. Confira o campo ou solicite ao gestor a atualização da API. Para enviar sem a frente, deixe esse campo vazio em Conferir e corrigir.';
 const messages={
  INVALID_CREDENTIALS:'Usuário ou senha incorretos. Confira os dados e tente novamente.',
  UNAUTHENTICATED:'Sua sessão expirou. Entre novamente na mesma conta para continuar.',
  LOCAL_AUTH_REQUIRED:'Entre novamente na mesma conta para continuar.',
  FORBIDDEN:'Você não tem permissão para esta ação. Consulte o gestor.',
  READING_CONFLICT:'As leituras informadas conflitam com as referências atuais. Confira o KM, os horímetros e a registradora antes de reenviar.',
  METER_CONFIGURATION_CHANGED:'Os medidores da frota foram alterados. Atualize os dados e confira o registro antes de reenviar.',
  VERSION_CONFLICT:'Os dados foram atualizados em outro aparelho. Atualize e confira o registro antes de reenviar.',
  STATE_CONFLICT:'O registro foi alterado e não permite esta ação agora. Atualize os dados e confira novamente.',
  IDEMPOTENCY_CONFLICT:'O envio ainda precisa ser confirmado. O registro continua salvo; aguarde a confirmação antes de alterá-lo.',
  VALIDATION_ERROR:'Existem dados inválidos ou incompletos. Confira o registro antes de reenviar.',
  TANK_CAPACITY_EXCEEDED:'A quantidade informada ultrapassa a capacidade do tanque. Confira os litros antes de reenviar.',
  NOT_FOUND:'O item não foi encontrado. Atualize os dados e confira os códigos informados.',
  RATE_LIMITED:'Houve muitas tentativas. Aguarde um pouco; o aplicativo tentará novamente.',
  BODY_TOO_LARGE:'O arquivo ou os dados são muito grandes. Reduza a foto e tente novamente.',
  INVALID_JSON:'Não foi possível ler os dados enviados. O registro continua salvo. Tente novamente.',
  UNSUPPORTED_MEDIA_TYPE:'O formato do arquivo não é aceito. Escolha uma imagem e tente novamente.',
  METHOD_NOT_ALLOWED:'Esta ação não está disponível no servidor. Consulte o gestor.',
  NETWORK_ERROR:'Não foi possível conectar ao servidor. Os registros continuam salvos no aparelho.',
  INVALID_API_RESPONSE:'Não foi possível confirmar a resposta do servidor. Os registros continuam salvos.'
 };
 if(code==='READING_CONFLICT'){
  const readings=error.context?.current_readings||{},references=[];
  for(const [key,label] of [['km','KM de referência'],['engine','Horímetro do motor de referência'],['elevator','Horímetro do elevador de referência']]){
   const value=readings[key];
   if((typeof value==='string'&&/^\d+(\.\d+)?$/.test(value)||typeof value==='number')&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=1e9)references.push(label+': '+Number(value).toLocaleString('pt-BR',{maximumFractionDigits:8}));
  }
  return messages[code]+(references.length?' '+references.join('; ')+'.':'');
 }
 if(messages[code])return messages[code];
 // Old queues saved the English message without its code. Translate without rewriting their commands.
 if(!code&&/operation conflicts with current references|reading.conflict/i.test(error.message||''))return messages.READING_CONFLICT;
 if(status===401)return messages.UNAUTHENTICATED;
 if(status===403)return messages.FORBIDDEN;
 if(status===404)return messages.NOT_FOUND;
 if(status===409)return 'Há um conflito com os dados atuais. Confira o registro antes de reenviar.';
 if(status===422)return messages.VALIDATION_ERROR;
 if(status===429)return messages.RATE_LIMITED;
 if(status>=500||['INTERNAL_ERROR','SERVICE_UNAVAILABLE'].includes(code))return 'O servidor está indisponível no momento. Os registros continuam salvos; o aplicativo tentará novamente.';
 return 'Não foi possível concluir a solicitação. Os registros continuam salvos. Tente novamente ou consulte o gestor.';
}
