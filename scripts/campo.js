/* ======================= GPS com trava por precisão ======================= */
const GPS_ALVO=3;          // trava sozinho quando a precisão fica em 3 m ou menos
const GPS_SEGUIDAS=3;      // ... por 3 leituras seguidas (demora mais, mas a coordenada assenta)
function gpsLigar(cb){
  const G=CAP&&CAP.Geolocation;const h={G,id:null,vivo:true};
  const ok=p=>{if(!h.vivo)return;const c=p.coords;cb({lat:c.latitude,lon:c.longitude,alt:(c.altitude==null?null:c.altitude),acc:c.accuracy,altAcc:c.altitudeAccuracy,t:p.timestamp||Date.now()})};
  if(G){(async()=>{try{await G.requestPermissions()}catch(e){}
    try{h.id=await G.watchPosition({enableHighAccuracy:true,timeout:30000,maximumAge:0},(p,err)=>{if(p)ok(p);else if(err&&h.vivo)cb(null,err)});if(!h.vivo)G.clearWatch({id:h.id})}catch(e){cb(null,e)}})();return h}
  if(!navigator.geolocation){setTimeout(()=>cb(null,{message:'Este aparelho não oferece localização aqui.'}));return h}
  h.id=navigator.geolocation.watchPosition(ok,e=>h.vivo&&cb(null,e),{enableHighAccuracy:true,timeout:30000,maximumAge:0});return h}
function gpsDesligar(h){if(!h)return;h.vivo=false;try{if(h.G){if(h.id)h.G.clearWatch({id:h.id})}else if(h.id!=null)navigator.geolocation.clearWatch(h.id)}catch(e){}}
function travarGPS(titulo){return new Promise(res=>{let melhor=null,ult=null,seg=0,fim=false,erro='';const t0=Date.now();const d=$('#dlgGps');
  $('#gT').textContent=titulo||'Localização';
  const pinta=()=>{const s=Math.round((Date.now()-t0)/1000);
    $('#gAcc').textContent=ult?('±'+br(ult.acc,1)+' m'):'…';
    $('#gBar').style.width=Math.max(4,Math.min(100,ult?100*GPS_ALVO/Math.max(ult.acc,GPS_ALVO):4))+'%';
    $('#gInfo').textContent=erro||(ult?`Melhor até agora: ±${br(melhor.acc,1)} m · ${s} s · trava sozinho em ±${GPS_ALVO} m (${seg}/${GPS_SEGUIDAS})`:`Procurando satélites… ${s} s`)+(s>120&&!erro?' — se não baixar disso, use a melhor leitura.':'');
    $('#gUsar').disabled=!melhor;$('#gUsar').textContent=melhor?`Usar agora (±${br(melhor.acc,1)} m)`:'Usar agora'};
  const tk=setInterval(pinta,500);let h=null;
  const acabar=v=>{if(fim)return;fim=true;clearInterval(tk);gpsDesligar(h);d.close();res(v)};
  h=gpsLigar((f,err)=>{if(!f){erro='Localização indisponível: '+((err&&err.message)||err)+'. Cole a coordenada do Google Maps no campo.';pinta();return}
    erro='';ult=f;if(!melhor||f.acc<=melhor.acc)melhor=f;
    if(f.acc<=GPS_ALVO){seg++;if(seg>=GPS_SEGUIDAS)acabar(melhor)}else seg=0;pinta()});
  $('#gUsar').onclick=()=>acabar(melhor);$('#gCanc').onclick=()=>acabar(null);d.oncancel=e=>{e.preventDefault();acabar(null)};
  d.showModal();pinta()})}
const txtFix=f=>f?`${f.lat.toFixed(6)}, ${f.lon.toFixed(6)} · ±${br(f.acc,1)} m`+(f.alt!=null?` · alt. ${br(f.alt,0)} m`:''):'';
$('#bGps').onclick=async()=>{const f=await travarGPS('Coordenada do poço');if(!f)return;const u=utm(f.lat,f.lon);
  S.meta.coord=u.txt;S.lat=+f.lat.toFixed(7);S.lon=+f.lon.toFixed(7);S.alt=f.alt!=null?Math.round(f.alt*10)/10:null;S.precisao=Math.round(f.acc*10)/10;
  $('#coord').value=u.txt;$('#nGps').textContent='Coordenada travada: '+txtFix(f);agendar()};

