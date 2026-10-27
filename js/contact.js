/* صفحة التواصل: تُرسل الرسالة إلى رقم الواتساب المحدد في الإعدادات */
document.addEventListener("DOMContentLoaded",()=>{
  const num=String(APP_CONFIG.WHATSAPP_NUMBER||"").replace(/\D/g,"");
  const wa=t=>`https://wa.me/${num}${t?"?text="+encodeURIComponent(t):""}`;
  const f=document.getElementById("cf"),m=document.getElementById("st"),d=document.getElementById("wadirect");
  d.href=wa("السلام عليكم، أنا أستخدم بيئة تعلم المفاهيم التكنولوجية ولدي استفسار.");
  d.onclick=()=>Store.log("contact_whatsapp",{via:"direct"});
  Store.ready().then(me=>{if(me&&!f.name.value){f.name.value=me.name;f.name.readOnly=true}}).catch(()=>{});
  f.onsubmit=e=>{e.preventDefault();
    const name=f.name.value.trim(),msg=f.message.value.trim(),sub=f.subject.value;
    if(!name||msg.length<3){m.className="msg no";m.textContent="اكتب اسمك ونص الرسالة أولًا.";return}
    const me=Store.me;
    const text=`السلام عليكم\nالاسم: ${name}${me?`\nاسم المستخدم: ${me.code}`:""}\nالموضوع: ${sub}\n\n${msg}\n\n— من بيئة تعلم المفاهيم التكنولوجية`;
    Store.log("contact_whatsapp",{via:"form",subject:sub});
    window.open(wa(text),"_blank","noopener");
    m.className="msg ok";m.textContent="✔ تم فتح واتساب، اضغط «إرسال» هناك لإرسال رسالتك.";f.message.value=""};
});
