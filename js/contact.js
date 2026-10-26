/* نموذج التواصل: تحقق من الحقول ثم إرسال إلى CONTACT_ENDPOINT عند توفره */
document.addEventListener("DOMContentLoaded",()=>{
  const f=document.getElementById("cf"),m=document.getElementById("st");
  f.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));
    if(!d.name.trim()||!d.subject.trim()||d.message.trim().length<5){m.className="msg no";m.textContent="أكمل الاسم والموضوع، واكتب رسالة من 5 أحرف على الأقل.";return}
    if(!APP_CONFIG.CONTACT_ENDPOINT){m.className="msg no";m.textContent="خدمة استقبال الرسائل لم تُفعَّل بعد.";return}
    try{const r=await fetch(APP_CONFIG.CONTACT_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});
      if(!r.ok)throw 0;m.className="msg ok";m.textContent="تم إرسال رسالتك. شكرًا لك!";f.reset()}
    catch(_){m.className="msg no";m.textContent="تعذّر الإرسال. حاول مرة أخرى بعد قليل."}};
});
