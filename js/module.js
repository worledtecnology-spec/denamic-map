/* محرك صفحة الموديول: يعرض محتوى الموديول في شرائح تملأ الشاشة دون تمرير.
   التسلسل إلزامي: لا ينتقل التلميذ إلى عنصر حتى ينهي ما قبله، وعند الإنهاء يُفتح العنصر التالي تلقائيًا.
   يُحفظ التقدم والإجابات وسجل النشاط عبر Store (Firebase أو محليًا) لتطّلع عليها الباحثة. */
const M=MODULES[window.MODULE_ID-1];
const SECTIONS=[["pre","📝","الاختبار القبلي"],["rationale","📌","مبررات دراسة الموديول"],["goals","🎯","أهداف دراسة الموديول"],["content","📚","محتوى الموديول"],["post","🏁","الاختبار البعدي"]];
const LT=["أ","ب","ج","د","هـ"];
const $=s=>document.querySelector(s);
const SS={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}};
const short=n=>{const t=n.replace(/\s+[A-Za-z][A-Za-z\s-]*$/,"");return t.includes(" ")?t:n};
const MM_INT=(APP_CONFIG.MINDMAP_PATTERN||"interactive")!=="static";
const QP=new URLSearchParams(location.search),FROM_MAP=QP.get("from")=="map";
if(FROM_MAP)SS.set("fromMap",M.id);
const OUT=outline(M),N=OUT.length;
const QS=[...M.pre.tf.map(q=>({...q,type:"tf"})),...M.pre.mcq.map(q=>({...q,type:"mcq"}))];
const LBL={intro:"مقدمة",about:"📖 تمهيد",def:"💡 التعريف",ex:"⚖️ الأمثلة",mind:"🧠 خريطة ذهنية",act:"🧩 النشاط",self:"✅ التقويم الذاتي"};
const AUTO=new Set(["rationale","goals","xintro","intro","about","def","mind"]);   // تكتمل بمجرد عرضها
const NEED={result:"",xintro:"",q:"اختر إجابة لتنتقل إلى السؤال التالي",ex:"اكشف المثالين الموجب والسالب لتتابع",act:"نفّذ النشاط واحفظ إجابتك لتتابع",self:"أجب عن كل العبارات واضغط «تحقق» لتتابع"};
let R=null,cur={k:"rationale",i:0},RET=null,OPEN=null;
const slidesOf=k=>OUT.filter(s=>s.k==k);
const curS=()=>slidesOf(cur.k)[cur.i];
const isDone=g=>g<R.max,isOpen=g=>g<=R.max;
const save=()=>{R.pct=Math.round(Math.min(R.max,N)/N*100);Store.saveMod(M.id)};
const ev=(type,d)=>Store.log(type,{m:M.id,...d});

/* إنهاء عنصر: يفتح العنصر التالي تلقائيًا */
function complete(s,quiet){
  if(s.g<R.max)return;R.max=s.g+1;save();
  ev("complete",{g:s.g,k:s.k,kind:s.kind,c:s.c??null,q:s.q??null});
  if(R.max>=N)ev("module_done",{});
  if(!quiet&&s===curS())unlockUI();
  side();
}
function unlockUI(){
  const nx=$("#nx");if(nx){nx.disabled=false;nx.classList.add("go-on")}
  const n=$("#need");if(n){n.className="cnt ok";n.textContent=R.max>=N?"🎉 أنهيت الموديول!":"🔓 تم فتح العنصر التالي"}
  stepLocks();
}

