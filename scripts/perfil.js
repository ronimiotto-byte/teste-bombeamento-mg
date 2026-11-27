/* ======================= perfil geológico-construtivo ======================= */
const LITOS={'Solo':'#EAA884','Solo e rocha alterada':'#EAA884','Rocha alterada':'#D9A27A','Basalto são':'#77767B','Basalto fraturado':'#8E8D93',
  'Basalto vesicular / amigdaloidal':'#9A8FA0','Riolito / riodacito':'#B9879A','Arenito':'#F2D58A','Arenito intertrape':'#E9C46A','Siltito / argilito':'#B7A58C',
  'Folhelho':'#8C8C6E','Argila':'#C9A27E','Areia':'#F5E3A3','Cascalho':'#D8C08A','Granito / gnaisse':'#E3A8A8','Outro':'#CCCCCC'};
const TAB_PF={
  lito:[['de','De (m)','n'],['ate','Até (m)','n'],['tipo','Litologia','s',Object.keys(LITOS)],['desc','Descrição (vai no perfil)','t']],
  perf:[['de','De (m)','n'],['ate','Até (m)','n'],['diam','Ø (pol)','n']],
  rev:[['de','De (m)','n'],['ate','Até (m)','n'],['diam','Ø (pol)','n'],['tipo','Tipo','s',['Tubo liso','Filtro']],['mat','Material','t']],
  ved:[['de','De (m)','n'],['ate','Até (m)','n'],['item','Item','s',['Cimentação','Pré-filtro','Selo de bentonita']],['obs','Observação','t']],
  ent:[['prof','Prof. (m)','n'],['obs','Entrada d’água (vazão / obs.)','t']]};
