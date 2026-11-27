/* ======================= medidas estruturais (estilo bússola de geólogo) =======================
   Plano: encoste o verso do celular no plano. Linha: encoste a borda comprida (topo do celular apontando o sentido do mergulho).
   Trava sozinha quando o celular fica parado; também trava com toque em qualquer lugar da tela ou pelo temporizador. */
const FEICOES={plano:['Acamamento','Fratura / junta','Falha','Foliação','Contato','Veio / dique','Derrame (topo/base)','Outro plano'],linha:['Lineação','Estria de falha','Eixo de dobra','Outra linha']};
const EST_TOL=0.6, EST_JANELA=1200;   // trava sozinho: variação < 0,6° durante 1,2 s
const rad=g=>g*Math.PI/180,deg=r=>r*180/Math.PI,norm360=a=>((a%360)+360)%360;
const p3=v=>String(Math.round(v)).padStart(3,'0'),p2=v=>String(Math.round(v)).padStart(2,'0');
function matrizR(a,b,g){a=rad(a||0);b=rad(b||0);g=rad(g||0);const cA=Math.cos(a),sA=Math.sin(a),cB=Math.cos(b),sB=Math.sin(b),cG=Math.cos(g),sG=Math.sin(g);
  return [[cA*cG-sA*sB*sG,-cB*sA,cG*sA*sB+cA*sG],[cG*sA+cA*sB*sG,cA*cB,sA*sG-cA*cG*sB],[-cB*sG,sB,cB*cG]]}   // colunas = eixos do aparelho em (L, N, cima)
const col=(R,j)=>[R[0][j],R[1][j],R[2][j]];
function plano(n){if(n[2]<0)n=n.map(v=>-v);const dip=deg(Math.acos(Math.min(1,n[2])));const dd=norm360(deg(Math.atan2(n[0],n[1])));return {dd,dip}}
function linha(v){if(v[2]>0)v=v.map(x=>-x);const pl=deg(Math.asin(Math.min(1,-v[2])));const tr=norm360(deg(Math.atan2(v[0],v[1])));return {tr,pl}}
let EST=null,ORI=null;
window.addEventListener('deviceorientationabsolute',e=>{if(e.alpha==null)return;ORI={a:e.alpha,b:e.beta,g:e.gamma,t:performance.now()};if(EST&&!EST.trav)estTique()},true);
function decl(){return num(C.decl)||0}
function leitura(){if(!ORI)return null;const R=matrizR(ORI.a,ORI.b,ORI.g);
  if(EST.tipo==='plano'){const n=col(R,2);return {v:n,...plano(n)}}const y=col(R,1);return {v:y,...linha(y)}}
function estTique(){const L=leitura();if(!L)return;const agora=performance.now();EST.buf.push({t:agora,v:L.v});EST.buf=EST.buf.filter(x=>agora-x.t<=EST_JANELA);
  // média vetorial e dispersão angular da janela
  let m=[0,0,0];EST.buf.forEach(x=>{const s=(EST.tipo==='plano'?(x.v[2]<0?-1:1):(x.v[2]>0?-1:1));m=m.map((c,i)=>c+s*x.v[i])});const nm=Math.hypot(...m);m=m.map(c=>c/nm);
  let disp=0;EST.buf.forEach(x=>{const s=(EST.tipo==='plano'?(x.v[2]<0?-1:1):(x.v[2]>0?-1:1));const d=Math.abs(m[0]*x.v[0]*s+m[1]*x.v[1]*s+m[2]*x.v[2]*s);disp=Math.max(disp,deg(Math.acos(Math.min(1,d))))});
  EST.media=EST.tipo==='plano'?plano(m):linha(m);EST.disp=disp;
  const cheio=EST.buf.length>5&&agora-EST.buf[0].t>EST_JANELA*0.9;
  mostrarEst(L,cheio);
  if(EST.auto&&cheio&&disp<EST_TOL)travarEst()}
function fmtMed(o,tipo,d){const dc=d||0;if(tipo==='plano'){const dd=norm360(o.dd+dc);return `${p3(dd)}/${p2(o.dip)}`}return `${p3(norm360(o.tr+dc))}→${p2(o.pl)}`}
function mostrarEst(L,cheio){const o=EST.media||L;const d=decl();
  $('#eVal').textContent=fmtMed(o,EST.tipo,d);
  $('#eSub').textContent=EST.tipo==='plano'?`direção do mergulho / mergulho · strike ${p3(norm360(o.dd+d-90))}`:'sentido / caimento';
  const est=Math.max(0,Math.min(100,100*(1-(EST.disp||9)/6)));$('#eBar').style.width=(cheio?est:10)+'%';
  $('#eEst').textContent=cheio?(EST.disp<EST_TOL?'parado — travando…':`segure firme (variação ${br(EST.disp,1)}°)`):'lendo…'}
