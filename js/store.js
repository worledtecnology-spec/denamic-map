/* طبقة البيانات المشتركة: حساب التلميذ + تقدمه + سجل نشاطه، وواجهة الباحثة.
   ─ عند ضبط APP_CONFIG.FIREBASE: ‏Firebase Auth + Firestore (تراها الباحثة من researcher.html على أي جهاز).
   ─ بدون FIREBASE: وضع محلي للتجربة فقط (localStorage على هذا الجهاز).
   بنية Firestore:
     admins/{uid}                          حساب الباحثة (يُنشأ يدويًا من لوحة Firebase)
     students/{uid}                        {name, code, group, style, createdAt, lastSeen, pct, modsDone}
     students/{uid}/modules/{moduleId}     تقدم الموديول وإجابات الاختبارات والأنشطة والتقويم الذاتي
     students/{uid}/events/{auto}          سجل النشاط (فتح عنصر، إنهاء عنصر، إجابة، نتيجة…) بتوقيته */
const Store=(()=>{
  const C=window.APP_CONFIG,FB=!!(C.FIREBASE&&C.FIREBASE.apiKey);
  const GROUP=C.MINDMAP_PATTERN=="static"?"static":"interactive";
  const DOMAIN=C.STUDENT_EMAIL_DOMAIN||"students.zu-elearning.app";
  const SDK=n=>`https://www.gstatic.com/firebasejs/10.12.2/firebase-${n}-compat.js`;
  const L={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
    set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
  const clean=o=>JSON.parse(JSON.stringify(o));               // Firestore يرفض القيم undefined
  const blank=()=>({max:0,pct:0,pre:{a:{}},post:{a:{}},acts:{},self:{},ex:{}});
  const emailOf=code=>`${String(code).trim().toLowerCase()}@${DOMAIN}`;
  const fail=m=>{const e=new Error(m);e.user=true;return e};
  let me=null,mods={},db=null,auth=null,readyP=null;

  const load=src=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>no(fail("تعذّر الاتصال بالخادم. تأكد من الإنترنت."));document.head.append(s)});
  async function boot(){
    if(!window.firebase){await load(SDK("app"));await Promise.all([load(SDK("auth")),load(SDK("firestore"))])}
    if(!db){if(!firebase.apps.length)firebase.initializeApp(C.FIREBASE);auth=firebase.auth();db=firebase.firestore();
      try{await db.enablePersistence({synchronizeTabs:true})}catch(e){}}
  }
  const authUser=()=>new Promise(r=>{const un=auth.onAuthStateChanged(u=>{un();r(u)})});
  const stRef=uid=>db.collection("students").doc(uid);

  /* ───── التلميذ ───── */
  async function loadMe(u){
    const d=await stRef(u.uid).get();me=d.exists?{uid:u.uid,...d.data()}:null;mods={};
    if(me){(await stRef(u.uid).collection("modules").get()).forEach(x=>mods[x.id]=x.data())}
  }
  function ready(){return readyP||(readyP=(async()=>{
    if(!FB){me=L.get("lms:me",null);mods={}}
    else{await boot();const u=await authUser();if(u)await loadMe(u)}
    // حساب مجموعة أخرى (نفس النطاق) لا يُقبل في هذه البيئة
    if(me&&me.group&&me.group!=GROUP){if(FB)await auth.signOut();else L.del("lms:me");me=null;mods={}}
    return me;
  })())}
  async function login(code,pw,name){
    code=String(code||"").trim();if(!code)throw fail("اكتب الكود الخاص بك.");
    if(!FB){
      const reg=L.get("lms:students",{});let s=reg[code];
      if(!s){if(!String(name||"").trim())throw fail("اكتب اسمك.");s={code,name:name.trim(),group:GROUP,style:"",createdAt:Date.now()};reg[code]=s;L.set("lms:students",reg)}
      if(s.group&&s.group!=GROUP)throw fail(wrongGroup(s.group));
      me={...s,uid:code};L.set("lms:me",me);mods={};log("login");touch();return me;
    }
    await ready();
    try{await auth.signInWithEmailAndPassword(emailOf(code),pw||"")}catch(e){throw fail(e.code=="auth/network-request-failed"?"تعذّر الاتصال. تأكد من الإنترنت.":"الكود أو كلمة المرور غير صحيحة.")}
    await loadMe(auth.currentUser);
    if(!me){await auth.signOut();throw fail("هذا الحساب ليس حساب تلميذ.")}
    if(me.group&&me.group!=GROUP){const g=me.group;me=null;await auth.signOut();throw fail(wrongGroup(g))}
    log("login");touch();return me;
  }
  const wrongGroup=g=>`هذا الحساب مخصص لبيئة ${g=="static"?"الخريطة الذهنية الساكنة":"الخريطة الذهنية التفاعلية"}. اطلب الرابط الصحيح من الباحثة.`;
  async function logout(){log("logout");if(FB&&auth)await auth.signOut();else L.del("lms:me");me=null;mods={}}
  function mod(id){if(!FB&&me&&!mods[id])mods[id]=L.get(`lms:mod:${me.code}:${id}`,null)||blank();return mods[id]||(mods[id]=blank())}
  function saveMod(id){
    if(!me)return;const r=mod(id);r.updated=Date.now();
    if(!FB)L.set(`lms:mod:${me.code}:${id}`,r);
    else stRef(me.uid).collection("modules").doc(String(id)).set(clean(r)).catch(e=>console.error(e));
    touch();
  }
  function touch(){
    if(!me)return;const ids=MODULES.map(m=>m.id);
    const pct=Math.round(ids.reduce((a,i)=>a+(mod(i).pct||0),0)/ids.length),modsDone=ids.filter(i=>mod(i).pct>=100).length;
    const p={lastSeen:Date.now(),pct,modsDone};Object.assign(me,p);
    if(!FB){const reg=L.get("lms:students",{});if(reg[me.code]){Object.assign(reg[me.code],p);L.set("lms:students",reg)}L.set("lms:me",me)}
    else stRef(me.uid).update(p).catch(e=>console.error(e));
  }
  function log(type,d={}){
    if(!me)return;const e=clean({t:Date.now(),type,page:document.body.dataset.page||"",...d});
    if(!FB){const k=`lms:ev:${me.code}`,a=L.get(k,[]);a.push(e);L.set(k,a.slice(-5000));return}
    stRef(me.uid).collection("events").add(e).catch(x=>console.error(x));
  }
  if(!FB)addEventListener("storage",e=>{if(e.key=="lms:me"&&me&&!e.newValue)location.reload()});

  /* ───── الباحثة ───── */
  async function adminReady(){
    if(!FB)return{local:true};
    await boot();const u=await authUser();if(!u)return null;
    const a=await db.collection("admins").doc(u.uid).get();return a.exists?{uid:u.uid,email:u.email}:null;
  }
  async function adminLogin(email,pw){
    await boot();
    try{await auth.signInWithEmailAndPassword(String(email).trim(),pw)}catch(e){throw fail("البريد أو كلمة المرور غير صحيحة.")}
    const r=await adminReady();if(!r){await auth.signOut();throw fail("هذا الحساب ليس له صلاحية الباحثة.")}return r;
  }
  async function adminLogout(){if(FB&&auth)await auth.signOut()}
  async function students(){
    if(!FB){
      const reg=L.get("lms:students",{});
      return Object.values(reg).map(s=>{const m={};MODULES.forEach(x=>{const r=L.get(`lms:mod:${s.code}:${x.id}`,null);if(r)m[x.id]=r});return{...s,uid:s.code,mods:m}});
    }
    const q=await db.collection("students").get();
    return Promise.all(q.docs.map(async d=>{const m={};(await d.ref.collection("modules").get()).forEach(x=>m[x.id]=x.data());return{uid:d.id,...d.data(),mods:m}}));
  }
  async function events(uid){
    if(!FB)return L.get(`lms:ev:${uid}`,[]);
    const q=await stRef(uid).collection("events").orderBy("t").get();return q.docs.map(d=>d.data());
  }
  async function createStudent({name,code,pw,group,style}){
    code=String(code||"").trim();name=String(name||"").trim();
    if(!/^[A-Za-z0-9_-]{2,30}$/.test(code))throw fail("الكود: حروف إنجليزية أو أرقام فقط (من 2 إلى 30).");
    if(!name)throw fail("اكتب اسم التلميذ.");
    const doc={name,code,group:group||"interactive",style:style||"",createdAt:Date.now()};
    if(!FB){const reg=L.get("lms:students",{});if(reg[code])throw fail("هذا الكود مستخدم.");reg[code]=doc;L.set("lms:students",reg);return}
    if(String(pw||"").length<6)throw fail("كلمة المرور 6 أحرف أو أرقام على الأقل.");
    const sec=firebase.apps.find(a=>a.name=="sec")||firebase.initializeApp(C.FIREBASE,"sec");
    await sec.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
    let cred;try{cred=await sec.auth().createUserWithEmailAndPassword(emailOf(code),pw)}
    catch(e){throw fail(e.code=="auth/email-already-in-use"?"هذا الكود مستخدم.":"تعذّر إنشاء الحساب: "+(e.message||e.code))}
    await sec.auth().signOut();
    await stRef(cred.user.uid).set(doc);
  }
  async function updateStudent(uid,patch){
    if(!FB){const reg=L.get("lms:students",{});Object.assign(reg[uid],patch);L.set("lms:students",reg);return}
    await stRef(uid).update(clean(patch));
  }
  async function resetStudent(uid){ // مسح التقدم والسجل (للتجربة قبل التطبيق)
    if(!FB){MODULES.forEach(m=>L.del(`lms:mod:${uid}:${m.id}`));L.del(`lms:ev:${uid}`);return}
    for(const c of["modules","events"]){const q=await stRef(uid).collection(c).get();for(const d of q.docs)await d.ref.delete()}
    await stRef(uid).update({pct:0,modsDone:0});
  }
  return{FB,GROUP,ready,login,logout,mod,saveMod,log,get me(){return me},
    adminReady,adminLogin,adminLogout,students,events,createStudent,updateStudent,resetStudent};
})();
