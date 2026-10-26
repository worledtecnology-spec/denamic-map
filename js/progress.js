/* تسلسل عناصر الموديول (مصدر واحد تستخدمه صفحة الموديول والمحتوى والخريطة الذهنية ولوحة الباحثة).
   التقدم يُحفظ كرقم max = عدد العناصر المنجزة بالترتيب؛ العنصر g متاح إذا g <= max، ومكتمل إذا g < max. */
const ORD=["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر"];
const KIND_LBL={rationale:"مبررات الدراسة",goals:"الأهداف",xintro:"مقدمة الاختبار",q:"سؤال",result:"نتيجة الاختبار",intro:"مقدمة المحتوى",
  about:"تمهيد المفهوم",def:"تعريف المفهوم",ex:"أمثلة المفهوم",mind:"خريطة المفهوم",act:"النشاط",self:"التقويم الذاتي"};
const SEC_LBL={rationale:"المبررات",goals:"الأهداف",pre:"الاختبار القبلي",content:"المحتوى",post:"الاختبار البعدي"};
const _OUT={};
function outline(M){
  if(_OUT[M.id])return _OUT[M.id];
  const a=[],add=(k,kind,x={})=>a.push({k,kind,...x}),nq=M.pre.tf.length+M.pre.mcq.length;
  const exam=k=>{add(k,"xintro",{q:-1});for(let q=0;q<nq;q++)add(k,"q",{q});add(k,"result",{q:nq})};
  exam("pre");add("rationale","rationale");add("goals","goals");   // الاختبار القبلي أولًا ثم المحتوى
  add("content","intro",{c:-1});let n=0;
  M.concepts.forEach((c,ci)=>{["about","def","ex","mind"].forEach(k=>add("content",k,{c:ci}));if(c.act)add("content","act",{c:ci,an:n++});add("content","self",{c:ci})});
  exam("post");
  const cnt={};a.forEach((s,g)=>{s.g=g;s.i=cnt[s.k]=(cnt[s.k]??-1)+1});
  return _OUT[M.id]=a;
}
function modStatus(M,rec){
  const N=outline(M).length,r=rec||Store.mod(M.id),max=Math.min(r.max||0,N);
  return{N,max,pct:Math.round(max/N*100),done:max>=N,started:max>0};
}
/* فتح الموديولات بالتسلسل: الموديول التالي يفتح تلقائيًا عند إنهاء السابق */
function modOpen(id,recOf){
  if(!APP_CONFIG.SEQUENTIAL_MODULES||id==1)return true;
  const P=MODULES[id-2];return modStatus(P,recOf?recOf(P.id):null).done;
}
const conceptG=(M,ci,kind="about")=>outline(M).find(s=>s.c===ci&&s.kind==kind).g;
function describe(M,s){return `${SEC_LBL[s.k]} • ${s.c!=null&&s.c>-1?M.concepts[s.c].name+" • ":""}${KIND_LBL[s.kind]}${s.kind=="q"?" "+(s.q+1):""}`}
