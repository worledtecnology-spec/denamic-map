/* لوحة متابعة الباحثة: كل التلاميذ، تقدم كل موديول، نتائج الاختبارات، الأنشطة، وسجل النشاط بالتوقيت. */
(function(){
const $=s=>document.querySelector(s);
const GN={interactive:"التفاعلية",static:"الساكنة"};
const KL={pos:"الموجب",neg:"السالب"},SL={pre:"القبلي",post:"البعدي"};
let ST=[],EVC={};
const fmtT=t=>t?new Date(t).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"}):"—";
const fmtS=t=>new Date(t).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
const fmtD=s=>{s=Math.round(s);if(s<60)return s+" ث";const m=Math.floor(s/60);return m<60?`${m} د ${s%60} ث`:`${Math.floor(m/60)} س ${m%60} د`};
const rec=(st,id)=>st.mods[id]||{max:0};
const mst=(st,m)=>modStatus(m,rec(st,m.id));
const overall=st=>Math.round(MODULES.reduce((a,m)=>a+mst(st,m).pct,0)/MODULES.length);
const testSum=(st,k)=>{let s=0,t=0,n=0;MODULES.forEach(m=>{const x=rec(st,m.id)[k];if(x&&x.done){s+=x.score;t+=x.total;n++}});return{s,t,n}};
const cname=(m,c)=>c!=null&&c>-1&&MODULES[m-1]?MODULES[m-1].concepts[c].name:"";

async function start(){
  let a=null;try{a=await Store.adminReady()}catch(e){console.error(e)}
  if(a){showApp(a);return}
  $("#rlogin").hidden=false;
  $("#rlf").onsubmit=async e=>{e.preventDefault();const f=e.target,m=f.querySelector(".msg");m.textContent="جارٍ الدخول…";
    try{showApp(await Store.adminLogin(f.email.value,f.pw.value))}catch(x){m.textContent=x.user?x.message:"تعذّر الدخول."}};
}
async function showApp(a){
  $("#rlogin").hidden=true;$("#rapp").hidden=false;
  $("#rmode").innerHTML=a.local?`⚠️ وضع محلي: تظهر بيانات هذا الجهاز فقط. لمتابعة كل التلاميذ من أي جهاز اضبطي إعدادات Firebase (انظري README).`:`☁️ متصل بـ Firebase — ${esc(a.email||"")}`;
  $("#rmode").classList.toggle("warn",!!a.local);
  if(a.local)$("#pwl").hidden=true;
  $("#rref").onclick=load;$("#radd").onclick=()=>{const d=$("#addd"),f=$("#addf");f.reset();f.group.value=Store.GROUP;f.querySelector(".msg").textContent="";d.showModal();f.name.focus()};
  $("#addf").onsubmit=async e=>{e.preventDefault();const f=e.target,m=f.querySelector(".msg");m.className="msg";m.textContent="جارٍ الحفظ…";
    try{await Store.createStudent({name:f.name.value,code:f.code.value,pw:f.pw.value,group:f.group.value,style:f.style.value});$("#addd").close();toast("✔ تمت إضافة التلميذ");load()}
    catch(x){m.className="msg no";m.textContent=x.user?x.message:"تعذّر الحفظ: "+x.message}};
  $("#rout").onclick=async()=>{await Store.adminLogout();location.href="index.html"};
  $("#rcsv").onclick=exportResults;$("#rev").onclick=exportEvents;
  ["#rq","#rg","#rs","#rst"].forEach(s=>$(s).oninput=draw);
  load();
}
async function load(){
  $("#rtbl").innerHTML=`<tr><td class="empty">⏳ جارٍ تحميل البيانات…</td></tr>`;EVC={};
  try{ST=await Store.students()}catch(e){console.error(e);$("#rtbl").innerHTML=`<tr><td class="empty">تعذّر تحميل البيانات: ${esc(e.message)}</td></tr>`;return}
  draw();
}
function kpis(list){
  const n=list.length,avg=n?Math.round(list.reduce((a,s)=>a+overall(s),0)/n):0,all=list.filter(s=>overall(s)==100).length;
  const today=new Date().toDateString(),act=list.filter(s=>s.lastSeen&&new Date(s.lastSeen).toDateString()==today).length;
  const g=k=>list.filter(s=>(s.group||"interactive")==k).length;
  $("#kpis").innerHTML=[["👥","عدد التلاميذ",n,`تفاعلية ${g("interactive")} • ساكنة ${g("static")} | مندفع ${list.filter(s=>s.style=="مندفع").length} • متروي ${list.filter(s=>s.style=="متروي").length}`],["📈","متوسط الإنجاز",avg+"%",""],["🎓","أنهوا كل الموديولات",all,""],["🟢","نشطون اليوم",act,""]]
    .map(k=>`<div class="kpi"><span>${k[0]}</span><div><small>${k[1]}</small><b>${k[2]}</b>${k[3]?`<em>${k[3]}</em>`:""}</div></div>`).join("");
}
function draw(){
  const q=$("#rq").value.trim().toLowerCase(),g=$("#rg").value,so=$("#rs").value,sty=$("#rst").value;
  const styOk=s=>!sty||(sty=="-"?!s.style:s.style==sty);
  let L=ST.filter(s=>(!g||(s.group||"interactive")==g)&&styOk(s)&&(!q||(s.name||"").toLowerCase().includes(q)||String(s.code).toLowerCase().includes(q)));
  L.sort(so=="pct"?(a,b)=>overall(b)-overall(a):so=="seen"?(a,b)=>(b.lastSeen||0)-(a.lastSeen||0):(a,b)=>String(a.name).localeCompare(b.name,"ar"));
  kpis(ST.filter(s=>(!g||(s.group||"interactive")==g)&&styOk(s)));
  if(!L.length){$("#rtbl").innerHTML=`<tr><td class="empty">${ST.length?"لا توجد نتائج مطابقة.":"لا يوجد تلاميذ بعد. اضغطي «➕ إضافة تلميذ»."}</td></tr>`;return}
  $("#rtbl").innerHTML=`<thead><tr><th>#</th><th>التلميذ</th><th>المجموعة</th><th>الأسلوب المعرفي</th><th>الإنجاز الكلي</th>${MODULES.map(m=>`<th title="${m.title}">م${m.id}</th>`).join("")}<th>القبلي</th><th>البعدي</th><th>آخر نشاط</th><th></th></tr></thead><tbody>`+
   L.map((s,i)=>{const o=overall(s),pr=testSum(s,"pre"),po=testSum(s,"post");
    return `<tr><td>${i+1}</td><td><b>${esc(s.name)}</b><small dir="ltr">${esc(s.code)}</small></td><td><span class="gp ${s.group||"interactive"}">${GN[s.group||"interactive"]}</span></td><td>${esc(s.style)||"—"}</td>
    <td><div class="ob"><span class="pbar"><i style="width:${o}%"></i></span><b>${o}%</b></div></td>
    ${MODULES.map(m=>{const x=mst(s,m);return `<td class="mc" style="--p:${x.pct};--c:${m.color}" title="${m.title}: ${x.pct}%">${x.done?"✓":x.pct?x.pct+"%":"·"}</td>`}).join("")}
    <td>${pr.n?`${pr.s}/${pr.t}`:"—"}</td><td>${po.n?`${po.s}/${po.t}`:"—"}</td><td class="ls">${fmtT(s.lastSeen)}</td>
    <td><button class="btn sm" data-u="${esc(s.uid)}">التفاصيل</button></td></tr>`}).join("")+`</tbody>`;
  $("#rtbl").querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>detail(ST.find(s=>s.uid==b.dataset.u)));
}

/* ───── تفاصيل التلميذ ───── */
async function evs(uid){return EVC[uid]||(EVC[uid]=await Store.events(uid))}
function durations(E){ // زمن كل حدث = حتى الحدث التالي (بحد أقصى 15 دقيقة، ولا يعبر جلسات الدخول)
  return E.map((e,i)=>{const n=E[i+1];if(!n||n.type=="login")return 0;return Math.min((n.t-e.t)/1000,900)});
}
function describeEv(e){
  const M=MODULES[(e.m||1)-1],s=e.g!=null&&M?outline(M)[e.g]:null,where=s?describe(M,s):"",cn=cname(e.m,e.c);
  switch(e.type){
    case"login":return"🔑 تسجيل الدخول";case"logout":return"🚪 تسجيل الخروج";
    case"page":return`📄 فتح صفحة: ${/^module-/.test(e.name)?"الموديول "+ORD[+e.name.slice(7)-1]:{index:"الرئيسية",content:"المحتوى التعليمي",mindmap:"الخريطة الذهنية",guide:"دليل التعلم",contact:"التواصل"}[e.name]||e.name}`;
    case"open":return`👁️ فتح: ${where}`;case"complete":return`✅ أنهى: ${where}`;
    case"answer":return`✏️ أجاب عن السؤال ${e.q+1} في الاختبار ${SL[e.k]}: ${e.ok?"إجابة صحيحة":"إجابة خاطئة"}`;
    case"test":return`🏆 أنهى الاختبار ${SL[e.k]}: ${e.score} من ${e.total}`;case"retake":return`🔁 أعاد الاختبار ${SL[e.k]}`;
    case"reveal":return`⚖️ كشف المثال ${KL[e.which]} لمفهوم ${cn}`;
    case"activity":return`🧩 حفظ النشاط لمفهوم ${cn}`;case"self":return`📋 التقويم الذاتي لمفهوم ${cn}: ${e.score} من ${e.total}`;
    case"mm_click":return`🧠 انتقل من الخريطة الذهنية إلى مفهوم ${cn}`;case"mm_locked":return`🔒 حاول فتح مفهوم مقفل من الخريطة: ${cn}`;
    case"mm_module":return`🧠 انتقل من الخريطة الذهنية إلى الموديول`;case"mm_back":return"🧠 عاد إلى الخريطة الذهنية";
    case"mini_map_click":return`🧠 انتقل من خريطة المفهوم (${cn}) إلى ${e.branch=="d"?"التعريف":"الأمثلة"}`;
    case"module_done":return"🎉 أنهى الموديول كاملًا";case"blocked_module":return"🔒 حاول فتح موديول لم يُفتح بعد";
    default:return e.type;
  }
}
function actText(v){if(!v)return"—";if(v.type=="notes")return esc(v.v);if(v.type=="table")return (v.r||[]).map(esc).join(" | ");if(v.type=="task")return v.done?"✔ أنجز المهمة":"لم ينجز";return"—"}
async function detail(s){
  const d=$("#detd");
  d.innerHTML=`<div class="dhead"><div><h3>👤 ${esc(s.name)} <small dir="ltr">${esc(s.code)}</small></h3><p>الإنجاز الكلي: <b>${overall(s)}%</b> • آخر نشاط: ${fmtT(s.lastSeen)}</p></div>
   <div class="dctl"><label>المجموعة<select id="dg"><option value="interactive">التفاعلية</option><option value="static">الساكنة</option></select></label>
   <label>الأسلوب المعرفي<select id="ds"><option value="">— لم يُحدد —</option><option value="مندفع">مندفع</option><option value="متروي">متروي</option></select></label><button class="btn sm" id="dsave">حفظ</button>
   <button class="btn alt sm danger" id="dreset">مسح التقدم</button><button class="btn alt sm" onclick="this.closest('dialog').close()">إغلاق ✕</button></div></div>
   <div class="dtabs" role="tablist"><button class="on" data-t="p">📈 التقدم والنتائج</button><button data-t="a">🧩 الأنشطة والتقويم الذاتي</button><button data-t="l">🕒 سجل النشاط</button></div>
   <div class="dbody" id="dbody"><p class="empty">⏳ جارٍ التحميل…</p></div>`;
  d.showModal();d.querySelector("#dg").value=s.group||"interactive";d.querySelector("#ds").value=s.style||"";
  d.querySelector("#dsave").onclick=async()=>{try{await Store.updateStudent(s.uid,{group:d.querySelector("#dg").value,style:d.querySelector("#ds").value.trim()});
    s.group=d.querySelector("#dg").value;s.style=d.querySelector("#ds").value.trim();draw();toast("✔ تم الحفظ")}catch(e){toast("تعذّر الحفظ")}};
  const rb=d.querySelector("#dreset");rb.onclick=async()=>{if(!rb.dataset.c){rb.dataset.c=1;rb.textContent="⚠️ تأكيد مسح كل تقدم وسجل هذا التلميذ؟";return}
    await Store.resetStudent(s.uid);s.mods={};s.pct=0;delete EVC[s.uid];d.close();draw();toast("تم مسح التقدم")};
  const E=await evs(s.uid),D=durations(E);
  const tabs={p:()=>progTab(s,E,D),a:()=>actTab(s),l:()=>logTab(E,D)};
  d.querySelectorAll(".dtabs button").forEach(b=>b.onclick=()=>{d.querySelectorAll(".dtabs button").forEach(x=>x.classList.toggle("on",x==b));$("#dbody").innerHTML=tabs[b.dataset.t]();bindLog()});
  $("#dbody").innerHTML=tabs.p();
}
function timeIn(E,D,mid){return E.reduce((a,e,i)=>a+(e.m==mid?D[i]:0),0)}
function progTab(s,E,D){
  return `<div class="mgrid">`+MODULES.map(m=>{const r=rec(s,m.id),x=mst(s,m),O=outline(m),now=O[Math.min(x.max,x.N-1)];
    const t=k=>r[k]&&r[k].done?`${r[k].score} / ${r[k].total}${r[k].tries>1?` <small>(${r[k].tries} محاولات)</small>`:""}`:"—";
    const gain=r.pre&&r.pre.done&&r.post&&r.post.done?r.post.score-r.pre.score:null;
    return `<div class="mcard" style="--c:${m.color}"><div class="mt"><span>${m.emoji}</span><b>الموديول ${ORD[m.id-1]}</b><em>${x.done?"مكتمل ✓":x.started?"قيد الدراسة":modOpen(m.id,id=>rec(s,id))?"لم يبدأ":"مقفل 🔒"}</em></div>
     <small class="mtt">${m.title}</small><div class="ob"><span class="pbar"><i style="width:${x.pct}%"></i></span><b>${x.pct}%</b></div>
     <dl><dt>العنصر الحالي</dt><dd>${x.done?"أنهى الموديول":x.started?describe(m,now):"—"}</dd><dt>العناصر المنجزة</dt><dd>${x.max} من ${x.N}</dd>
     <dt>الاختبار القبلي</dt><dd>${t("pre")}</dd><dt>الاختبار البعدي</dt><dd>${t("post")}${gain!=null?` <span class="gain ${gain>=0?"up":"dn"}">${gain>=0?"▲":"▼"} ${Math.abs(gain)}</span>`:""}</dd>
     <dt>زمن الدراسة</dt><dd>${fmtD(timeIn(E,D,m.id))}</dd><dt>آخر تحديث</dt><dd>${fmtT(r.updated)}</dd></dl></div>`}).join("")+`</div>`;
}
function actTab(s){
  return MODULES.map(m=>{const r=rec(s,m.id);if(!(r.max>0))return"";
    const rows=m.concepts.map((c,ci)=>{const a=r.acts&&r.acts[ci],sf=r.self&&r.self[ci],ex=r.ex&&r.ex[ci]||{};
      return `<tr><td><b>${c.icon} ${c.name}</b></td><td>${ex.pos?"✔":"✖"} موجب • ${ex.neg?"✔":"✖"} سالب</td>
       <td>${c.act?`<div class="ans">${actText(a)}</div>${a?`<small>${fmtT(a.t)}</small>`:""}`:"<small>لا يوجد نشاط</small>"}</td>
       <td>${sf?`${sf.score} / ${sf.total}${sf.tries>1?` <small>(${sf.tries} محاولات)</small>`:""}`:"—"}</td></tr>`}).join("");
    const qs=k=>{const x=r[k];if(!x||!x.done)return"";const QS=[...m.pre.tf.map(q=>({...q,tf:1})),...m.pre.mcq];
      return `<div class="qrow"><b>إجابات الاختبار ${SL[k]}:</b> ${QS.map((q,j)=>{const v=x.a[j];const ok=v===q.a;return `<span class="${ok?"ok":"no"}" title="${esc(q.t)}">${j+1}: ${v===undefined?"—":q.tf?(v?"صح":"خطأ"):["أ","ب","ج","د","هـ"][v]} ${ok?"✔":"✖"}</span>`}).join("")}</div>`};
    return `<h4 style="--c:${m.color}">${m.emoji} الموديول ${ORD[m.id-1]}: ${m.title}</h4><table class="atb"><tr><th>المفهوم</th><th>الأمثلة</th><th>إجابة النشاط</th><th>التقويم الذاتي</th></tr>${rows}</table>${qs("pre")}${qs("post")}`}).join("")||`<p class="empty">لم يبدأ التلميذ أي موديول بعد.</p>`;
}
function logTab(E,D){
  if(!E.length)return`<p class="empty">لا يوجد نشاط مسجل بعد.</p>`;
  return `<div class="lfil"><select id="lm"><option value="">كل الموديولات</option>${MODULES.map(m=>`<option value="${m.id}">الموديول ${ORD[m.id-1]}</option>`).join("")}</select>
   <label><input type="checkbox" id="lo"> إخفاء أحداث «فتح»</label><span>${E.length} حدثًا</span></div>
   <ol class="tl">${E.map((e,i)=>({e,i})).reverse().map(({e,i})=>{const day=new Date(e.t).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"});
    return `<li data-m="${e.m||""}" data-ty="${e.type}" class="t-${e.type}"><time title="${fmtT(e.t)}">${day} — ${fmtS(e.t)}</time><span class="tm">${e.m?`م${e.m}`:""}</span><span class="tx">${describeEv(e)}</span>${D[i]>=1?`<span class="du">⏱ ${fmtD(D[i])}</span>`:""}</li>`}).join("")}</ol>`;
}
function bindLog(){const lm=$("#lm"),lo=$("#lo");if(!lm)return;
  const f=()=>document.querySelectorAll(".tl li").forEach(li=>li.hidden=(lm.value&&li.dataset.m!=lm.value)||(lo.checked&&li.dataset.ty=="open"));lm.onchange=f;lo.onchange=f}

/* ───── التصدير (CSV يفتح في Excel) ───── */
function csv(name,rows){
  const t="﻿"+rows.map(r=>r.map(v=>{v=v==null?"":String(v);return /[",\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v}).join(",")).join("\r\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/csv;charset=utf-8"}));a.download=name;document.body.append(a);a.click();a.remove();
}
const iso=t=>{const d=new Date(t),z=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`};
const stamp=()=>new Date().toISOString().slice(0,10);
async function exportResults(){
  const rows=[["الكود","الاسم","المجموعة","الأسلوب المعرفي","الموديول","نسبة الإنجاز %","العناصر المنجزة","إجمالي العناصر","القبلي","من","البعدي","من","التقويم الذاتي (مجموع)","من","زمن الدراسة (دقيقة)","آخر تحديث"]];
  for(const s of ST){const E=await evs(s.uid),D=durations(E);
    MODULES.forEach(m=>{const r=rec(s,m.id),x=mst(s,m);let ss=0,st=0;Object.values(r.self||{}).forEach(v=>{ss+=v.score;st+=v.total});
      rows.push([s.code,s.name,GN[s.group||"interactive"],s.style||"",m.id,x.pct,x.max,x.N,r.pre&&r.pre.done?r.pre.score:"",r.pre&&r.pre.done?r.pre.total:"",r.post&&r.post.done?r.post.score:"",r.post&&r.post.done?r.post.total:"",st?ss:"",st||"",(timeIn(E,D,m.id)/60).toFixed(1),r.updated?iso(r.updated):""])})}
  csv(`نتائج-التلاميذ-${stamp()}.csv`,rows);
}
async function exportEvents(){
  toast("⏳ جارٍ تجهيز سجل النشاط…");
  const rows=[["الكود","الاسم","المجموعة","التاريخ والوقت","الموديول","نوع الحدث","الوصف","المدة (ثانية)"]];
  for(const s of ST){const E=await evs(s.uid),D=durations(E);
    E.forEach((e,i)=>rows.push([s.code,s.name,GN[s.group||"interactive"],iso(e.t),e.m||"",e.type,describeEv(e).replace(/^\S+\s/,""),Math.round(D[i])]))}
  csv(`سجل-النشاط-${stamp()}.csv`,rows);
}
document.addEventListener("DOMContentLoaded",start);
})();