/* ======================= fotos guardadas no aparelho (IndexedDB) ======================= */
const IDB=(()=>{let db=null;const abrir=()=>db?Promise.resolve(db):new Promise((ok,er)=>{const r=indexedDB.open('mg-campo',1);r.onupgradeneeded=()=>r.result.createObjectStore('fotos');r.onsuccess=()=>{db=r.result;ok(db)};r.onerror=()=>er(r.error)});
  const tx=(m,f)=>abrir().then(d=>new Promise((ok,er)=>{const t=d.transaction('fotos',m);const q=f(t.objectStore('fotos'));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>er(t.error)}));
  return {put:(k,v)=>tx('readwrite',s=>s.put(v,k)),get:k=>tx('readonly',s=>s.get(k)),del:k=>tx('readwrite',s=>s.delete(k))}})();
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}

/* ======================= bússola ======================= */
let AZ=null;
function azTela(){return (screen.orientation&&screen.orientation.angle)||window.orientation||0}
window.addEventListener('deviceorientationabsolute',e=>{if(e.alpha!=null)AZ=((360-e.alpha)+azTela()+360)%360},true);
window.addEventListener('deviceorientation',e=>{if(e.webkitCompassHeading!=null)AZ=(e.webkitCompassHeading+azTela())%360},true);
const RUMOS=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
const rumo=a=>RUMOS[Math.round(a/22.5)%16];