/* ───── الهيكل العام ───── */
function init(){
  R=Store.mod(M.id);
  document.body.classList.add("mod");document.body.style.setProperty("--mc",M.color);
  $("#mtitle").innerHTML=`<span class="mb" aria-hidden="true"><span>${M.emoji}</span></span><span><small>الموديول ${ORD[M.id-1]}</small>${M.title}</span>`;
  document.title=`الموديول ${M.id}: ${M.title}`;
  $(".side .pbar").insertAdjacentHTML("beforebegin",`<div class="ptxt"><span>إنجازك في الموديول</span><span id="ptx">0%</span></div>`);
  $(".side .pbar").insertAdjacentHTML("afterend",`<div class="pcount" id="pcount"></div>`);
  $("#items").innerHTML=SECTIONS.map(s=>`<button class="it" data-k="${s[0]}"><span class="ic" aria-hidden="true">${s[1]}</span><span class="nm">${s[2]}</span><span class="st" aria-hidden="true"></span></button>`+
    (s[0]=="content"?`<div class="subs">${M.concepts.map((c,ci)=>`<button data-c="${ci}">${c.icon} ${c.name}</button>`).join("")}</div>`:"")).join("");
  document.querySelectorAll("#items .it").forEach(b=>b.onclick=()=>{const g=slidesOf(b.dataset.k)[0].g;if(!isOpen(g))return locked();show(b.dataset.k,0);$(".side").classList.add("closed")});
  document.querySelectorAll("#items .subs button").forEach(b=>b.onclick=()=>{goConcept(+b.dataset.c);$(".side").classList.add("closed")});
  $("#tog").onclick=()=>$(".side").classList.toggle("closed");
  if(MM_INT){const fm=SS.get("fromMap")==M.id;
    $(".top").insertAdjacentHTML("beforeend",`<a href="mindmap.html" class="btn mmback ${fm?"pulse":""}" id="mmback">🧠 العودة إلى الخريطة الذهنية</a>`);
    $("#mmback").onclick=()=>{const s=curS();SS.set("mm:last",M.id+"-"+Math.max(s.c??0,0));ev("mm_back",{g:s.g})}}
  const qc=QP.get("c");
  if(FROM_MAP&&qc!=null){history.replaceState(null,"",location.pathname);+qc<0?show("content",0):goConcept(+qc)}
  else if(location.hash){const [k,i]=location.hash.slice(1).split("/");show(decodeURIComponent(k),+i||0)}
  else{const t=OUT[Math.min(R.max,N-1)];show(t.k,t.i)}   // يستأنف من حيث توقف
  addEventListener("resize",()=>requestAnimationFrame(fit));
  document.fonts&&document.fonts.ready.then(fit);
  addEventListener("keydown",e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||document.querySelector("dialog[open]"))return;
    if(e.key=="ArrowLeft")go(1);if(e.key=="ArrowRight")go(-1)});
}
const locked=()=>toast("🔒 أكمل العنصر الحالي أولًا، وسيُفتح هذا العنصر تلقائيًا.");
function goConcept(ci){const g=conceptG(M,ci);if(!isOpen(g)){locked();const t=OUT[R.max];return show(t.k,t.i)}show("content",OUT[g].i)}
function go(d){const s=curS();
  if(d>0){if(!isDone(s.g)){const n=$("#need");if(n){n.classList.remove("shake");void n.offsetWidth;n.classList.add("shake")}return}
    const t=OUT[s.g+1];if(t)show(t.k,t.i);else location.href="content.html"}
  else{const t=OUT[s.g-1];if(t)show(t.k,t.i)}}

