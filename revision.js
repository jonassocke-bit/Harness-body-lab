
const REV_UI_KEY="bodylab_v277_revision_ui";
const REV_MARK_KEY="bodylab_v277_revision_marks";

let bridge=null;
let revisionMode=false;
let uiConfig={};
let marks=[];

try{uiConfig=JSON.parse(localStorage.getItem(REV_UI_KEY)||"{}")||{}}catch(e){uiConfig={}}
try{marks=JSON.parse(localStorage.getItem(REV_MARK_KEY)||"[]")||[]}catch(e){marks=[]}

function save(){
 try{
  localStorage.setItem(REV_UI_KEY,JSON.stringify(uiConfig));
  localStorage.setItem(REV_MARK_KEY,JSON.stringify(marks));
 }catch(e){}
}
function defaultTier(id){
 return ["gender","age","weight","muscle","height","proportions","breastSize","breastFirmness"].indexOf(id)>=0?"main":"advanced";
}
function metricFor(id,q){
 const m=bridge.getMetrics()||{};
 if(id==="weight" && m.weightKg)return m.weightKg.toFixed(1)+" kg";
 if(id==="height" && m.heightCm)return m.heightCm.toFixed(1)+" cm";
 if(id==="age" && m.ageYears)return Math.round(m.ageYears)+" Jahre";
 if(q.target && m.measures && m.measures[q.target])return m.measures[q.target].toFixed(1)+" cm";
 const cv=bridge.controlValue(id);
 return cv ? [cv.technical,cv.real].filter(Boolean).join(" · ") : "";
}
function defaultUnit(id,q){
 if(id==="weight")return "kg";
 if(id==="height")return "cm";
 if(id==="age")return "Jahre";
 const rulers=bridge.getMeasureRulers()||{};
 if(q.target && rulers[q.target])return "cm";
 return "";
}
function ensureTargets(){
 let main=document.getElementById("mainExtraSection");
 if(!main){
  const basic=document.querySelector(".basicPanel");
  main=document.createElement("div");
  main.id="mainExtraSection";main.className="promotedSection hidden";
  main.innerHTML='<div class="sectionLabel">WEITERE HAUPTPARAMETER</div><div id="mainExtraControls" class="basicPanel"></div>';
  basic.parentNode.insertBefore(main,basic.nextSibling);
 }
 let fine=document.getElementById("fineSection");
 if(!fine){
  fine=document.createElement("details");fine.id="fineSection";fine.className="fineSection hidden";fine.open=true;
  fine.innerHTML='<summary><span>Feinanpassung</span><b id="fineCount">0</b></summary><div id="fineControls" class="basicPanel"></div>';
  main.parentNode.insertBefore(fine,main.nextSibling);
 }
}
function attachEditor(id,q){
 if(q.wrap.querySelector(".inlineRevision"))return;
 const box=document.createElement("div");
 box.className="inlineRevision";
 box.innerHTML=
  '<div class="irTwo">'+
   '<label>Anzeige<select class="irTier"><option value="main">Hauptansicht</option><option value="fine">Feinanpassung</option><option value="advanced">Advanced</option></select></label>'+
   '<label>Anzeigename<input class="irLabel" type="text"></label>'+
  '</div>'+
  '<div class="irTwo">'+
   '<label>Referenzwert<input class="irReference" type="text" inputmode="decimal"></label>'+
   '<label>Einheit<input class="irUnit" type="text"></label>'+
  '</div>'+
  '<label>Notiz<textarea class="irNote" placeholder="Warum wichtig? Wo wird es unrealistisch?"></textarea></label>'+
  '<div class="irAuto">Aktueller Wert: –</div>'+
  '<div class="irBtns"><button class="irSaveUI" type="button">UI speichern</button><button class="irSaveMark" type="button">Marke speichern</button></div>';
 q.wrap.appendChild(box);

 const cfg=uiConfig[id]||{};
 box.querySelector(".irTier").value=cfg.tier||defaultTier(id);
 box.querySelector(".irLabel").value=cfg.label||q.labelEl.textContent;
 box.querySelector(".irUnit").value=(cfg.unit!==undefined)?cfg.unit:defaultUnit(id,q);
 box.querySelector(".irNote").value=cfg.note||"";

 box.querySelector(".irSaveUI").addEventListener("click",function(){
  uiConfig[id]={
   tier:box.querySelector(".irTier").value,
   label:box.querySelector(".irLabel").value.trim()||q.labelEl.textContent,
   unit:box.querySelector(".irUnit").value.trim(),
   note:box.querySelector(".irNote").value.trim()
  };
  q.labelEl.textContent=uiConfig[id].label;
  save();
  applyLayout();
  refresh();
 });
 box.querySelector(".irSaveMark").addEventListener("click",function(){
  let ref=box.querySelector(".irReference").value.trim();
  if(!ref){
   ref=metricFor(id,q).replace(/[^\d.,-]/g,"");
  }
  if(!ref){alert("Bitte Referenzwert eingeben.");return}
  marks.push({
   id:id,
   label:box.querySelector(".irLabel").value.trim()||q.labelEl.textContent,
   reference:ref,
   unit:box.querySelector(".irUnit").value.trim(),
   autoValue:metricFor(id,q),
   note:box.querySelector(".irNote").value.trim(),
   capturedAt:new Date().toISOString(),
   state:bridge.getState(),
   control:bridge.controlValue(id)
  });
  save();
  box.querySelector(".irReference").value="";
  box.querySelector(".irAuto").textContent="Marke gespeichert · "+metricFor(id,q);
 });
}
function refresh(){
 bridge.getControls().forEach(function(q,id){
  const box=q.wrap.querySelector(".inlineRevision");
  if(!box)return;
  const cfg=uiConfig[id]||{};
  if(cfg.label && document.activeElement!==box.querySelector(".irLabel"))box.querySelector(".irLabel").value=cfg.label;
  box.querySelector(".irAuto").textContent="Aktueller Wert: "+metricFor(id,q);
 });
}
function applyLayout(){
 ensureTargets();
 const controls=bridge.getControls();
 const main=[],fine=[],adv=[];
 controls.forEach(function(q,id){
  if(q.homeParent && q.homeParent.id==="coreControls")return;
  const tier=(uiConfig[id]&&uiConfig[id].tier)||defaultTier(id);
  if(tier==="main")main.push(q);
  else if(tier==="fine")fine.push(q);
  else adv.push(q);
 });
 const mainHost=document.getElementById("mainExtraControls");
 const fineHost=document.getElementById("fineControls");
 main.forEach(q=>mainHost.appendChild(q.wrap));
 fine.forEach(q=>fineHost.appendChild(q.wrap));
 adv.forEach(q=>q.homeParent.appendChild(q.wrap));
 document.getElementById("mainExtraSection").classList.toggle("hidden",main.length===0);
 document.getElementById("fineSection").classList.toggle("hidden",fine.length===0);
 document.getElementById("fineCount").textContent=String(fine.length);
}
function setMode(on){
 revisionMode=!!on;
 document.body.classList.toggle("revisionMode",revisionMode);
 const b=document.getElementById("revOpenBtn");
 if(b){
  b.classList.toggle("active",revisionMode);
  b.textContent=revisionMode?"Revision ✓":"Revision";
 }
 if(revisionMode)refresh();
}
function exportRevision(){
 const payload={
  build:"BODY LAB v2.7.7",
  exportedAt:new Date().toISOString(),
  ui:uiConfig,
  marks:marks
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const u=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=u;a.download="Body-Lab-v2.7.7-REVISION.json";a.click();
 setTimeout(()=>URL.revokeObjectURL(u),1200);
}
function init(){
 bridge=window.BodyLabBridge;
 if(!bridge)return;
 ensureTargets();
 bridge.getControls().forEach(function(q,id){attachEditor(id,q)});
 applyLayout();

 const button=document.getElementById("revOpenBtn");
 if(button){
  button.addEventListener("click",function(){setMode(!revisionMode)});
  // long press / context menu exports revision data without another permanent UI button
  button.addEventListener("contextmenu",function(e){e.preventDefault();exportRevision()});
 }
 setInterval(function(){if(revisionMode)refresh()},500);
}
if(window.BodyLabBridge)init();
else window.addEventListener("bodylab-ready",init,{once:true});