const novoPerfil=()=>({cota:'',boca:'',metodo:'',data:'',tampa:'',laje:'',cerca:'',lito:[],perf:[],rev:[],ved:[],ent:[]});
function renderPerfil(){S.perfil=Object.assign(novoPerfil(),S.perfil||{});const pf=S.perfil;
  document.querySelectorAll('[data-pf]').forEach(i=>i.value=pf[i.dataset.pf]||'');
  for(const [t,cols] of Object.entries(TAB_PF)){const el=$('#t_'+t);if(!el)continue;
    el.innerHTML=`<thead><tr>${cols.map(c=>`<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>`+pf[t].map((r,i)=>`<tr>${cols.map(([k,,tp,op])=>`<td>${tp==='s'?`<select data-pt="${t}" data-pi="${i}" data-pk="${k}">${op.map(o=>`<option${r[k]===o?' selected':''}>${esc(o)}</option>`).join('')}</select>`:`<input data-pt="${t}" data-pi="${i}" data-pk="${k}" ${tp==='n'?'inputmode="decimal"':''} value="${esc(r[k])}">`}</td>`).join('')}<td><button class="x" data-ptx="${t}.${i}" aria-label="Remover">×</button></td></tr>`).join('')+'</tbody>'}
  desenharPerfil($('#gP'))}
document.addEventListener('input',e=>{const t=e.target;if(!S.perfil)return;
  if(t.dataset.pf){S.perfil[t.dataset.pf]=t.value}else if(t.dataset.pt){S.perfil[t.dataset.pt][+t.dataset.pi][t.dataset.pk]=t.value}else return;
  clearTimeout(window.__pfT);window.__pfT=setTimeout(()=>desenharPerfil($('#gP')),250);agendar()});
document.addEventListener('change',e=>{const t=e.target;if(t.tagName==='SELECT'&&t.dataset.pt){S.perfil[t.dataset.pt][+t.dataset.pi][t.dataset.pk]=t.value;desenharPerfil($('#gP'));agendar()}});
document.addEventListener('click',e=>{const t=e.target;
  if(t.dataset.ptadd){const k=t.dataset.ptadd,L=S.perfil[k];const ult=L[L.length-1];const r={};TAB_PF[k].forEach(([c,,tp,op])=>r[c]=tp==='s'?op[0]:'');
    if('de' in r&&ult&&ult.ate)r.de=ult.ate;if(k==='perf'&&!L.length)r.de='0';if(k==='lito'&&!L.length)r.de='0';L.push(r);renderPerfil();agendar()}
  else if(t.dataset.ptx){const [k,i]=t.dataset.ptx.split('.');S.perfil[k].splice(+i,1);renderPerfil();agendar()}});

function desenharPerfil(c){if(!c)return;const x=c.getContext('2d');const W=c.width,H=c.height;x.fillStyle='#fff';x.fillRect(0,0,W,H);
  const pf=S.perfil||novoPerfil();const N=v=>num(v);
  const iv=L=>L.filter(r=>N(r.de)!=null&&N(r.ate)!=null&&N(r.ate)>N(r.de));
  const lito=iv(pf.lito),perf=iv(pf.perf).filter(r=>N(r.diam)>0),rev=iv(pf.rev).filter(r=>N(r.diam)>0),ved=iv(pf.ved);
  const prof=Math.max(N(S.meta.prof)||0,...lito.map(r=>N(r.ate)),...perf.map(r=>N(r.ate)),...rev.map(r=>N(r.ate)),0);
  const F='"Source Sans 3", Calibri, Arial, sans-serif';
  if(!prof){x.fillStyle='#888';x.font=`28px ${F}`;x.textAlign='center';x.fillText('Preencha a profundidade e os intervalos para ver o perfil',W/2,H/2);return}
  const y0=95,y1=H-75,Y=d=>y0+(d/prof)*(y1-y0),cx=409,PI=22.4,fx0=215,fx1=613,cl0=633,cl1=776;
  const mis=(h,k)=>{const n=parseInt(h.slice(1),16);const r=n>>16,g=(n>>8)&255,b=n&255;return `rgb(${Math.round(r+(255-r)*k)},${Math.round(g+(255-g)*k)},${Math.round(b+(255-b)*k)})`};
  // formação (tom claro) e coluna de litologia
  if(!lito.length){x.fillStyle='#E6E6E6';x.fillRect(fx0,y0,fx1-fx0,y1-y0)}
  lito.forEach(l=>{const cor=LITOS[l.tipo]||'#CCC';x.fillStyle=mis(cor,0.45);x.fillRect(fx0,Y(N(l.de)),fx1-fx0,Y(N(l.ate))-Y(N(l.de)));
    x.fillStyle=cor;x.fillRect(cl0,Y(N(l.de)),cl1-cl0,Y(N(l.ate))-Y(N(l.de)));x.strokeStyle='#222';x.lineWidth=2;x.strokeRect(cl0,Y(N(l.de)),cl1-cl0,Y(N(l.ate))-Y(N(l.de)))});
  // escala
  x.strokeStyle='#222';x.fillStyle='#222';x.lineWidth=2;x.beginPath();x.moveTo(190,y0);x.lineTo(190,y1);x.stroke();
  const passo=[1,2,5,10,20,25,50,100].find(p=>prof/p<=18)||100;x.font=`20px ${F}`;x.textAlign='right';x.textBaseline='middle';
  for(let d=0;d<=prof+1e-6;d+=passo){x.beginPath();x.moveTo(158,Y(d));x.lineTo(190,Y(d));x.stroke();x.fillText(String(d),150,Y(d))}
  x.textAlign='center';x.fillText('m',140,y0-24);x.beginPath();x.moveTo(195,y0);x.lineTo(fx1,y0);x.stroke();
  // diâmetro do furo e do revestimento em cada profundidade
  const naProf=(L,d)=>L.find(r=>d>=N(r.de)&&d<N(r.ate));
  const hwF=d=>{const p=naProf(perf,d);return p?N(p.diam)*PI/2:0},hwR=d=>{const r=naProf(rev,d);return r?N(r.diam)*PI/2:0};
  // furo
  perf.forEach(p=>{const hw=N(p.diam)*PI/2;x.fillStyle='#fff';x.fillRect(cx-hw,Y(N(p.de)),2*hw,Y(N(p.ate))-Y(N(p.de)))});
  // água abaixo do N.E.
  const NE=N(S.ne);
  if(NE!=null&&NE<prof){const n=400;for(let i=0;i<n;i++){const d0=prof*i/n,d1=prof*(i+1)/n;if(d1<=NE)continue;const dm=(Math.max(d0,NE)+d1)/2;let hw=hwR(dm)||hwF(dm);if(!hw)continue;if(hwR(dm))hw-=3;
    x.fillStyle='#BFE4F4';x.fillRect(cx-hw,Y(Math.max(d0,NE)),2*hw,Y(d1)-Y(Math.max(d0,NE))+0.6)}}
  // vedação (hachura no espaço anelar)
  ved.forEach(v=>{const a=N(v.de),b=N(v.ate),dm=(a+b)/2,hf=hwF(dm),hr=hwR(dm)||hf*0.6;if(!hf)return;
    [[cx-hf,cx-hr],[cx+hr,cx+hf]].forEach(([u0,u1])=>{x.save();x.beginPath();x.rect(u0,Y(a),u1-u0,Y(b)-Y(a));x.clip();x.fillStyle=v.item==='Pré-filtro'?'#E9D9A6':'#B9B9B9';x.fill();
      x.strokeStyle='#555';x.lineWidth=2.5;if(v.item==='Pré-filtro'){for(let yy=Y(a)+6;yy<Y(b);yy+=12)for(let xx=u0+4;xx<u1;xx+=12){x.beginPath();x.arc(xx+(yy%24?6:0),yy,2.6,0,7);x.stroke()}}
      else for(let k=-(Y(b)-Y(a));k<u1-u0;k+=14){x.beginPath();x.moveTo(u0+k,Y(b));x.lineTo(u0+k+(Y(b)-Y(a)),Y(a));x.stroke()}
      x.restore();x.strokeStyle='#222';x.lineWidth=1.5;x.strokeRect(u0,Y(a),u1-u0,Y(b)-Y(a))})});
  // contorno do furo
  x.strokeStyle='#222';x.lineWidth=2;perf.forEach(p=>{const hw=N(p.diam)*PI/2,a=Y(N(p.de)),b=Y(N(p.ate));x.beginPath();x.moveTo(cx-hw,a);x.lineTo(cx-hw,b);x.lineTo(cx+hw,b);x.lineTo(cx+hw,a);x.stroke()});
  // revestimento e filtros
  rev.forEach(r=>{const hw=N(r.diam)*PI/2;x.strokeStyle='#1a1a1a';x.lineWidth=6;x.setLineDash(r.tipo==='Filtro'?[10,8]:[]);
    [cx-hw,cx+hw].forEach(xx=>{x.beginPath();x.moveTo(xx,Y(N(r.de)));x.lineTo(xx,Y(N(r.ate)));x.stroke()});x.setLineDash([])});
  // boca, laje e tampa
  const hmax=Math.max(...perf.map(p=>N(p.diam)*PI/2),60);const boca=N(pf.boca);const yb=y0-(boca>0?Math.max(8,Math.min(30,boca*20)):0);
  x.fillStyle='#C8C8C8';x.strokeStyle='#222';x.lineWidth=2;x.fillRect(cx-hmax-50,y0-7,2*hmax+100,7);x.strokeRect(cx-hmax-50,y0-7,2*hmax+100,7);
  if(boca>0&&rev.length){const hw=N(rev[0].diam)*PI/2;x.lineWidth=6;[cx-hw,cx+hw].forEach(xx=>{x.beginPath();x.moveTo(xx,y0);x.lineTo(xx,yb);x.stroke()})}
  // edutor e bomba
  const crivo=N(S.meta.crivo);x.strokeStyle='#333';x.lineWidth=3;x.beginPath();x.moveTo(cx,y0-20);x.lineTo(cx,crivo!=null?Y(crivo)-15:y0);x.stroke();
  const rot=(txt,yy,x0,cor)=>{x.font=`22px ${F}`;x.textAlign='left';x.textBaseline='middle';const w=x.measureText(txt).width;x.fillStyle='#fff';x.fillRect(x0-3,yy-14,w+6,28);x.fillStyle=cor||'#222';x.fillText(txt,x0,yy)};
  if(crivo!=null&&crivo<=prof){x.fillStyle='#D8232A';x.fillRect(cx-18,Y(crivo)-15,36,30);x.strokeStyle='#222';x.lineWidth=1.5;x.strokeRect(cx-18,Y(crivo)-15,36,30);
    x.beginPath();x.moveTo(cx+26,Y(crivo));x.lineTo(560,Y(crivo));x.stroke();rot(`Bomba / crivo ${br(crivo)} m`,Y(crivo),567)}
  // N.E. e N.D.
  const ND=(typeof RES!=='undefined'&&RES&&RES.ok)?RES.ND:null;
  [[NE,'N.E.'],[ND,'N.D.']].forEach(([v,t])=>{if(v==null||v>prof)return;const yy=Y(v),hw=hwR(v)||hwF(v)||60;x.strokeStyle='#1F9BD7';x.lineWidth=2.5;x.setLineDash([9,6]);x.beginPath();x.moveTo(225,yy);x.lineTo(cx-hw+2,yy);x.stroke();x.setLineDash([]);
    x.fillStyle='#1F9BD7';x.beginPath();x.moveTo(258,yy-22);x.lineTo(294,yy-22);x.lineTo(276,yy);x.closePath();x.fill();rot(`${t} ${br(v)} m`,yy-38,222,'#1F9BD7')});
  // diâmetros
  let ultY=-99;perf.forEach(p=>{const hw=N(p.diam)*PI/2;const yy=Math.max(Y(N(p.de))+Math.min(80,(Y(N(p.ate))-Y(N(p.de)))/2),ultY+34);ultY=yy;x.strokeStyle='#222';x.lineWidth=1.5;x.beginPath();x.moveTo(cx+hw+6,yy);x.lineTo(560,yy);x.stroke();rot(`Ø ${br(N(p.diam),N(p.diam)%1?1:0)}"`,yy,567)});
  // entradas d'água
  (pf.ent||[]).filter(e=>N(e.prof)!=null&&N(e.prof)<=prof).forEach(e=>{const yy=Y(N(e.prof)),hw=hwF(N(e.prof))||60;x.fillStyle='#1F9BD7';x.beginPath();x.moveTo(cx+hw+26,yy-9);x.lineTo(cx+hw+4,yy);x.lineTo(cx+hw+26,yy+9);x.fill();rot(`Entrada d’água ${br(N(e.prof))} m`+(e.obs?` – ${e.obs}`:''),yy,cx+hw+34,'#1F9BD7')});
  // títulos e descrição da litologia
  x.fillStyle='#333';x.font=`20px ${F}`;x.textAlign='center';x.textBaseline='alphabetic';
  const cota=N(pf.cota);x.fillText(cota!=null?`Cota ${br(cota,0)} m`:'Boca do poço',cx,60);x.fillText('Litologia',(cl0+cl1)/2,60);
  let uy=-99;x.font=`24px ${F}`;x.textAlign='left';x.textBaseline='middle';x.fillStyle='#222';
  lito.forEach(l=>{const yy=Math.max((Y(N(l.de))+Math.min(Y(N(l.ate)),Y(N(l.de))+130))/2,uy+34);uy=yy;
    const t=`${br(N(l.de))} a ${br(N(l.ate))} m – ${l.desc||l.tipo}`;const pal=t.split(' ');let lin='',k=0;
    for(const p of pal){if(x.measureText(lin+p).width>W-815&&lin){x.fillText(lin.trim(),805,yy+k*28);k++;lin=''}lin+=p+' '}x.fillText(lin.trim(),805,yy+k*28);uy+=k*28})}
async function perfilPng(){const c=document.createElement('canvas');c.width=1472;c.height=1818;desenharPerfil(c);return await new Promise(r=>c.toBlob(r,'image/png'))}
