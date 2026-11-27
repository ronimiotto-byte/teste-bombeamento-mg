/* ======================= perfil geológico-construtivo (só dados; o desenho é feito no computador) ======================= */
const LITOS=['Solo','Solo e rocha alterada','Rocha alterada (saprólito)','Basalto são','Basalto fraturado','Basalto vesicular / amigdaloidal','Brecha basáltica',
  'Riolito / riodacito','Arenito','Arenito intertrape','Siltito / argilito','Folhelho','Argila','Areia','Cascalho','Granito / gnaisse','Outro'];
const MATS=['PVC geomecânico','PVC aditivado','Aço carbono','Aço galvanizado','Aço inox','PEAD','Outro'];
const TAB_PF={
  lito:[['de','De (m)','n'],['ate','Até (m)','n'],['tipo','Litologia','s',LITOS],['desc','Descrição','t']],
  perf:[['de','De (m)','n'],['ate','Até (m)','n'],['diam','Ø furo (pol)','n'],['metodo','Método','s',['Rotopneumático','Rotativo (lama)','Percussão','Outro']]],
  rev:[['de','De (m)','n'],['ate','Até (m)','n'],['diam','Ø (pol)','n'],['tipo','Tipo','s',['Tubo liso','Filtro','Encamisamento','Tubo de boca']],['mat','Material','s',MATS],['obs','Ranhura / espessura','t']],
  anel:[['de','De (m)','n'],['ate','Até (m)','n'],['tipo','Espaço anelar','s',['Selo sanitário (cimentação)','Pré-filtro','Selo de bentonita','Material da perfuração','Cimentação']],['obs','Material / granulometria','t']],
  ent:[['prof','Prof. (m)','n'],['vazao','Vazão (m³/h)','n'],['obs','Observação (fratura, contato…)','t']]};
const CAMPOS_PF=[
  ['Geral',[['cota','Cota do terreno (m)','n'],['dataIni','Início da perfuração','d'],['dataFim','Fim da perfuração','d'],['perfuradora','Empresa perfuradora','t']]],
  ['Saliência (boca acima do terreno)',[['salAlt','Altura da saliência (m)','n'],['salMat','A saliência é de','s',['Tubo de revestimento','Tubo de boca (aço)','Tubo de boca (PVC)','Caixa de proteção','Outro']],['salDiam','Ø da saliência (pol)','n'],['tampa','Tampa','s',['Tampa de aço rosqueada','Chapa de aço soldada','Tampa de PVC','Cabeçote com flange','Outro']]]],
  ['Laje de proteção',[['lajeLarg','Largura (m)','n'],['lajeComp','Comprimento (m)','n'],['lajeEsp','Espessura (m)','n'],['lajeMat','Material','s',['Concreto','Concreto armado','Outro']],['lajeObs','Observação (declividade, etc.)','t']]],
  ['Tubo edutor',[['edDiam','Ø (pol)','n'],['edMat','Material','s',['PVC roscável','PEAD','Aço galvanizado','Mangueira','Outro']],['edProf','Profundidade (m)','n']]],
  ['Bomba',[['bombaTipo','Tipo','s',['Submersa','Injetora','Compressor (ar)','Outra']],['bombaProf','Profundidade do crivo (m)','n'],['valvula','Válvula de retenção','s',['Sim','Não']]]],
  ['Tubo de inspeção / medição de nível',[['inspDiam','Ø (pol)','n'],['inspMat','Material','s',['PVC','PEAD','Aço galvanizado','Outro']],['inspProf','Profundidade (m)','n']]],
  ['Dispositivos e proteção',[['hidrometro','Hidrômetro','s',['Sim','Não']],['torneira','Torneira para coleta','s',['Sim','Não']],['horimetro','Horímetro','s',['Sim','Não']],['registro','Registro','s',['Sim','Não']],['cerca','Cerca de proteção','t'],['obsGeral','Outras observações','t']]]];
const novoPerfil=()=>Object.assign({lito:[],perf:[],rev:[],anel:[],ent:[]},Object.fromEntries(CAMPOS_PF.flatMap(([,c])=>c.map(([k])=>[k,'']))));
(function montarPerfil(){const el=$('#pfCampos');if(!el)return;
  el.innerHTML=CAMPOS_PF.map(([tit,cs])=>`<h3 class="sub">${tit}</h3><div class="grid">${cs.map(([k,l,tp,op])=>`<label class="f">${l}${tp==='s'?`<select data-pf="${k}"><option value=""></option>${op.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`:`<input data-pf="${k}" ${tp==='n'?'inputmode="decimal"':''} ${tp==='d'?'type="date"':''}>`}</label>`).join('')}</div>`).join('')})();
