/* الشريطان الثابتان + دخول التلميذ + نافذة كلمة مرور الموديول. يُحمَّل في كل صفحة. */
const C=window.APP_CONFIG;
const NAV=[["index","index.html","🏠","الرئيسية"],["content","content.html","📖","المحتوى التعليمي"],["mindmap","mindmap.html","🧠","الخريطة الذهنية"],["guide","guide.html","🧭","دليل التعلم"],["contact","contact.html","💬","التواصل"]];
const PAGE=()=>document.body.dataset.page||"";
const NEEDS_LOGIN=["content","mindmap"];   // صفحات الموديولات تحمل data-page="content"
function logo(src,alt){return `<img src="assets/img/${src}" alt="${alt}" onerror="this.outerHTML='<span class=logo-ph>${alt}</span>'">`}
function esc(t){return String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function buildChrome(){
  const page=PAGE(),home=page=="index";
  if(page=="login"){document.getElementById("chrome").remove();return}   // صفحة الدخول بتصميم مستقل   // شعارا الجامعة والكلية في الصفحة الرئيسية فقط
  document.getElementById("chrome").innerHTML=`
  <div class="bar1 ${home?"":"nologo"}">${home?logo("zagazig-logo.png","شعار جامعة الزقازيق"):""}
   <div class="t">بيئة تعلم إلكتروني لتنمية المفاهيم التكنولوجية والدافعية للتعلم لدى تلاميذ المرحلة الابتدائية ذوي صعوبات التعلم</div>
   ${home?logo("faculty-logo.png","شعار كلية التربية النوعية"):""}</div>
  <button class="menu-btn" aria-expanded="false">☰ القائمة</button>
  <nav class="bar2" aria-label="التنقل الرئيسي">${NAV.map(n=>`<a href="${n[1]}" class="${n[0]==page?"on":""}"><span class="ic">${n[2]}</span>${n[3]}</a>`).join("")}<span id="who"></span></nav>`;
  const setH=()=>document.documentElement.style.setProperty("--chrome-h",document.getElementById("chrome").offsetHeight+"px");
  const b=document.querySelector(".menu-btn"),nav=document.querySelector(".bar2");
  b.onclick=()=>{b.setAttribute("aria-expanded",nav.classList.toggle("open"));setH()};
  setH();addEventListener("resize",setH);
}
function drawWho(){
  const w=document.getElementById("who");if(!w)return;const me=Store.me;
  w.innerHTML=me?`<span class="who">👤 ${esc(me.name)}</span><button class="out" id="logout">خروج</button>`:`<a class="inlink" href="login.html">🔑 تسجيل الدخول</a>`;
  if(me)document.getElementById("logout").onclick=async()=>{await Store.logout();location.href="index.html"};
}

/* ───── دخول التلميذ ───── */
const _wait=[];
function onStudent(fn){Store.ready().then(me=>me?fn(me):_wait.push(fn))}
function toLogin(){const here=location.pathname.split("/").pop()||"index.html";location.replace("login.html?next="+encodeURIComponent(here+location.search+location.hash))}
function toast(t){let e=document.getElementById("toast");if(!e){e=document.createElement("div");e.id="toast";e.setAttribute("role","status");document.body.append(e)}
  e.textContent=t;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),2600)}

/* ───── قفل الموديول بكلمة مرور (اختياري، يتطلب خدمة تحقق) ───── */
const isUnlocked=id=>!MODULES[id-1].locked||sessionStorage.getItem("unlocked:"+id)==="1";
async function verifyAccess(id,pw){
  if(C.ACCESS_ENDPOINT){
    try{const r=await fetch(C.ACCESS_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({module:id,password:pw})});
      const d=await r.json();return d.ok?{ok:true}:{ok:false,msg:"كلمة المرور غير صحيحة. حاول مرة أخرى."};
    }catch(e){return{ok:false,msg:"تعذّر الاتصال. تأكد من الإنترنت وحاول مرة أخرى."}}}
  if(C.DEV_BYPASS)return{ok:true};
  return{ok:false,msg:"لم يتم إعداد خدمة التحقق بعد. اطلب المساعدة من الباحثة."};
}
function askPassword(id,onOk,onCancel){
  if(!C.MODULE_PASSWORDS){sessionStorage.setItem("unlocked:"+id,"1");onOk();return}
  let d=document.getElementById("pw");if(d)d.remove();
  d=document.createElement("dialog");d.id="pw";
  d.innerHTML=`<h3>🔒 الموديول ${id} مغلق</h3><p>اكتب كلمة المرور لفتح الموديول.</p>
   ${C.DEV_BYPASS&&!C.ACCESS_ENDPOINT?'<p class="placeholder">وضع التطوير: اضغط «فتح» دون كتابة كلمة مرور.</p>':""}
   <input type="password" aria-label="كلمة المرور" autocomplete="off"><div class="msg" role="alert"></div>
   <button class="btn" id="go">فتح</button> <button class="btn alt" id="x">إلغاء</button>`;
  document.body.append(d);d.showModal();
  const inp=d.querySelector("input"),msg=d.querySelector(".msg");
  d.querySelector("#go").onclick=async()=>{msg.textContent="جارٍ التحقق…";
    const r=await verifyAccess(id,inp.value);
    if(r.ok){sessionStorage.setItem("unlocked:"+id,"1");d.close();onOk()}else msg.textContent=r.msg};
  d.querySelector("#x").onclick=()=>{d.close();onCancel&&onCancel()};
}
document.addEventListener("DOMContentLoaded",()=>{
  buildChrome();
  if(PAGE()=="researcher"||PAGE()=="login")return;
  Store.ready().then(me=>{drawWho();if(me)Store.log("page",{name:PAGE()=="content"&&window.MODULE_ID?"module-"+window.MODULE_ID:PAGE()});
    else if(NEEDS_LOGIN.includes(PAGE()))toLogin()})
   .catch(e=>{console.error(e);toast("تعذّر الاتصال بالخادم. تأكد من الإنترنت ثم حدّث الصفحة.")});
});
