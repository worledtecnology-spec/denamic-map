/* صفحة دخول التلميذ: اسم المستخدم + كلمة المرور، ثم الانتقال إلى الصفحة المطلوبة */
(function(){
const next=(()=>{const n=new URLSearchParams(location.search).get("next")||"";return /^[\w-]+\.html([?#][\w=&%#/.-]*)?$/.test(n)?n:"content.html"})();
const f=document.getElementById("lf"),m=document.getElementById("lmsg");
if(!Store.FB){document.getElementById("nmrow").hidden=false;document.getElementById("pwrow").hidden=true;document.getElementById("localnote").hidden=false}
Store.ready().then(me=>{if(me)location.replace(next)}).catch(()=>{m.textContent="تعذّر الاتصال بالخادم. تأكد من الإنترنت ثم حدّث الصفحة."});
f.user.focus();
document.getElementById("eye").onclick=e=>{const p=f.pw,show=p.type=="password";p.type=show?"text":"password";e.currentTarget.textContent=show?"🙈":"👁️";e.currentTarget.setAttribute("aria-label",show?"إخفاء كلمة المرور":"إظهار كلمة المرور")};
f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector("button[type=submit]");
  if(!f.user.value.trim()){m.textContent="اكتب اسم المستخدم.";f.user.focus();return}
  if(Store.FB&&!f.pw.value){m.textContent="اكتب كلمة المرور.";f.pw.focus();return}
  m.textContent="";b.disabled=true;b.textContent="جارٍ الدخول…";
  try{await Store.login(f.user.value,f.pw.value,f.nm.value);location.replace(next)}
  catch(x){m.textContent=x.user?x.message.replace("الكود","اسم المستخدم"):"حدث خطأ غير متوقع. حاول مرة أخرى.";console.error(x);b.disabled=false;b.textContent="دخول"}};
})();