function travarEst(){if(!EST||EST.trav||!EST.media)return;EST.trav={...EST.media,disp:EST.disp,t:Date.now(),fix:CAMP_FIX};
  try{navigator.vibrate&&navigator.vibrate([60,40,60])}catch(e){}try{bip()}catch(e){}
  $('#dlgEst').classList.add('trav');$('#eEst').textContent=`travado · dispersão ${br(EST.trav.disp,1)}°`;$('#eObs').value='';$('#eObs').focus({preventScroll:true})}
let CAMP_FIX=null,CAMP_H=null;
function abrirEst(pi){const d=$('#dlgEst');EST={pi,tipo:'plano',auto:$('#eAuto')?$('#eAuto').checked:true,buf:[],media:null,trav:null};
  $('#eTipo').value='plano';selFeicao();$('#eNome').textContent=C.pontos[pi].nome;d.classList.remove('trav');$('#eVal').textContent='---/--';
  if(typeof DeviceOrientationEvent!=='undefined'&&DeviceOrientationEvent.requestPermission){DeviceOrientationEvent.requestPermission().catch(()=>{})}
  CAMP_FIX=null;CAMP_H=gpsLigar(f=>{if(f&&(!CAMP_FIX||f.acc<=CAMP_FIX.acc))CAMP_FIX=f});
  setTimeout(()=>{if(!ORI)$('#eEst').textContent='Este aparelho não envia a orientação (bússola/acelerômetro).'},2500);
  d.showModal()}
function fecharEst(){gpsDesligar(CAMP_H);CAMP_H=null;EST=null;$('#dlgEst').close()}
function selFeicao(){const t=$('#eTipo').value;$('#eFei').innerHTML=FEICOES[t].map(f=>`<option>${f}</option>`).join('');$('#eDica').textContent=t==='plano'?'Encoste o verso do celular no plano (tela para fora).':'Encoste a borda comprida na linha, com o topo do celular apontando para onde ela mergulha.'}
$('#eTipo').onchange=()=>{selFeicao();if(EST){EST.tipo=$('#eTipo').value;EST.buf=[];EST.media=null;EST.trav=null;$('#dlgEst').classList.remove('trav')}};
$('#eAuto').onchange=e=>{if(EST)EST.auto=e.target.checked};
$('#eToque').onclick=()=>{if(EST&&!EST.trav)travarEst()};
$('#eTimer').onclick=()=>{if(!EST)return;let n=3;$('#eEst').textContent='trava em 3…';const tk=setInterval(()=>{n--;if(!EST){clearInterval(tk);return}if(n>0)$('#eEst').textContent='trava em '+n+'…';else{clearInterval(tk);travarEst()}},1000)};
$('#eDeNovo').onclick=()=>{if(!EST)return;EST.trav=null;EST.buf=[];$('#dlgEst').classList.remove('trav')};
$('#eSalvar').onclick=()=>{if(!EST||!EST.trav)return;const t=EST.trav,d=decl();const p=C.pontos[EST.pi];p.medidas=p.medidas||[];
  const m={id:'m'+Date.now().toString(36),tipo:EST.tipo,feicao:$('#eFei').value,decl:d,t:t.t,disp:Math.round(t.disp*10)/10,obs:$('#eObs').value.trim(),fix:t.fix?{lat:t.fix.lat,lon:t.fix.lon,alt:t.fix.alt,acc:t.fix.acc}:null};
  if(EST.tipo==='plano'){m.dd=Math.round(norm360(t.dd+d));m.dip=Math.round(t.dip);m.strike=Math.round(norm360(m.dd-90))}else{m.tr=Math.round(norm360(t.tr+d));m.pl=Math.round(t.pl)}
  p.medidas.push(m);agendarC();renderCampo();EST.trav=null;EST.buf=[];$('#dlgEst').classList.remove('trav');$('#eEst').textContent=`gravada (${p.medidas.length}) — pode medir a próxima`};