/* ======================= carimbo ======================= */
const pad2=n=>String(n).padStart(2,'0');
const dataHora=t=>{const d=new Date(t);return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`};
function linhasCarimbo(f,az,t,ponto){const L=[dataHora(t)];
  if(f){const u=utm(f.lat,f.lon);L.push(`Lat ${br(f.lat,6)}°  Lon ${br(f.lon,6)}°`,`UTM ${u.zona}${u.banda}  E ${br(u.E,0)}  N ${br(u.N,0)}  SIRGAS 2000`,
    (f.alt!=null?`Altitude ${br(f.alt,0)} m (GPS)  ·  `:'')+`Precisão ±${br(f.acc,1)} m`)}else L.push('Sem coordenada');
  if(az!=null)L.push(`Azimute ${Math.round(az)}° ${rumo(az)}`);
  L.push([C.nome||'Campo',ponto&&ponto.nome].filter(Boolean).join('  ·  '));return L}
function carimbar(c,f,az,t,ponto){const x=c.getContext('2d');const W=c.width,H=c.height;const fs=Math.round(Math.max(W,H)/58);
  const L=linhasCarimbo(f,az,t,ponto);x.font=`600 ${fs}px Arial, sans-serif`;
  const lw=Math.max(...L.map(s=>x.measureText(s).width));const pd=fs*0.7,lh=fs*1.32;const bw=lw+pd*2+fs*0.35,bh=L.length*lh+pd*1.4;
  const bx=fs*0.8,by=H-bh-fs*0.8;x.fillStyle='rgba(0,0,0,.55)';x.fillRect(bx,by,bw,bh);x.fillStyle='#E8833A';x.fillRect(bx,by,fs*0.35,bh);
  x.fillStyle='#fff';x.textBaseline='top';L.forEach((s,i)=>{x.font=(i===0?'800 ':'600 ')+fs+'px Arial, sans-serif';x.fillText(s,bx+pd+fs*0.35,by+pd*0.7+i*lh)});
  if(az!=null){const r=fs*2.6,cx=W-r-fs*1.2,cy=r+fs*1.2;x.save();x.fillStyle='rgba(0,0,0,.5)';x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=fs*0.12;x.stroke();
    x.translate(cx,cy);x.rotate(-az*Math.PI/180);x.fillStyle='#E31A1C';x.beginPath();x.moveTo(0,-r*0.8);x.lineTo(r*0.22,0);x.lineTo(-r*0.22,0);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(0,r*0.8);x.lineTo(r*0.22,0);x.lineTo(-r*0.22,0);x.fill();
    x.rotate(0);x.font=`800 ${fs}px Arial`;x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.fillText('N',0,-r*1.18);x.restore()}}
async function paraCanvas(src,max){const bmp=src instanceof Blob?await createImageBitmap(src):src;const w=bmp.width||bmp.videoWidth,h=bmp.height||bmp.videoHeight;
  const k=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return c}
const jpg=c=>new Promise(r=>c.toBlob(r,'image/jpeg',0.9));

/* ======================= câmera com carimbo ======================= */
let CAM=null;
async function abrirCamera(pi){const d=$('#dlgCam');const ponto=C.pontos[pi];CAM={pi,fix:null,h:null,stream:null};
  $('#camN').textContent=ponto.nome;d.showModal();
  CAM.h=gpsLigar((f,err)=>{if(f&&(!CAM.fix||f.acc<=CAM.fix.acc||Date.now()-CAM.fix.t>15000))CAM.fix=f;if(f)CAM.ult=f});
  const info=()=>{if(!CAM)return;const f=CAM.ult;$('#camInfo').textContent=linhasCarimbo(f,AZ,Date.now(),ponto).slice(0,-1).join('\n');CAM.tk=requestAnimationFrame(()=>setTimeout(info,400))};info();
  try{CAM.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:4096},height:{ideal:3072}},audio:false});
    const v=$('#camV');v.srcObject=CAM.stream;await v.play()}
  catch(e){fecharCamera();$('#fCam').dataset.pi=pi;$('#fCam').click()}}
function fecharCamera(){if(!CAM)return;gpsDesligar(CAM.h);if(CAM.stream)CAM.stream.getTracks().forEach(t=>t.stop());cancelAnimationFrame(CAM.tk);CAM=null;$('#camV').srcObject=null;$('#dlgCam').close()}
$('#camX').onclick=fecharCamera;$('#dlgCam').oncancel=e=>{e.preventDefault();fecharCamera()};
$('#camF').onclick=async()=>{if(!CAM||!CAM.stream)return;const b=$('#camF');b.disabled=true;const t=Date.now(),az=AZ,f=CAM.ult||CAM.fix;
  try{let src=null;const tr=CAM.stream.getVideoTracks()[0];
    if(window.ImageCapture){try{src=await new ImageCapture(tr).takePhoto()}catch(e){src=null}}
    const c=await paraCanvas(src||$('#camV'),3264);await guardarFoto(CAM.pi,c,f,az,t,'camera');
    $('#camOk').textContent='Foto '+C.pontos[CAM.pi].fotos.length+' gravada';setTimeout(()=>$('#camOk').textContent='',1500)}
  catch(e){$('#camOk').textContent='Erro: '+(e.message||e)}b.disabled=false};
let guardarFoto;
guardarFoto=async function(pi,c,f,az,t,origem,blobOrig){const p=C.pontos[pi];let blob=blobOrig;
  if(c){carimbar(c,f,az,t,p);blob=await jpg(c)}
  const id='f'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);await IDB.put(id,blob);
  p.fotos.push({id,t,origem,az:az==null?null:Math.round(az),fix:f?{lat:f.lat,lon:f.lon,alt:f.alt,acc:f.acc}:null,leg:''});
  if(!p.fix&&f&&origem!=='galeria'){p.fix={lat:f.lat,lon:f.lon,alt:f.alt,acc:f.acc,t,daFoto:true}}
  agendarC();renderCampo()};
// câmera do sistema (quando a câmera interna não abre)
$('#fCam').onchange=async e=>{const fl=e.target.files[0];const pi=+e.target.dataset.pi;e.target.value='';if(!fl)return;
  $('#nCampo').textContent='Gravando foto…';const t=Date.now(),az=AZ;const f=await travarGPS('Coordenada da foto');
  await guardarFoto(pi,await paraCanvas(fl,3264),f,az,t,'camera do sistema');$('#nCampo').textContent=''};
// fotos já existentes (ex.: apps de bússola), gravadas como estão
document.addEventListener('change',async e=>{const el=e.target;if(el.dataset.pgal==null)return;const pi=+el.dataset.pgal;const fs=[...el.files];el.value='';
  for(const fl of fs){await guardarFoto(pi,null,null,null,fl.lastModified||Date.now(),'galeria',fl)}});

/* ======================= tela de pontos ======================= */
const URLS={};
function renderCampo(){const P=C.pontos;
  $('#pontos').innerHTML=P.length?P.map((p,i)=>`<div class="ponto">
   <div class="pc"><input class="pn" data-pn="${i}" value="${esc(p.nome)}" aria-label="Nome do ponto"><span class="note">${p.fotos.length} foto(s)</span><button class="x" data-pdel="${i}" aria-label="Excluir ponto">×</button></div>
   <label class="f">Descrição<textarea rows="3" data-pd="${i}" placeholder="O que é o ponto, observações de campo…">${esc(p.desc)}</textarea></label>
   <p class="note pco">${p.fix?('📍 '+esc(txtFix(p.fix))+(p.fix.daFoto?' (da 1ª foto)':'')):'Sem coordenada'}</p>
   <div class="row"><button class="btn" data-pgps="${i}">Pegar coordenada</button><button class="btn pri" data-pcam="${i}">📷 Foto com carimbo</button><label class="btn">Da galeria<input type="file" accept="image/*" multiple hidden data-pgal="${i}"></label></div>
   <div class="thumbs">${p.fotos.map((f,k)=>`<figure><img data-fid="${f.id}" alt="Foto ${k+1}"><input data-fl="${i}.${k}" value="${esc(f.leg)}" placeholder="legenda"><button class="x" data-fdel="${i}.${k}" aria-label="Excluir foto">×</button></figure>`).join('')}</div></div>`).join(''):'<p class="note">Nenhum ponto ainda. Toque em “Novo ponto”.</p>';
  document.querySelectorAll('img[data-fid]').forEach(async im=>{const id=im.dataset.fid;if(!URLS[id]){const b=await IDB.get(id);if(b)URLS[id]=URL.createObjectURL(b)}if(URLS[id])im.src=URLS[id]})}
$('#pNovoP').onclick=()=>{const n=C.pontos.length+1;C.pontos.push({id:'p'+Date.now().toString(36),nome:'P'+pad2(n),desc:'',fix:null,fotos:[]});agendarC();renderCampo();
  setTimeout(()=>{const l=document.querySelectorAll('.ponto');l[l.length-1].scrollIntoView({behavior:'smooth'})},50)};
document.addEventListener('input',e=>{const t=e.target;const P=C.pontos;
  if(t.dataset.pn!=null)P[+t.dataset.pn].nome=t.value;else if(t.dataset.pd!=null)P[+t.dataset.pd].desc=t.value;
  else if(t.dataset.fl!=null){const [i,k]=t.dataset.fl.split('.').map(Number);P[i].fotos[k].leg=t.value}else return;agendarC()});
document.addEventListener('click',async e=>{const t=e.target.closest('[data-pgps],[data-pcam],[data-pdel],[data-fdel]');if(!t)return;const P=C.pontos;
  if(t.dataset.pgps!=null){const i=+t.dataset.pgps;const f=await travarGPS('Coordenada de '+P[i].nome);if(f){P[i].fix={lat:f.lat,lon:f.lon,alt:f.alt,acc:f.acc,t:Date.now()};agendarC();renderCampo()}}
  else if(t.dataset.pcam!=null)abrirCamera(+t.dataset.pcam);
  else if(t.dataset.fdel!=null){const [i,k]=t.dataset.fdel.split('.').map(Number);const f=P[i].fotos[k];if(!confirm('Excluir esta foto?'))return;P[i].fotos.splice(k,1);try{await IDB.del(f.id)}catch(x){}agendarC();renderCampo()}
  else if(t.dataset.pdel!=null){const i=+t.dataset.pdel;if(!confirm(`Excluir o ponto ${P[i].nome} e as ${P[i].fotos.length} foto(s)?`))return;for(const f of P[i].fotos){try{await IDB.del(f.id)}catch(x){}}P.splice(i,1);agendarC();renderCampo()}});

/* ======================= exportar: pasta do projeto > pasta por ponto ======================= */
const limpa=s=>(String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,''))||'sem_nome';
const brn=(v,n)=>v==null?'':Number(v).toFixed(n).replace('.',',');
function txtPonto(p,nomeP){const L=[`PONTO: ${p.nome}`,`Projeto: ${C.nome||'Campo'}`,''];
  if(p.fix){const u=utm(p.fix.lat,p.fix.lon);L.push(`Latitude: ${br(p.fix.lat,6)}°`,`Longitude: ${br(p.fix.lon,6)}°`,`UTM SIRGAS 2000 fuso ${u.zona}${u.banda}: E ${br(u.E,2)} m / N ${br(u.N,2)} m`,
    `Altitude (GPS): ${p.fix.alt!=null?br(p.fix.alt,1)+' m':'não informada'}`,`Precisão horizontal: ±${br(p.fix.acc,1)} m`+(p.fix.daFoto?' (coordenada da 1ª foto)':''),`Data da coordenada: ${dataHora(p.fix.t)}`)}else L.push('Sem coordenada');
  L.push('','DESCRIÇÃO:',p.desc||'(sem descrição)','','FOTOS:');
  p.fotos.forEach((f,k)=>{L.push(`${nomeP}_foto${pad2(k+1)}.jpg — ${dataHora(f.t)}`+(f.fix?` — ${br(f.fix.lat,6)}, ${br(f.fix.lon,6)} ±${br(f.fix.acc,1)} m`+(f.fix.alt!=null?`, alt. ${br(f.fix.alt,0)} m`:''):'')+(f.az!=null?` — azimute ${f.az}° ${rumo(f.az)}`:'')+(f.origem==='galeria'?' — da galeria':'')+(f.leg?` — ${f.leg}`:''))});
  return L.join('\r\n')}
async function montarCampo(){const P=C.pontos;if(!P.length)throw new Error('Não há pontos neste projeto.');
  const raiz=limpa(C.nome||'Campo');const arqs=[];
  const csv=['ponto;descricao;latitude;longitude;utm_E;utm_N;fuso;altitude_m;precisao_m;fotos'];
  const kml=[`<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${esc(C.nome||'Campo')}</name>`];
  for(let i=0;i<P.length;i++){const p=P[i];const nomeP=pad2(i+1)+'_'+limpa(p.nome);
    arqs.push([`${raiz}/${nomeP}/descricao.txt`,new Blob(['﻿'+txtPonto(p,nomeP)],{type:'text/plain'})]);
    for(let k=0;k<p.fotos.length;k++){const b=await IDB.get(p.fotos[k].id);if(b)arqs.push([`${raiz}/${nomeP}/${nomeP}_foto${pad2(k+1)}.jpg`,b])}
    const u=p.fix?utm(p.fix.lat,p.fix.lon):null;
    csv.push([p.nome,'"'+String(p.desc||'').replace(/"/g,'""').replace(/\r?\n/g,' ')+'"',p.fix?brn(p.fix.lat,7):'',p.fix?brn(p.fix.lon,7):'',u?brn(u.E,2):'',u?brn(u.N,2):'',u?u.zona+u.banda:'',p.fix?brn(p.fix.alt,1):'',p.fix?brn(p.fix.acc,1):'',p.fotos.length].join(';'));
    if(p.fix)kml.push(`<Placemark><name>${esc(p.nome)}</name><description>${esc(p.desc||'')}</description><Point><coordinates>${p.fix.lon},${p.fix.lat},${p.fix.alt||0}</coordinates></Point></Placemark>`)}
  kml.push('</Document></kml>');
  arqs.push([`${raiz}/pontos.csv`,new Blob(['﻿'+csv.join('\r\n')],{type:'text/csv'})],[`${raiz}/pontos.kml`,new Blob([kml.join('\n')],{type:'application/vnd.google-earth.kml+xml'})]);
  return {raiz,arqs}}
const b64de=b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(String(fr.result).split(',')[1]);fr.readAsDataURL(b)});
$('#pExp').onclick=async()=>{const n=$('#nCampo');try{n.textContent='Organizando as pastas…';const {raiz,arqs}=await montarCampo();
  const z=new JSZip();arqs.forEach(([c,b])=>z.file(c,b));const zip=await z.generateAsync({type:'blob',compression:'STORE'});const nz='Campo_'+raiz+'.zip';
  if(CAP){let pasta='';try{for(const [c,b] of arqs){await CAP.Filesystem.writeFile({path:'MG_Campo/'+c,data:await b64de(b),directory:'DOCUMENTS',recursive:true})}pasta=`Pastas gravadas em Documentos/MG_Campo/${raiz}. `}catch(e){pasta=''}
    n.textContent=pasta+'Preparando o .zip…';const w=await CAP.Filesystem.writeFile({path:nz,data:await b64de(zip),directory:'CACHE'});
    await CAP.Share.share({title:nz,url:w.uri,dialogTitle:'Salvar ou enviar as fotos de campo'});n.textContent=pasta+nz+' pronto ('+(zip.size/1048576).toFixed(1)+' MB).'}
  else{const a=document.createElement('a');a.href=URL.createObjectURL(zip);a.download=nz;a.click();n.textContent=nz+' baixado.'}}
  catch(e){n.textContent='Não foi possível exportar: '+(e&&e.message||e)}};

/* ======================= projetos de campo (separados dos poços) ======================= */
const LSC='mg-campo-proj';
const novoC=()=>({id:'c'+Date.now().toString(36),criado:Date.now(),nome:'',pontos:[]});
function lcGet(){try{return JSON.parse(localStorage.getItem(LSC)||'{}')}catch(e){return {}}}
function lcSet(o){try{localStorage.setItem(LSC,JSON.stringify(o))}catch(e){status('sem espaço para salvar')}}
let timerC=null;
function agendarC(){status('alterado');clearTimeout(timerC);timerC=setTimeout(salvarC,800)}
function salvarC(){C.alterado=Date.now();const a=lcGet();a[C.id]=C;a.__ultimo=C.id;lcSet(a);status('salvo')}
function abrirC(o){C=Object.assign(novoC(),o);$('#cNome').value=C.nome||'';renderCampo()}
$('#cNome').addEventListener('input',e=>{C.nome=e.target.value;agendarC()});
$('#cSalvar').onclick=()=>{salvarC();const b=$('#cSalvar');b.textContent='Salvo ✓';setTimeout(()=>b.textContent='Salvar',1500)};
$('#cAbrir').onclick=()=>{const a=lcGet();const L=Object.keys(a).filter(k=>k!=='__ultimo').map(k=>a[k]).sort((p,q)=>(q.alterado||0)-(p.alterado||0));
  $('#dlgN').textContent='Levantamentos de campo salvos neste aparelho.';
  $('#lst').innerHTML=L.length?L.map(t=>`<li><span>${esc(t.nome||'Sem nome')}<br><small class="note">${t.pontos.length} ponto(s) · ${esc(new Date(t.alterado||t.criado).toLocaleString('pt-BR'))}</small></span><button class="btn" data-cab="${esc(t.id)}">Abrir</button><button class="x" data-cdel="${esc(t.id)}" aria-label="Excluir">×</button></li>`).join(''):'<li><span class="note">Nenhum levantamento salvo.</span></li>';
  $('#lst').onclick=async e=>{const ab=e.target.dataset.cab,de=e.target.dataset.cdel;
    if(ab){salvarC();abrirC(L.find(x=>x.id===ab));$('#dlg').close();status('aberto: '+(C.nome||'sem nome'))}
    if(de){const t=L.find(x=>x.id===de);$('#cTxt').textContent=`Excluir "${t.nome||'Sem nome'}" e todas as fotos dele?`;$('#cSim').textContent='Excluir';$('#dlgC').showModal();
      $('#cSim').onclick=async()=>{for(const p of t.pontos)for(const f of p.fotos){try{await IDB.del(f.id)}catch(x){}}const a2=lcGet();delete a2[de];lcSet(a2);if(C.id===de)abrirC(novoC());$('#dlgC').close();$('#cAbrir').onclick()}}};
  $('#dlg').showModal()};
$('#cNovo').onclick=()=>{salvarC();abrirC(novoC());status('levantamento novo');$('#cNome').focus()};
let C=novoC();
(()=>{const a=lcGet();if(a.__ultimo&&a[a.__ultimo])C=Object.assign(novoC(),a[a.__ultimo]);$('#cNome').value=C.nome||''})();

/* ======================= modo Poço / Campo ======================= */
function modo(m){document.body.dataset.modo=m;try{localStorage.setItem('mg-modo',m)}catch(e){}
  document.querySelectorAll('[data-modo]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.modo===m));
  if(m==='campo'){document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='campo'));renderCampo()}
  else{(document.querySelector('nav.tabs button[aria-selected=true]')||document.querySelector('nav.tabs button[data-p=dados]')).click()}
  window.scrollTo(0,0)}
document.querySelectorAll('[data-modo]').forEach(b=>b.onclick=()=>modo(b.dataset.modo));