function renderPerfil(){S.perfil=Object.assign(novoPerfil(),S.perfil||{});const pf=S.perfil;
  if(pf.ved&&!pf.anel.length)pf.anel=pf.ved.map(v=>({de:v.de,ate:v.ate,tipo:v.item==='Pré-filtro'?'Pré-filtro':v.item==='Selo de bentonita'?'Selo de bentonita':'Selo sanitário (cimentação)',obs:v.obs||''}));delete pf.ved;
  document.querySelectorAll('[data-pf]').forEach(i=>i.value=pf[i.dataset.pf]||'');
  for(const [t,cols] of Object.entries(TAB_PF)){const el=$('#t_'+t);if(!el)continue;
    el.innerHTML=`<thead><tr>${cols.map(c=>`<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>`+(pf[t]||[]).map((r,i)=>`<tr>${cols.map(([k,,tp,op])=>`<td>${tp==='s'?`<select data-pt="${t}" data-pi="${i}" data-pk="${k}">${op.map(o=>`<option${r[k]===o?' selected':''}>${esc(o)}</option>`).join('')}</select>`:`<input data-pt="${t}" data-pi="${i}" data-pk="${k}" ${tp==='n'?'inputmode="decimal"':''} value="${esc(r[k])}">`}</td>`).join('')}<td><button class="x" data-ptx="${t}.${i}" aria-label="Remover">×</button></td></tr>`).join('')+'</tbody>'}
  conferirPerfil()}
function conferirPerfil(){const el=$('#pfCheck');if(!el||!S.perfil)return;const pf=S.perfil,N=num,av=[];
  const iv=L=>(L||[]).filter(r=>N(r.de)!=null&&N(r.ate)!=null);const prof=N(S.meta.prof);
  const ok=(c,t)=>av.push(`<li class="${c?'s':'n'}">${c?'✓':'•'} ${t}</li>`);
  ok(prof!=null,'Profundidade do poço (aba Dados)');ok(iv(pf.lito).length,'Litologia');ok(iv(pf.perf).length,'Perfuração');ok(iv(pf.rev).length,'Revestimento');
  ok(iv(pf.anel).some(a=>/Selo sanit/.test(a.tipo)),'Selo sanitário');ok(N(pf.salAlt)!=null,'Saliência');ok(N(pf.lajeLarg)!=null,'Laje de proteção');ok(N(S.ne)!=null,'N.E. (aba Dados)');
  const fim=L=>Math.max(0,...iv(L).map(r=>N(r.ate)));if(prof!=null)[['lito','Litologia'],['perf','Perfuração']].forEach(([k,n])=>{const f=fim(pf[k]);if(f&&Math.abs(f-prof)>0.01)av.push(`<li class="n">• ${n} termina em ${br(f)} m e o poço tem ${br(prof)} m</li>`)});
  const bur=L=>{const s=iv(L).sort((a,b)=>N(a.de)-N(b.de));for(let i=1;i<s.length;i++)if(Math.abs(N(s[i].de)-N(s[i-1].ate))>0.01)return `${br(N(s[i-1].ate))} a ${br(N(s[i].de))} m`;return ''};
  [['lito','Litologia'],['perf','Perfuração']].forEach(([k,n])=>{const b=bur(pf[k]);if(b)av.push(`<li class="n">• ${n} com intervalo vazio de ${b}</li>`)});
  el.innerHTML=av.join('')}
document.addEventListener('input',e=>{const t=e.target;if(!S.perfil)return;
  if(t.dataset.pf){S.perfil[t.dataset.pf]=t.value}else if(t.dataset.pt){S.perfil[t.dataset.pt][+t.dataset.pi][t.dataset.pk]=t.value}else return;conferirPerfil();agendar()});
document.addEventListener('change',e=>{const t=e.target;if(t.tagName!=='SELECT'||!S.perfil)return;
  if(t.dataset.pt)S.perfil[t.dataset.pt][+t.dataset.pi][t.dataset.pk]=t.value;else if(t.dataset.pf)S.perfil[t.dataset.pf]=t.value;else return;conferirPerfil();agendar()});
document.addEventListener('click',e=>{const t=e.target;
  if(t.dataset.ptadd){const k=t.dataset.ptadd,L=S.perfil[k]=S.perfil[k]||[];const ult=L[L.length-1];const r={};TAB_PF[k].forEach(([c,,tp,op])=>r[c]=tp==='s'?op[0]:'');
    if('de' in r)r.de=ult&&ult.ate?ult.ate:(L.length?'':'0');if(k==='rev'&&ult)r.diam=ult.diam;if(k==='perf'&&ult)r.metodo=ult.metodo;L.push(r);renderPerfil();agendar()}
  else if(t.dataset.ptx){const [k,i]=t.dataset.ptx.split('.');S.perfil[k].splice(+i,1);renderPerfil();agendar()}});