function side(){
  const pc=Math.round(Math.min(R.max,N)/N*100);
  $("#prog").style.width=pc+"%";$("#ptx").textContent=pc+"%";$("#pcount").textContent=`أنجزت ${Math.min(R.max,N)} من ${N} عنصرًا`;
  document.querySelectorAll("#items .it").forEach(b=>{const sl=slidesOf(b.dataset.k),op=isOpen(sl[0].g),dn=isDone(sl[sl.length-1].g);
    b.classList.toggle("on",b.dataset.k==cur.k);b.classList.toggle("seen",dn);b.classList.toggle("lock",!op);b.setAttribute("aria-disabled",!op);
    b.querySelector(".st").textContent=dn?"✓":op?"":"🔒"});
  document.querySelectorAll("#items .subs button").forEach(b=>{const ci=+b.dataset.c,op=isOpen(conceptG(M,ci));
    b.classList.toggle("on",cur.k=="content"&&curS().c===ci);b.classList.toggle("lock",!op);b.classList.toggle("seen",isDone(conceptG(M,ci,"self")))});
}
function stepLocks(){document.querySelectorAll("#panel [data-g]").forEach(b=>{const g=+b.dataset.g,op=isOpen(g);b.disabled=!op;b.classList.toggle("lock",!op);
  if(b.classList.contains("stp")&&!b.classList.contains("on"))b.classList.toggle("done",isDone(g))})}

function show(k,i=0){
  if(!SECTIONS.some(s=>s[0]==k))k="pre";
  let sl=slidesOf(k);i=Math.max(0,Math.min(i||0,sl.length-1));
  if(!isOpen(sl[i].g)){const t=OUT[Math.min(R.max,N-1)];k=t.k;i=t.i;sl=slidesOf(k)}
  cur={k,i};const s=sl[i];
  history.replaceState(null,"",location.pathname+"#"+k+(i?"/"+i:""));
  if(RET&&!(k=="content"&&s.c===RET.c))RET=null;
  ev("open",{g:s.g,k,kind:s.kind,c:s.c??null,q:s.q??null});
  if(AUTO.has(s.kind))complete(s,true);
  const si=SECTIONS.findIndex(x=>x[0]==k),S=SECTIONS[si];

  let head=`<div class="ph"><span class="sic" aria-hidden="true">${S[1]}</span><h2>${S[2]}</h2>`,steps="";
  if(k=="content"){
    head+=`<div class="chips" role="tablist"><button class="chip ${s.c==-1?"on":""}" data-g="${sl[0].g}" data-i="0">🚀 مقدمة</button>`+
      M.concepts.map((c,ci)=>{const g=conceptG(M,ci);return `<button class="chip ${s.c==ci?"on":""}" data-g="${g}" data-i="${OUT[g].i}">${isOpen(g)?c.icon:"🔒"} ${short(c.name)}</button>`}).join("")+`</div>`;
    if(s.c>-1)steps=`<div class="stps">`+sl.map((x,j)=>x.c==s.c?`<button class="stp ${j==i?"on":""}" data-g="${x.g}" data-i="${j}">${LBL[x.kind]}</button>`:"").join("")+`</div>`;
  }
  if(k=="pre"||k=="post"){
    head+=`<span class="chip on static">${QS.length} أسئلة</span>`;
    if(s.q>-1)steps=`<div class="stps">`+sl.filter(x=>x.kind=="q").map(x=>`<button class="stp num ${x.q==s.q?"on":""}" data-g="${x.g}" data-i="${x.q+1}" aria-label="السؤال ${x.q+1}">${x.q+1}</button>`).join("")+
      `<button class="stp ${s.q==QS.length?"on":""}" data-g="${sl[sl.length-1].g}" data-i="${QS.length+1}">🏆 النتيجة</button></div>`;
  }
  head+=`</div>`;
  const last=i==sl.length-1,lastSec=si==SECTIONS.length-1;
  let nxt=!last?"التالي ⬅":lastSec?"إنهاء الموديول 🎉":`${SECTIONS[si+1][1]} ${SECTIONS[si+1][2]} ⬅`;
  if((k=="pre"||k=="post")&&s.q==QS.length-1)nxt="إنهاء الاختبار ✔";
  if((k=="pre"||k=="post")&&s.q==-1)nxt="ابدأ الاختبار ⬅";
  const cnt=k=="content"?`${i+1} / ${sl.length}`:(k=="pre"||k=="post")&&s.q>-1&&s.q<QS.length?`السؤال ${s.q+1} من ${QS.length}`:`${si+1} / ${SECTIONS.length}`;
  const done=isDone(s.g),mid=RET&&i!==RET.i?`<button class="btn ret" id="ret">🧠 العودة إلى خريطة المفهوم</button>`
    :done?`<span class="cnt">${cnt}</span>`:`<span class="cnt need" id="need">🔒 ${NEED[s.kind]||"أكمل هذا العنصر لتتابع"}</span>`;
  $("#panel").innerHTML=head+steps+`<div class="stage"><div class="fit" id="fit"></div></div>
   <div class="pf"><button class="btn alt" id="pv" ${s.g==0?"disabled":""}>➡ السابق</button>${mid}<button class="btn" id="nx" ${done?"":"disabled"}>${nxt}</button></div>`;
  $("#pv").onclick=()=>go(-1);$("#nx").onclick=()=>go(1);
  if($("#ret"))$("#ret").onclick=()=>{const r=RET.i;RET=null;show("content",r)};
  $("#panel").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{if(!isOpen(+b.dataset.g))return locked();show(k,+b.dataset.i)});
  stepLocks();side();
  RENDER[s.kind]($("#fit"),s);fit();
}

