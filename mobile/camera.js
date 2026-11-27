// Capture inside the app: some OEM camera activities fail to return an IMAGE_CAPTURE result.
export async function captureOccurrencePhoto(){
 const panel=document.createElement('section');panel.className='capture-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Fotografar ocorrência');
 panel.innerHTML='<h2>FOTOGRAFAR OCORRÊNCIA</h2><video autoplay muted playsinline aria-label="Prévia da câmera"></video><p role="status">ABRINDO CÂMERA…</p><button type="button" class="primary" id="capture-photo" disabled>TIRAR FOTO</button><button type="button" class="secondary" id="cancel-capture">CANCELAR</button>';
 document.body.append(panel);
 const video=panel.querySelector('video'),status=panel.querySelector('[role=status]'),button=panel.querySelector('#capture-photo');
 let stream,finished=false,resolveResult,rejectResult;
 const result=new Promise((resolve,reject)=>{resolveResult=resolve;rejectResult=reject});
 const hidden=()=>{if(document.hidden)finish(null)};
 const finish=(file,error)=>{if(finished)return;finished=true;stream?.getTracks().forEach(track=>track.stop());video.srcObject=null;panel.remove();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',cancel);if(error)rejectResult(error);else resolveResult(file)};
 const cancel=()=>finish(null);panel.querySelector('#cancel-capture').onclick=cancel;
 document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',cancel);
 button.onclick=async()=>{
  button.disabled=true;
  try{
   if(!video.videoWidth||!video.videoHeight)throw Error('A câmera ainda não está pronta. Tente novamente.');
   const canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(video.videoWidth,video.videoHeight));canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.85));if(!blob)throw Error('Não foi possível preparar a foto. Tente novamente.');
   finish(new File([blob],'ocorrencia.jpg',{type:'image/jpeg'}));
  }catch(error){status.textContent='NÃO FOI POSSÍVEL TIRAR A FOTO. TENTE NOVAMENTE.';button.disabled=false;}
 };
 // Run separately so cancellation can close the panel even while camera permission is pending.
 (async()=>{try{
  const opened=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:960}}});
  if(finished){opened.getTracks().forEach(track=>track.stop());return;}stream=opened;video.srcObject=stream;
  await video.play();if(finished)return;status.textContent='ENQUADRE A IMAGEM E TOQUE EM TIRAR FOTO.';button.disabled=false;
 }catch{finish(null,Error('Não foi possível abrir a câmera. Confira a permissão de câmera do aplicativo ou use a galeria.'));}})();
 return result;
}