$('#eFechar').onclick=fecharEst;$('#dlgEst').oncancel=e=>{e.preventDefault();fecharEst()};
// lançar à mão (leitura de bússola tipo Brunton/Clar)
$('#eManual').onclick=()=>{if(!EST)return;const t=$('#eTipo').value;const s=prompt(t==='plano'?'Direção do mergulho/mergulho (ex.: 135/42):':'Sentido→caimento (ex.: 210/15):');if(!s)return;const m=s.match(/(\d+(?:[.,]\d+)?)\D+(\d+(?:[.,]\d+)?)/);if(!m)return;
  const a=num(m[1]),b=num(m[2]);if(a==null||b==null||b>90)return alert('Valor inválido.');EST.trav=t==='plano'?{dd:norm360(a-decl()),dip:b,disp:0,t:Date.now(),fix:CAMP_FIX,manual:true}:{tr:norm360(a-decl()),pl:b,disp:0,t:Date.now(),fix:CAMP_FIX,manual:true};
  EST.media=EST.trav;$('#eVal').textContent=fmtMed(EST.trav,t,decl());$('#dlgEst').classList.add('trav');$('#eEst').textContent='lançada à mão'};
$('#cDecl').addEventListener('input',e=>{C.decl=e.target.value;agendarC();desenharEstereo($('#cEst'))});

/* ======================= estereograma (Schmidt, hemisfério inferior) ======================= */
const COR_FEI={'Acamamento':'#2E6DB0','Fratura / junta':'#C0392B','Falha':'#7B1FA2','Foliação':'#2E7D32','Contato':'#E8833A','Veio / dique':'#795548','Derrame (topo/base)':'#00838F','Outro plano':'#555','Lineação':'#111','Estria de falha':'#7B1FA2','Eixo de dobra':'#2E7D32','Outra linha':'#555'};
function medidasTodas(){return C.pontos.flatMap(p=>(p.medidas||[]).map(m=>({...m,ponto:p.nome})))}
function desenharEstereo(c,lista){if(!c)return;const x=c.getContext('2d'),W=c.width,R=W*0.42,cx=W/2,cy=W/2;const L=lista||medidasTodas();
  x.fillStyle='#fff';x.fillRect(0,0,W,c.height);x.strokeStyle='#222';x.lineWidth=W/300;x.beginPath();x.arc(cx,cy,R,0,7);x.stroke();
  x.strokeStyle='#ccc';x.lineWidth=W/700;x.beginPath();x.moveTo(cx-R,cy);x.lineTo(cx+R,cy);x.moveTo(cx,cy-R);x.lineTo(cx,cy+R);x.stroke();
  x.fillStyle='#222';x.font=`bold ${W/22}px Arial`;x.textAlign='center';x.fillText('N',cx,cy-R-W/40);
  const P=(tr,pl)=>{const r=R*Math.SQRT2*Math.sin(rad(90-pl)/2);return [cx+r*Math.sin(rad(tr)),cy-r*Math.cos(rad(tr))]};
  L.forEach(m=>{const cor=COR_FEI[m.feicao]||'#333';x.strokeStyle=cor;x.fillStyle=cor;
    if(m.tipo==='plano'){const dd=rad(m.dd),dp=rad(m.dip);const s=[Math.sin(dd-Math.PI/2),Math.cos(dd-Math.PI/2),0],dv=[Math.sin(dd)*Math.cos(dp),Math.cos(dd)*Math.cos(dp),-Math.sin(dp)];
      x.lineWidth=W/350;x.beginPath();for(let i=0;i<=90;i++){const a=rad(i*2);const v=[s[0]*Math.cos(a)+dv[0]*Math.sin(a),s[1]*Math.cos(a)+dv[1]*Math.sin(a),s[2]*Math.cos(a)+dv[2]*Math.sin(a)];const o=linha(v);const [px,py]=P(o.tr,o.pl);i?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();
      const [px,py]=P(norm360(m.dd+180),90-m.dip);x.beginPath();x.arc(px,py,W/90,0,7);x.fill()}
    else{const [px,py]=P(m.tr,m.pl);x.beginPath();x.moveTo(px,py-W/60);x.lineTo(px+W/70,py+W/110);x.lineTo(px-W/70,py+W/110);x.closePath();x.fill()}});
  const fe=[...new Set(L.map(m=>m.feicao))];x.textAlign='left';x.font=`${W/34}px Arial`;fe.forEach((f,i)=>{x.fillStyle=COR_FEI[f]||'#333';x.fillRect(W*0.03,c.height-W*0.04*(fe.length-i)-W*0.02,W*0.025,W*0.025);x.fillStyle='#222';x.fillText(f,W*0.07,c.height-W*0.04*(fe.length-i)-W*0.0)});
  x.fillStyle="#666";x.textAlign="right";x.fillText(`${L.length} medida(s) · Schmidt, hemisfério inferior`,W*0.97,c.height-W*0.02)}