/* تصغير الخط تلقائيًا حتى تتسع الشريحة للمساحة دون تمرير */
function fit(){const f=$("#fit");if(!f)return;
  if(matchMedia("(max-width:900px)").matches){f.style.setProperty("--k",1);return}
  const st=f.parentElement;let k=1;f.style.setProperty("--k",k);
  while(k>.5&&f.scrollHeight>st.clientHeight+1){k-=.03;f.style.setProperty("--k",k.toFixed(2))}
}

/* ───── الشرائح ───── */
const strong=t=>t.replace(/(عزيزي التلميذ[؛،]?)/g,"<b>$1</b>");
function ill(icon,img,label){return `<div class="ill">${img?`<img src="${img}" alt="" onerror="this.outerHTML='<span>${icon}</span>'">`:`<span>${icon}</span>`}${label?`<small>${label}</small>`:""}<i class="o1"></i><i class="o2"></i></div>`}
const C_=s=>M.concepts[s.c];
const RENDER={
  rationale:b=>{b.innerHTML=`<div class="sl duo">${ill(M.emoji,M.img,"الموديول "+ORD[M.id-1])}
   <div class="txt"><h3 class="cname">${M.title}</h3>${M.rationale.map((p,j)=>`<p class="bub ${j?"hl":""}">${strong(p)}</p>`).join("")}
   <div class="tags"><b>🔑 مفاهيم الموديول:</b>${M.concepts.map(c=>`<span>${c.icon} ${c.name}</span>`).join("")}</div></div></div>`},
  goals:b=>{b.innerHTML=`<div class="sl"><p class="lead2">🎓 <b>عزيزي التلميذ؛</b> بعد الانتهاء من دراسة هذا الموديول ينبغي أن تكون قادرًا على أن:</p>
   <div class="goals">${M.goals.map((g,j)=>`<div class="goal" style="--d:${j*70}ms"><b>${j+1}</b><span>${g}</span></div>`).join("")}</div></div>`},
  intro:b=>{b.innerHTML=`<div class="sl duo">${ill("📚",null,"محتوى الموديول")}<div class="txt">${M.intro.map((p,j)=>`<p class="bub ${j==M.intro.length-1&&j?"hl":""}">${p}</p>`).join("")}
   <div class="cards">${M.concepts.map((c,ci)=>{const op=isOpen(conceptG(M,ci));return `<button class="ccard ${op?"":"lock"}" data-c="${ci}" style="--d:${ci*90}ms"><i>${op?c.icon:"🔒"}</i><small>المفهوم ${ORD[ci]}</small><b>${c.name}</b></button>`}).join("")}</div></div></div>`;
   b.querySelectorAll(".ccard").forEach(x=>x.onclick=()=>goConcept(+x.dataset.c))},
  about:(b,s)=>{const c=C_(s);b.innerHTML=`<div class="sl duo">${ill(c.icon,c.img,"المفهوم "+ORD[s.c])}<div class="txt"><h3 class="cname">${c.name}</h3><p class="bub">${c.about}</p>
   <p class="hint">👈 اضغط «التالي» لتتعرف على تعريف المفهوم</p></div></div>`},
  def:(b,s)=>{const c=C_(s);b.innerHTML=`<div class="sl"><div class="def"><div class="rib">💡 تعريف ${c.name}</div><div class="dic">${c.icon}</div><p>${c.def}</p></div></div>`},
  ex:examples,mind,act:activity,self:selfTest,
  xintro:(b,s)=>examIntro(b,s.k),q:(b,s)=>question(b,s),result:(b,s)=>result(b,s)
};
function examples(b,s){
  const c=C_(s),st=R.ex[s.c]||(R.ex[s.c]={});
  const card=(cls,ic,t,txt)=>`<button class="exc ${cls} ${st[cls]?"open":""}" data-x="${cls}" aria-label="${t}"><span class="in"><span class="f"><i>${ic}</i><b>${t}</b><small>👆 اضغط لكشف المثال</small></span><span class="bk"><i>${ic}</i><b>${t}</b><p>${txt}</p></span></span></button>`;
  b.innerHTML=`<div class="sl"><h3 class="ctr">⚖️ أمثلة مفهوم ${c.name}</h3><div class="ex">${card("pos","✔","مثال موجب",c.pos)}${card("neg","✖","مثال سالب",c.neg)}</div></div>`;
  const reveal=x=>{x.classList.add("open");const w=x.dataset.x;if(!st[w]){st[w]=true;save();ev("reveal",{g:s.g,c:s.c,which:w})}if(st.pos&&st.neg)complete(s)};
  b.querySelectorAll(".exc").forEach(x=>x.onclick=()=>reveal(x));
  if(OPEN){const e=b.querySelector(".exc."+OPEN);OPEN=null;if(e)reveal(e)}
}
function mind(b,s){
  const c=C_(s),r=(APP_CONFIG.MINDMAP_LAYOUT||APP_CONFIG.MINDMAP_MODE)=="radial",t=MM_INT?"button":"div";
  const br=(cls,d,ttl,txt,go)=>`<${t} class="br ${cls}" style="--d:${d}" ${MM_INT?`data-go="${cls}"`:""}><b>${ttl}</b><p>${txt}</p>${MM_INT?`<span class="go">${go} ⬅</span>`:""}</${t}>`;
  b.innerHTML=`<div class="sl"><div class="mm ${r?"radial":"tree"} ${MM_INT?"int":"static"}"><div class="core">${c.icon} ${c.name}</div><div class="brs">
   ${br("d",".1s","💡 التعريف",c.def,"اذهب إلى التعريف")}
   ${br("p",".3s","✔ مثال موجب",c.pos,"اذهب إلى الأمثلة")}
   ${br("n",".5s","✖ مثال سالب",c.neg,"اذهب إلى الأمثلة")}</div></div>
   ${MM_INT?`<p class="mmhint">👆 اضغط على أي فرع من فروع الخريطة للانتقال إليه، ثم عُد إلى الخريطة.</p>`:""}</div>`;
  if(MM_INT)b.querySelectorAll("[data-go]").forEach(x=>x.onclick=()=>{
    const g=x.dataset.go,to=conceptG(M,s.c,g=="d"?"def":"ex");
    ev("mini_map_click",{g:s.g,c:s.c,branch:g});
    RET={c:s.c,i:s.i};OPEN=g=="d"?null:g=="p"?"pos":"neg";show("content",OUT[to].i)});
}
function activity(b,s){
  const c=C_(s),sv=R.acts[s.c]||{},A=c.act;
  let body="";
  if(A.type=="notes")body=`<textarea aria-label="ملاحظاتك" placeholder="✍️ اكتب ملاحظاتك هنا…">${esc(sv.v||"")}</textarea>`;
  if(A.type=="table")body=`<table class="atbl"><tr><th>المفهوم</th><th>${A.col}</th></tr>${A.rows.map((r,j)=>`<tr><th>${r}</th><td><input aria-label="${r}" value="${esc(sv.r&&sv.r[j]||"")}"></td></tr>`).join("")}</table>`;
  if(A.type=="task")body=`<div class="task"><span class="tic">✂️🎨</span><label class="chk"><input type="checkbox" ${sv.done?"checked":""}> أنجزت المهمة</label></div>`;
  b.innerHTML=`<div class="sl act"><div class="ahead"><span class="aic">🧩</span><div><b>النشاط ${ORD[s.an]}</b><p>${strong(A.text)}</p></div></div>${body}
   ${A.type=="task"?`<div class="arow"><span class="msg ok" id="am" role="status"></span></div>`:`<div class="arow"><button class="sbtn" id="as">💾 حفظ إجابتي</button><span class="msg ok" id="am" role="status">${sv.t?"✔ محفوظة":""}</span></div>`}</div>`;
  const doSave=()=>{const v={t:Date.now(),type:A.type},m=$("#am");
    if(A.type=="notes"){v.v=b.querySelector("textarea").value.trim();if(!v.v){m.className="msg no";m.textContent="✍️ اكتب ملاحظاتك أولًا.";return}}
    if(A.type=="table"){v.r=[...b.querySelectorAll("input")].map(x=>x.value.trim());if(v.r.some(x=>!x)){m.className="msg no";m.textContent="✍️ أكمل كل خانات الجدول أولًا.";return}}
    if(A.type=="task"){v.done=b.querySelector("input").checked;if(!v.done){m.textContent="";return}}
    R.acts[s.c]=v;save();ev("activity",{g:s.g,c:s.c,value:v});m.className="msg ok";m.textContent="✔ تم الحفظ، أحسنت!";cheer();complete(s)};
  const sb=$("#as");if(sb)sb.onclick=doSave;
  if(A.type=="task")b.querySelector("input").onchange=doSave;
}
function selfTest(b,s){
  const c=C_(s),prev=R.self[s.c],a={...(prev&&prev.a||{})};
  b.innerHTML=`<div class="sl"><div class="ahead"><span class="aic">✅</span><div><b>اختبار التقويم الذاتي ${ORD[s.c]}</b><p><b>عزيزي التلميذ؛</b> لمعرفة مدى تقدمك، حدد «صح» أو «خطأ» لكل عبارة، ثم اضغط «تحقق».</p></div></div>
   <div class="tfl">${c.self.map((q,j)=>`<div class="tfr" data-j="${j}"><span class="n">${j+1}</span><p>${q.t}</p><div class="tfb"><button class="y ${a[j]===true?"sel":""}" data-v="1">✔ صح</button><button class="x ${a[j]===false?"sel":""}" data-v="0">✖ خطأ</button></div><span class="fb" aria-live="polite"></span></div>`).join("")}</div>
   <div class="arow"><button class="sbtn" id="chk">تحقق من إجاباتي</button><span class="msg" id="sm" role="status">${prev?`نتيجتك السابقة: ${prev.score} من ${c.self.length}`:""}</span></div></div>`;
  b.querySelectorAll(".tfr").forEach(r=>r.querySelectorAll("button").forEach(x=>x.onclick=()=>{const j=+r.dataset.j;a[j]=x.dataset.v=="1";
    r.querySelectorAll("button").forEach(y=>y.classList.toggle("sel",y==x));r.classList.remove("ok","bad");r.querySelector(".fb").textContent=""}));
  $("#chk").onclick=()=>{const m=$("#sm");
    if(c.self.some((_,j)=>a[j]===undefined)){m.className="msg no";m.textContent="أجب عن كل العبارات أولًا.";return}
    let sc=0;b.querySelectorAll(".tfr").forEach(r=>{const j=+r.dataset.j,ok=a[j]===c.self[j].a;sc+=ok;
      r.classList.toggle("ok",ok);r.classList.toggle("bad",!ok);r.querySelector(".fb").textContent=ok?"🌟":"🔁"});
    R.self[s.c]={a:{...a},score:sc,total:c.self.length,tries:((prev&&prev.tries)||0)+1,t:Date.now()};save();
    ev("self",{g:s.g,c:s.c,score:sc,total:c.self.length,answers:{...a}});
    m.className="msg "+(sc==c.self.length?"ok":"no");
    m.textContent=sc==c.self.length?`ممتاز! ${sc} من ${c.self.length} 🎉`:`${sc} من ${c.self.length} — راجع العبارات المميزة باللون الأحمر، ويمكنك المحاولة مرة أخرى.`;
    if(sc==c.self.length)cheer();complete(s);fit()};
}

