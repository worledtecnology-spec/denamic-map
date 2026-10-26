/* الخريطة الذهنية الشاملة: كل مفاهيم المحتوى مرتبطة بموديولاتها.
   النمط يحدده APP_CONFIG.MINDMAP_PATTERN:
   "interactive" ← الضغط على أي مفهوم ينقل إلى شرحه داخل الموديول مع إمكانية العودة للخريطة.
   "static"      ← عرض ثابت للمفاهيم فقط دون أي تفاعل أو انتقال. */
(function(){
const INT=(APP_CONFIG.MINDMAP_PATTERN||"interactive")!=="static";
const W=1600,H=780,LW=272,LH=52,MW=246,MH=80,CW=250,CH=150,GAP=9,GG=24;
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const SS={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}};
const shortT=t=>t.replace(/^المفاهيم المرتبطة\s+/,"").replace(/^ب/,"");
function split(n){const m=n.match(/^(.*?)\s+([A-Za-z][A-Za-z\s()-]*)$/);return m&&m[1].includes(" ")?[m[1],m[2].trim()]:[n,""]}
const total=MODULES.reduce((a,m)=>a+m.concepts.length,0);
const stage=document.getElementById("mmstage"),map=document.getElementById("mmap");
let mode="";

/* حساب مواضع العقد: الموديولات 1-4 يمين المركز و5-8 يساره، والمفاهيم في الطرف الخارجي */
function layout(){
  const pos={};
  [MODULES.slice(0,4),MODULES.slice(4)].forEach((ms,s)=>{
    const dir=s?-1:1,mx=W/2+dir*310,lx=W/2+dir*(W/2-LW/2-10);
    const gh=m=>Math.max(m.concepts.length*LH+(m.concepts.length-1)*GAP,MH);
    let y=(H-ms.reduce((a,m)=>a+gh(m),0)-(ms.length-1)*GG)/2;
    ms.forEach(m=>{const h=gh(m),n=m.concepts.length,lh=n*LH+(n-1)*GAP,y0=y+(h-lh)/2;
      pos[m.id]={x:mx,y:y+h/2,dir,lx,leaves:m.concepts.map((_,i)=>y0+i*(LH+GAP)+LH/2)};y+=h+GG});
  });
  return pos;
}
const box=(x,y,w,h)=>`left:${x-w/2}px;top:${y-h/2}px;width:${w}px;height:${h}px`;
const curve=(x1,y1,x2,y2)=>{const mx=(x1+x2)/2;return `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`};

function node(tag,attrs,cls,style,inner){return `<${tag} class="${cls}" ${attrs} style="${style}">${inner}</${tag}>`}
function modInner(m){return `<span class="me" aria-hidden="true">${m.emoji}</span><span class="mt"><small>الموديول ${ORD[m.id-1]}</small><b>${shortT(m.title)}</b></span>`}
function leafInner(c,lk){const [a,e]=split(c.name);return `<span class="li" aria-hidden="true">${c.icon}</span><span class="lt"><b>${a}</b>${e?`<small dir="ltr">${e}</small>`:""}</span>${INT?`<i class="go" aria-hidden="true">${lk?"🔒":"⬅"}</i><i class="ck" aria-label="أنجزته">✓</i>`:""}`}
/* حالة المفهوم: متاح إذا وصل إليه التلميذ في تسلسل الموديول، ومنجز إذا أنهى تقويمه الذاتي */
const st=(m,ci)=>{const r=Store.mod(m.id),op=modOpen(m.id)&&(r.max||0)>=conceptG(m,ci);return{lk:INT&&!op,dn:(r.max||0)>conceptG(m,ci,"self")}};
const lfCls=(m,ci,last)=>{const x=st(m,ci),k=m.id+"-"+ci;return `lf${INT&&x.dn?" seen":""}${x.lk?" locked":""}${last==k?" last":""}`};
const mnCls=m=>`mn${INT&&!modOpen(m.id)?" locked":""}`;
const href=(m,ci)=>`module-${m.id}.html?from=map&c=${ci}`;

function render(){
  const wide=!matchMedia("(max-width:900px)").matches;mode=wide?"wide":"list";
  const last=SS.get("mm:last");
  const tagL=INT?"a":"div",tagM=INT?"a":"div";
  const center=`<div class="mc" style="${wide?box(W/2,H/2,CW,CH):""}"><span aria-hidden="true">🧠</span><b>المفاهيم التكنولوجية</b><small>${MODULES.length} موديولات • ${total} مفهومًا</small></div>`;
  map.className="mmap "+(INT?"int":"static")+" "+mode;
  if(!wide){
    map.removeAttribute("style");
    map.innerHTML=center+`<div class="lst">`+MODULES.map(m=>`<section class="g" style="--c:${m.color}" data-m="${m.id}">
      ${node(tagM,INT?`href="${href(m,-1)}" data-m="${m.id}"`:"",mnCls(m),"",modInner(m))}
      <div class="lvs">${m.concepts.map((c,ci)=>node(tagL,INT?`href="${href(m,ci)}" data-k="${m.id}-${ci}"`:"",lfCls(m,ci,last),"",leafInner(c,st(m,ci).lk))).join("")}</div></section>`).join("")+`</div>`+hint();
  }else{
    const P=layout();let paths="",html="",d=0;
    MODULES.forEach((m,mi)=>{const p=P[m.id],cx=W/2+p.dir*CW/2,cy=H/2+(p.y-H/2)*.28;
      paths+=`<path class="b1" data-m="${m.id}" stroke="${m.color}" d="${curve(cx,cy,p.x-p.dir*MW/2,p.y)}" style="--d:${mi*.08}s"/>`;
      html+=`<div class="g" style="--c:${m.color}" data-m="${m.id}">`+node(tagM,INT?`href="${href(m,-1)}" data-m="${m.id}" aria-label="الموديول ${ORD[m.id-1]}: ${m.title}"`:"",mnCls(m),box(p.x,p.y,MW,MH)+`;--d:${.2+mi*.08}s`,modInner(m));
      m.concepts.forEach((c,ci)=>{const ly=p.leaves[ci],k=m.id+"-"+ci;
        paths+=`<path class="b2" data-m="${m.id}" stroke="${m.color}" d="${curve(p.x+p.dir*MW/2,p.y,p.lx-p.dir*LW/2,ly)}" style="--d:${.45+d*.04}s"/>`;
        const x=st(m,ci);html+=node(tagL,INT?`href="${href(m,ci)}" data-k="${k}" aria-label="${c.name} – الموديول ${ORD[m.id-1]}${x.lk?" (لم يُفتح بعد)":""}"`:"",lfCls(m,ci,last),box(p.lx,ly,LW,LH)+`;--d:${.6+d*.04}s`,leafInner(c,x.lk));d++});
      html+=`</div>`;
    });
    map.style.cssText=`width:${W}px;height:${H}px`;
    map.innerHTML=`<svg class="lines" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${paths}</svg>`+center+html+hint();
  }
  if(INT)bind();
  scale();
}
function hint(){
  const n=MODULES.reduce((a,m)=>a+m.concepts.filter((_,ci)=>st(m,ci).dn).length,0);
  return INT?`<div class="mh htop"><b>👆 اضغط على أي مفهوم</b> لتنتقل إلى شرحه داخل الموديول الخاص به، ثم عُد إلى الخريطة لتستكشف باقي المفاهيم.</div>
    <div class="mh hbot"><span>🏅 أنجزت <b>${Math.min(n,total)}</b> من ${total} مفهومًا</span><span class="pb"><i style="width:${Math.min(n,total)/total*100}%"></i></span></div>`
   :`<div class="mh htop"><b>🧠 الخريطة الذهنية لمفاهيم المحتوى</b> تعرض جميع المفاهيم التكنولوجية وارتباط كل مفهوم بالموديول الخاص به.</div>
    <div class="mh hbot"><span class="lg"><i class="lm"></i> الموديول</span><span class="lg"><i class="ll"></i> المفهوم</span></div>`;
}
function bind(){
  map.querySelectorAll(".g").forEach(g=>{
    const on=()=>{map.classList.add("focus");map.querySelectorAll(`[data-m="${g.dataset.m}"]`).forEach(x=>x.classList.add("hot"))};
    const off=()=>{map.classList.remove("focus");map.querySelectorAll(".hot").forEach(x=>x.classList.remove("hot"))};
    g.querySelectorAll("a").forEach(a=>{a.addEventListener("mouseenter",on);a.addEventListener("mouseleave",off);a.addEventListener("focus",on);a.addEventListener("blur",off)});
  });
  map.querySelectorAll("a.lf").forEach(a=>a.addEventListener("click",e=>{const k=a.dataset.k,[mi,ci]=k.split("-").map(Number);
    if(a.classList.contains("locked")){e.preventDefault();Store.log("mm_locked",{m:mi,c:ci});toast("🔒 هذا المفهوم يُفتح تلقائيًا عندما تنهي ما قبله.");return}
    Store.log("mm_click",{m:mi,c:ci});SS.set("mm:last",k)}));
  map.querySelectorAll("a.mn").forEach(a=>a.addEventListener("click",e=>{const mi=+a.dataset.m;
    if(a.classList.contains("locked")){e.preventDefault();toast("🔒 هذا الموديول يُفتح تلقائيًا بعد إنهاء الموديول السابق.");return}
    Store.log("mm_module",{m:mi})}));
}
/* تكبير/تصغير الخريطة لتملأ المساحة المتاحة دون تمرير */
function scale(){
  if(mode!="wide"){stage.classList.remove("scroll");map.style.transform="";stage.querySelector(".sz").removeAttribute("style");return}
  const cw=stage.clientWidth,ch=stage.clientHeight;let s=Math.min(cw/W,ch/H,1.3);
  stage.classList.toggle("scroll",s<.6);s=Math.max(s,.6);
  map.style.transform=`scale(${s})`;
  stage.querySelector(".sz").style.cssText=`width:${W*s}px;height:${H*s}px`;
}
addEventListener("resize",()=>{const w=!matchMedia("(max-width:900px)").matches?"wide":"list";w!=mode?render():scale()});
addEventListener("pageshow",e=>{if(e.persisted)render()});
document.fonts&&document.fonts.ready.then(scale);
onStudent(()=>{render();
const l=map.querySelector(".lf.last");if(l&&mode=="list")l.scrollIntoView({block:"center"})});
})();
