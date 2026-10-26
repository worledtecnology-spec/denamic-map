/* صفحة المحتوى: ثمانية كروت بنسبة إنجاز كل موديول، والموديول التالي يفتح تلقائيًا عند إنهاء السابق */
document.addEventListener("DOMContentLoaded",()=>onStudent(()=>{
  const g=document.getElementById("cards");
  function draw(){g.innerHTML=MODULES.map(m=>{const st=modStatus(m),op=modOpen(m.id);
    const s=!op?0:st.done?3:st.started?2:1,lab=["مقفل","متاح","قيد الدراسة","مكتمل"][s],cls=["locked","","cur","done"][s];
    return `<article class="card ${op?"":"is-locked"}" style="--c:${m.color}"><span class="n">${m.id}</span><div class="em" aria-hidden="true">${op?m.emoji:"🔒"}</div>
    <small>الموديول ${ORD[m.id-1]}</small><h3>${m.title}</h3>
    <div class="mprog" aria-label="نسبة الإنجاز ${st.pct}%"><span class="pbar"><i style="width:${st.pct}%"></i></span><b>${st.pct}%</b></div>
    <span class="badge ${cls}">${lab}</span>
    ${op?`<button class="btn" data-id="${m.id}">${st.done?"مراجعة الموديول":st.started?"أكمل من حيث توقفت":"ابدأ الموديول"}</button>`
      :`<p class="why">🔒 يُفتح تلقائيًا بعد إنهاء الموديول ${ORD[m.id-2]}</p>`}</article>`}).join("");
    g.querySelectorAll("button[data-id]").forEach(b=>b.onclick=()=>{const id=+b.dataset.id,go=()=>location.href=`module-${id}.html`;
      isUnlocked(id)?go():askPassword(id,go)})}
  draw();
}));