/* ───── الاختبار القبلي / البعدي ───── */
const lbl=k=>k=="pre"?"القبلي":"البعدي";
const X=k=>R[k]||(R[k]={a:{}});
function examIntro(b,k){
  const x=X(k),about="ل"+M.title.replace(/^ال/,"ل");
  b.innerHTML=`<div class="sl xintro"><div class="big-ic">${k=="pre"?"📝":"🏁"}</div><h3>الاختبار ${lbl(k)} للموديول</h3>
   <p class="bub">${k=="pre"?`<b>عزيزي التلميذ؛</b> للتعرف على مستوى تحصيلك المعرفي ${about} قبل البدء في دراسة هذا الموديول، يمكنك الإجابة عن الأسئلة التالية:`
     :`<b>عزيزي التلميذ؛</b> للتعرف على مستوى تحصيلك المعرفي ${about} بعد الانتهاء من دراسة هذا الموديول، يمكنك الإجابة عن أسئلة الاختبار البعدي (نفس أسئلة الاختبار القبلي).`}</p>
   <div class="stats"><span>✔✖ صواب وخطأ: ${M.pre.tf.length}</span><span>🔘 اختيار من متعدد: ${M.pre.mcq.length}</span>${x.done?`<span class="pv">🏆 نتيجتك: ${x.score} من ${QS.length}</span>`:""}</div>
   <p class="hint">اختر إجابة واحدة لكل سؤال، ثم اضغط «التالي». لن تظهر الإجابات الصحيحة إلا بعد إنهاء الاختبار.</p></div>`;
}
function question(b,s){
  const k=s.k,j=s.q,q=QS[j],x=X(k),a=x.a[j],ro=x.done;
  const tag=q.type=="tf"?"✔✖ ضع علامة صح أو خطأ":"🔘 اختر الإجابة الصحيحة";
  b.innerHTML=`<div class="sl qwrap"><span class="qtag">${tag}</span><div class="qcard"><span class="qn">السؤال ${j+1}</span><p>${q.t}</p></div>
   ${q.type=="tf"?`<div class="tfbig"><button class="big y ${a===true?"sel":""}" data-v="1" ${ro?"disabled":""}><i>✔</i>صح</button><button class="big x ${a===false?"sel":""}" data-v="0" ${ro?"disabled":""}><i>✖</i>خطأ</button></div>`
   :`<div class="ops">${q.o.map((o,n)=>`<button class="op ${a===n?"sel":""}" data-v="${n}" ${ro?"disabled":""}><span class="lt">${LT[n]}</span>${o}</button>`).join("")}</div>`}
   ${ro?`<p class="hint">🔒 أنهيت هذا الاختبار، ولا يمكن تغيير الإجابات.</p>`:""}</div>`;
  b.querySelectorAll("[data-v]").forEach(y=>y.onclick=()=>{if(x.done)return;const v=q.type=="tf"?y.dataset.v=="1":+y.dataset.v;x.a[j]=v;save();
    b.querySelectorAll("[data-v]").forEach(z=>z.classList.toggle("sel",z==y));
    ev("answer",{g:s.g,k,q:j,v,ok:v===q.a});complete(s)});
}
function result(b,s){
  const k=s.k,x=X(k);
  if(!x.done){const sc=QS.filter((q,j)=>x.a[j]===q.a).length;
    Object.assign(x,{score:sc,total:QS.length,done:true,at:Date.now(),tries:(x.tries||0)+1});
    x.hist=[...(x.hist||[]),{score:sc,at:x.at}];save();ev("test",{g:s.g,k,score:sc,total:QS.length,answers:{...x.a}})}
  complete(s);
  const sc=x.score,p=Math.round(sc/QS.length*100);
  const stars="⭐".repeat(p>=90?3:p>=60?2:1),msg=p>=90?"ممتاز! أداء رائع 🎉":p>=60?"أحسنت! استمر في التعلم 👏":"بداية جيدة، وستتحسن مع الدراسة 💪";
  const ans=q=>q.type=="tf"?(q.a?"صح":"خطأ"):LT[q.a]+") "+q.o[q.a];
  b.innerHTML=`<div class="sl"><div class="res"><div class="ring" style="--p:${p}"><div><span><b>${sc}</b><small>من ${QS.length}</small></span></div></div>
   <div><h3 class="rh">الاختبار ${lbl(k)}: انتهى ✔</h3><div class="stars">${stars}</div><p class="rm">${msg}</p>
   ${APP_CONFIG.ALLOW_RETAKE?`<button class="sbtn alt" id="again">🔁 إعادة الاختبار</button>`:""}</div></div>
   ${APP_CONFIG.SHOW_FEEDBACK_AFTER_QUIZ?`<div class="rev">${QS.map((q,j)=>{const ok=x.a[j]===q.a;return `<div class="${ok?"ok":"no"}"><b>${j+1}</b><span>${ok?"✔ صحيحة":"✖ تحتاج مراجعة — الإجابة: "+ans(q)}</span></div>`}).join("")}</div>`:""}</div>`;
  const ag=$("#again");if(ag)ag.onclick=()=>{x.done=false;x.a={};save();ev("retake",{k});show(k,1)};
  if(p>=60)cheer();
}
function cheer(){const p=$("#panel");if(!p||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const c=document.createElement("div");c.className="conf";c.setAttribute("aria-hidden","true");
  c.innerHTML=Array.from({length:26},(_,i)=>`<span style="left:${Math.random()*100}%;animation-delay:${Math.random()*.6}s;font-size:${1+Math.random()*1.2}rem">${["🎉","⭐","🌟","✨","🎈"][i%5]}</span>`).join("");
  p.append(c);setTimeout(()=>c.remove(),3200)}

document.addEventListener("DOMContentLoaded",()=>onStudent(()=>{
  if(!modOpen(M.id)){
    $("#mtitle").innerHTML=`الموديول ${ORD[M.id-1]}: ${M.title}`;
    $("#panel").innerHTML=`<div class="gate"><span>🔒</span><h3>هذا الموديول لم يُفتح بعد</h3><p>أكمل <b>الموديول ${ORD[M.id-2]}</b> أولًا، وسيُفتح هذا الموديول لك تلقائيًا.</p><a class="btn" href="content.html">العودة إلى المحتوى</a></div>`;
    Store.log("blocked_module",{m:M.id});return}
  if(isUnlocked(M.id))init();
  else{$("#panel").innerHTML="<p>🔒 هذا الموديول مغلق.</p>";askPassword(M.id,init,()=>location.href=FROM_MAP&&MM_INT?"mindmap.html":"content.html")}
}));
