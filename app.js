import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GROUPS } from "./modifier-config.js";
import { DIRECT } from "./body-morphs.js";
import { EXACT_META, EXACT_CHUNKS } from "./exact-macro-meta.js";
import { GROUP_LABELS } from "./labels.js";
import { FACE_GROUPS } from "./face-config.js";
import { FACE } from "./face-morphs.js";
import { RIG } from "./rig-data.js";
import { MACRO_TEXT_MANIFEST } from "./macro-text-manifest.js";


function base64ToBytes(s){
 const bin=atob(s),out=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
 return out;
}
async function fetchBinaryMaybeChunked(url){
 const filename=url.split("/").pop(),info=MACRO_TEXT_MANIFEST[filename];
 if(!info){
  const r=await fetch(url,{cache:"force-cache"});
  if(!r.ok)throw new Error(url);
  return await r.arrayBuffer();
 }
 const out=new Uint8Array(info.size);let off=0;
 for(const encoded of info.parts){
  const bytes=base64ToBytes(encoded);out.set(bytes,off);off+=bytes.length;
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 return out.buffer;
}

const N=13380;
let exactChunks=[];
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.01,100);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
document.querySelector("#viewport").appendChild(renderer.domElement);

const orbit=new OrbitControls(camera,renderer.domElement);
orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.enablePan=true;orbit.screenSpacePanning=true;
orbit.touches.ONE=THREE.TOUCH.ROTATE;orbit.touches.TWO=THREE.TOUCH.DOLLY_PAN;orbit.minDistance=.65;orbit.maxDistance=35;
scene.add(new THREE.HemisphereLight(0xffffff,0x25252a,1.8));
let L=new THREE.DirectionalLight(0xffffff,2.5);L.position.set(3,4,4);scene.add(L);
L=new THREE.DirectionalLight(0xffffff,.9);L.position.set(-3,2,3);scene.add(L);
L=new THREE.DirectionalLight(0xffffff,1.0);L.position.set(-2,3,-4);scene.add(L);

const floor=new THREE.Mesh(new THREE.CircleGeometry(1.2,64),new THREE.MeshStandardMaterial({color:0x171719,roughness:1,transparent:true,opacity:.45}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);

const state={
 gender:.5,age:.5,weight:.5,muscle:.5,height:.5,proportions:.5,breastSize:.5,breastFirmness:.5,
 caucasian:1/3,asian:1/3,african:1/3
};
const directState={};
const faceState={};
const ui=new Map();

function humanize(s){
 return s.replace(/^measure-/,"").replace(/-/g," ").replace(/\br\b/,"R").replace(/\bl\b/,"L")
  .replace(/\b\w/g,m=>m.toUpperCase());
}
function fmt(v){return (v>0?"+":"")+Math.round(v*100)}
function makeControl(parent,id,label,min,max,value,handler,display=v=>fmt(v),opts={}){
 const wrap=document.createElement("div");
 wrap.className="controlWrap";
 wrap.dataset.search=label.toLowerCase();

 const row=document.createElement("div");
 row.className="control";
 const lab=document.createElement("label");
 lab.textContent=label;
 lab.title=label;

 const inp=document.createElement("input");
 inp.type="range";
 inp.min=min; inp.max=max; inp.step=.01; inp.value=value;

 const out=document.createElement("button");
 out.type="button";
 out.className="valueBtn";
 out.textContent=display(value);
 out.title=opts.overdrive ? "Antippen: Min/Max ändern" : "Wert";

 row.append(lab,inp,out);
 wrap.append(row);

 let rangeEditor=null;
 let minPct=min*100, maxPct=max*100;

 if(opts.overdrive){
   rangeEditor=document.createElement("div");
   rangeEditor.className="rangeEditor hidden";
   rangeEditor.innerHTML=`
     <label>Min % <input class="minPct" type="number" step="10" value="${Math.round(minPct)}"></label>
     <label>Max % <input class="maxPct" type="number" step="10" value="${Math.round(maxPct)}"></label>
     <button type="button" class="rangeDone">OK</button>
   `;
   wrap.append(rangeEditor);

   const minEl=rangeEditor.querySelector(".minPct");
   const maxEl=rangeEditor.querySelector(".maxPct");

   const applyRange=()=>{
     let mn=Number(minEl.value), mx=Number(maxEl.value);
     if(!Number.isFinite(mn)) mn=-100;
     if(!Number.isFinite(mx)) mx=100;
     if(mn>=mx) mx=mn+10;

     // practical guardrail: still allows strong overdrive without accidental absurd values
     mn=Math.max(-500,Math.min(0,mn));
     mx=Math.max(0,Math.min(500,mx));

     minEl.value=Math.round(mn);
     maxEl.value=Math.round(mx);

     inp.min=mn/100;
     inp.max=mx/100;

     // Preserve current value if possible; clamp only if now outside new range.
     let v=Number(inp.value);
     v=Math.max(Number(inp.min),Math.min(Number(inp.max),v));
     inp.value=v;
     handler(v);
     out.textContent=display(v);
   };

   out.addEventListener("click",()=>{
     rangeEditor.classList.toggle("hidden");
     if(!rangeEditor.classList.contains("hidden")){
       minEl.focus();
     }
   });
   rangeEditor.querySelector(".rangeDone").addEventListener("click",()=>{
     applyRange();
     rangeEditor.classList.add("hidden");
   });
   minEl.addEventListener("change",applyRange);
   maxEl.addEventListener("change",applyRange);
 } else {
   out.disabled=true;
 }

 inp.addEventListener("input",()=>{
   const v=+inp.value;
   out.textContent=display(v);
   row.classList.toggle("active",Math.abs(v-(min===0?0:(min+max)/2))>.01);
   handler(v);
 });

 parent.append(wrap);
 ui.set(id,{
   inp,out,row,wrap,display,default:value,
   defaultMin:min,defaultMax:max,
   rangeEditor
 });
}

const core=document.querySelector("#coreControls");
makeControl(core,"gender","Female ↔ Male",0,1,.5,v=>{state.gender=v;updateBody()},v=>Math.round(v*100),{overdrive:true,rangeMode:"macro"});
makeControl(core,"age","Age",0,1,.5,v=>{state.age=v;updateBody()},v=>Math.round(1 + v*89),{overdrive:false});
makeControl(core,"weight","Weight",0,1,.5,v=>{state.weight=v;updateBody()},v=>Math.round(v*100),{overdrive:true,rangeMode:"macro"});
makeControl(core,"muscle","Muscle",0,1,.5,v=>{state.muscle=v;updateBody()},v=>Math.round(v*100),{overdrive:true,rangeMode:"macro"});
makeControl(core,"height","Height",0,1,.5,v=>{state.height=v;updateBody()},v=>Math.round(v*100),{overdrive:true,rangeMode:"macro"});
makeControl(core,"proportions","Body proportions",0,1,.5,v=>{state.proportions=v;updateBody()},v=>Math.round(v*100),{overdrive:true,rangeMode:"macro"});
makeControl(core,"breastSize","Breast size",0,1,.5,v=>{state.breastSize=v;updateBody()},v=>Math.round(v*100),{overdrive:true,rangeMode:"macro"});
makeControl(core,"breastFirmness","Breast firmness",0,1,.5,v=>{state.breastFirmness=v;updateBody()},v=>Math.round(v*100),{overdrive:true,rangeMode:"macro"});

// MakeHuman default ethnicity/population mix is 1/3 each.
// Changing one keeps the three values normalized to sum to 1, matching EthnicModifier behavior.
const popParent=document.querySelector("#populationControls");
let syncingPopulation=false;
function setPopulation(changed,value){
 if(syncingPopulation)return; syncingPopulation=true;
 value=Math.max(0,Math.min(1,value));
 const others=["caucasian","asian","african"].filter(x=>x!==changed);
 const oldOther=state[others[0]]+state[others[1]];
 state[changed]=value;
 const remain=1-value;
 if(oldOther>1e-8){
   state[others[0]]=remain*(state[others[0]]/oldOther);
   state[others[1]]=remain*(state[others[1]]/oldOther);
 }else{state[others[0]]=remain/2;state[others[1]]=remain/2;}
 for(const id of ["caucasian","asian","african"]){const q=ui.get(id);if(q){q.inp.value=state[id];q.out.textContent=Math.round(state[id]*100)}}
 syncingPopulation=false; updateBody();
}
makeControl(popParent,"caucasian","Caucasian",0,1,1/3,v=>setPopulation("caucasian",v),v=>Math.round(v*100));
makeControl(popParent,"asian","Asian",0,1,1/3,v=>setPopulation("asian",v),v=>Math.round(v*100));
makeControl(popParent,"african","African",0,1,1/3,v=>setPopulation("african",v),v=>Math.round(v*100));

// Harness starting presets.
// These are intentionally parameter presets, not extra morphs: each one sets only the
// genuine MakeHuman macro controls above. The user can immediately refine them afterward.
const PRESETS={
  neutral:{gender:.5,age:.5,weight:.5,muscle:.5,height:.5,proportions:.5,breastSize:.5,breastFirmness:.5},
  maleAverage:{gender:1,age:.5,weight:.5,muscle:.5,height:.58,proportions:.5,breastSize:.5,breastFirmness:.5},
  maleSlim:{gender:1,age:.5,weight:.24,muscle:.35,height:.62,proportions:.5,breastSize:.5,breastFirmness:.5},
  maleMuscular:{gender:1,age:.5,weight:.52,muscle:.88,height:.62,proportions:.58,breastSize:.5,breastFirmness:.5},
  femaleAverage:{gender:0,age:.5,weight:.5,muscle:.42,height:.46,proportions:.5,breastSize:.5,breastFirmness:.5},
  femaleCurvy:{gender:0,age:.5,weight:.72,muscle:.30,height:.46,proportions:.48,breastSize:.68,breastFirmness:.42}
};

function setMacroUI(values){
  for(const [id,v] of Object.entries(values)){
    state[id]=v;
    const q=ui.get(id);
    if(q){
      q.inp.value=v;
      q.out.textContent=q.display(v);
      q.row.classList.toggle("active",Math.abs(v-.5)>.01);
    }
  }
}
function applyPreset(name){
  const p=PRESETS[name];if(!p)return;
  // Presets define an Ausgangskörper, so clear advanced offsets first.
  for(const k of Object.keys(directState)) directState[k]=0;
  for(const [id,q] of ui){
    if(id.startsWith("d")){
      q.inp.value=0;q.out.textContent=q.display(0);q.row.classList.remove("active");
    }
  }
  setMacroUI(p);
  state.caucasian=state.asian=state.african=1/3;
  for(const id of ["caucasian","asian","african"]){const q=ui.get(id);if(q){q.inp.value=1/3;q.out.textContent="33"}}
  document.querySelectorAll("#presets button").forEach(b=>b.classList.toggle("active",b.dataset.preset===name));
  updateBody();
}
document.querySelectorAll("#presets button").forEach(b=>b.addEventListener("click",()=>applyPreset(b.dataset.preset)));

const groupsEl=document.querySelector("#groups");
let directCount=0;
for(const g of GROUPS){
 const det=document.createElement("details");det.className="group";det.dataset.group=g.id;
 const sum=document.createElement("summary");
 const title=document.createElement("span");title.textContent=GROUP_LABELS[g.id]||humanize(g.id);
 const cnt=document.createElement("b");cnt.textContent=g.controls.length;
 sum.append(title,cnt);det.append(sum);
 const body=document.createElement("div");body.className="groupbody";det.append(body);
 for(const c of g.controls){
  directState[c.id]=0;directCount++;
  const label=humanize(c.target);
  const min=c.oneWay?0:-1,max=1,def=0;
  makeControl(body,c.id,label,min,max,def,v=>{directState[c.id]=v;updateBody()},v=>fmt(v),{overdrive:true});
 }
 groupsEl.append(det);
}
const faceGroupsEl=document.querySelector("#faceGroups");
let faceCount=0;
for(const g of FACE_GROUPS){
 const det=document.createElement("details");det.className="group faceGroup";
 const sum=document.createElement("summary");
 const title=document.createElement("span");title.textContent=humanize(g.id);
 const cnt=document.createElement("b");cnt.textContent=g.controls.length;
 sum.append(title,cnt);det.append(sum);
 const gb=document.createElement("div");gb.className="groupbody";det.append(gb);
 for(const c of g.controls){
  faceState[c.id]=0;faceCount++;
  const label=humanize(c.target);
  const min=c.oneWay?0:-1,max=1;
  makeControl(gb,c.id,label,min,max,0,v=>{faceState[c.id]=v;updateBody()},v=>fmt(v),{overdrive:true});
 }
 faceGroupsEl.append(det);
}
document.querySelector("#faceCount").textContent=faceCount+" Regler";
document.querySelector("#count").textContent=`${directCount+faceCount+8} MakeHuman-Regler`;

function tri(v){
 // Exact MakeHuman three-state macro factors inside native range.
 return {min:Math.max(0,1-v*2),avg:1-Math.abs(v-.5)*2,max:Math.max(0,v*2-1)};
}
function ageFactors(v){
 // Direct port of Human._setAgeVals() from MakeHuman 1.3.0.
 let baby=0,child=0,young=0,old=0;
 if(v<.5){
   old=0;
   baby=Math.max(0,1-v*5.333);
   young=Math.max(0,(v-.1875)*3.2);
   child=Math.max(0,Math.min(1,5.333*v)-young);
 }else{
   child=0;baby=0;old=Math.max(0,v*2-1);young=1-old;
 }
 return {baby,child,young,old};
}
function factorValues(){
 const mu=tri(state.muscle),we=tri(state.weight),he=tri(state.height),pr=tri(state.proportions),cu=tri(state.breastSize),fi=tri(state.breastFirmness),ag=ageFactors(state.age);
 return {
  male:state.gender,female:1-state.gender,
  baby:ag.baby,child:ag.child,young:ag.young,old:ag.old,
  caucasian:state.caucasian,asian:state.asian,african:state.african,
  minmuscle:mu.min,averagemuscle:mu.avg,maxmuscle:mu.max,
  minweight:we.min,averageweight:we.avg,maxweight:we.max,
  minheight:he.min,averageheight:he.avg,maxheight:he.max,
  uncommonproportions:pr.min,regularproportions:pr.avg,idealproportions:pr.max,
  mincup:cu.min,averagecup:cu.avg,maxcup:cu.max,
  minfirmness:fi.min,averagefirmness:fi.avg,maxfirmness:fi.max
 };
}
function apply(out,flat,a){
 if(!flat||Math.abs(a)<1e-7)return;
 for(let k=0;k<flat.length;k+=4){
  const i=flat[k]*3;out[i]+=flat[k+1]*scaleFactor*a;out[i+1]+=flat[k+2]*scaleFactor*a;out[i+2]-=flat[k+3]*scaleFactor*a;
 }
}
let body=null,base=null,scaleFactor=1;
let rawVertsFull=null,bonesByName=new Map(),skeleton=null,restBoneQuats=new Map();
let geomCenterX=0,geomCenterZ=0,geomMinY=0;
function updateBody(){
 if(!body||!base)return;
 const out=new Float32Array(base);
 const fv=factorValues();

 // Exact MakeHuman macro target-stack principle:
 // target weight = product of every macro-variable token encoded in the target filename/path.
 // This covers macrodetails (gender/age/race), universal (gender/age/muscle/weight),
 // height, body proportions and breast macro targets in one common engine.
 for(const t of EXACT_META){
   let a=1;
   for(const token of t.tokens){a*=fv[token]??1;if(a===0)break;}
   if(!a)continue;
   const data=exactChunks[t.chunk];
   for(let k=t.start,end=t.start+t.length;k<end;k+=4){
     const i=data[k]*3;
     out[i]+=data[k+1]*scaleFactor*a;
     out[i+1]+=data[k+2]*scaleFactor*a;
     out[i+2]-=data[k+3]*scaleFactor*a;
   }
 }

// Every direct MakeHuman body modifier is additive on top.
 for(const [id,v] of Object.entries(directState)){
  if(!v)continue;const d=DIRECT[id];
  if(v<0)apply(out,d.minus,-v);else apply(out,d.plus,v);
 }
 for(const [id,v] of Object.entries(faceState)){
  if(!v)continue;const d=FACE[id];
  if(v<0)apply(out,d.minus,-v);else apply(out,d.plus,v);
 }
 const p=body.geometry.attributes.position;p.array.set(out);p.needsUpdate=true;
 body.geometry.computeVertexNormals();body.geometry.normalizeNormals();body.geometry.computeBoundingSphere();
}
function parseOBJ(text){
 const verts=[],faces=[];
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();if(!line||line[0]==="#")continue;const p=line.split(/\s+/);
  if(p[0]==="v")verts.push([+p[1],+p[2],+p[3]]);
  else if(p[0]==="f"){
   const ids=p.slice(1).map(s=>{let i=parseInt(s.split("/")[0]);if(i<0)i=verts.length+1+i;return i-1});
   if(ids.every(i=>i>=0&&i<N))for(let k=1;k<ids.length-1;k++)faces.push(ids[0],ids[k],ids[k+1]);
  }
 }
 rawVertsFull=verts;
 const pos=new Float32Array(N*3);
 for(let i=0;i<N;i++){pos[i*3]=verts[i][0];pos[i*3+1]=verts[i][1];pos[i*3+2]=-verts[i][2]}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setIndex(faces);g.computeVertexNormals();return g;
}

function jointPoint(jointName){
 const ids=RIG.joints[jointName]||[];
 const p=new THREE.Vector3();
 let count=0;
 for(const vi of ids){
  const v=rawVertsFull?.[vi];if(!v)continue;
  p.x+=v[0];p.y+=v[1];p.z+=-v[2];count++;
 }
 if(count)p.multiplyScalar(1/count);
 p.multiplyScalar(scaleFactor);
 p.x-=geomCenterX;p.y-=geomMinY;p.z-=geomCenterZ;
 return p;
}

function buildSkinning(geo){
 const boneNames=Object.keys(RIG.bones);
 const boneIndex=new Map(boneNames.map((n,i)=>[n,i]));
 bonesByName=new Map();

 // Calculate rest head positions first.
 const heads=new Map();
 for(const n of boneNames)heads.set(n,jointPoint(RIG.bones[n].head));

 for(const n of boneNames){
  const b=new THREE.Bone();b.name=n;bonesByName.set(n,b);
 }
 let rootBone=null;
 for(const n of boneNames){
  const def=RIG.bones[n],b=bonesByName.get(n),head=heads.get(n);
  if(def.parent && bonesByName.has(def.parent)){
    const ph=heads.get(def.parent);
    b.position.copy(head).sub(ph);
    bonesByName.get(def.parent).add(b);
  }else{
    b.position.copy(head);rootBone=b;
  }
 }

 // Top four MakeHuman weights per visible vertex.
 const vw=Array.from({length:N},()=>[]);
 for(const [bn,flat] of Object.entries(RIG.weights)){
  const bi=boneIndex.get(bn);if(bi===undefined)continue;
  for(let k=0;k<flat.length;k+=2){
    const vi=flat[k],w=flat[k+1];
    if(vi<N)vw[vi].push([bi,w]);
  }
 }
 const si=new Uint16Array(N*4),sw=new Float32Array(N*4);
 const rootIndex=boneIndex.get("root")??0;
 for(let vi=0;vi<N;vi++){
  const a=vw[vi].sort((x,y)=>y[1]-x[1]).slice(0,4);
  if(!a.length)a.push([rootIndex,1]);
  let total=a.reduce((s,x)=>s+x[1],0)||1;
  for(let j=0;j<4;j++){
    const q=a[j]||[rootIndex,0];si[vi*4+j]=q[0];sw[vi*4+j]=q[1]/total;
  }
 }
 geo.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(si,4));
 geo.setAttribute("skinWeight",new THREE.Float32BufferAttribute(sw,4));

 skeleton=new THREE.Skeleton(boneNames.map(n=>bonesByName.get(n)));
 body.add(rootBone);
 body.bind(skeleton);
 skeleton.pose();
 restBoneQuats=new Map();
 for(const [n,b] of bonesByName)restBoneQuats.set(n,b.quaternion.clone());
 document.querySelector("#rigStatus").textContent=`${boneNames.length} MakeHuman-Bones · echte Skin-Weights aktiv`;
 document.querySelector("#rigStatus").classList.add("ok");
}

function resetPose(){
 if(!skeleton)return;
 skeleton.pose();
 for(const [n,q] of restBoneQuats){const b=bonesByName.get(n);if(b)b.quaternion.copy(q)}
 skeleton.update();
}
function rot(name,x=0,y=0,z=0){
 const b=bonesByName.get(name);if(!b)return;
 b.rotation.x+=x;b.rotation.y+=y;b.rotation.z+=z;
}
function applyPose(name){
 resetPose();
 if(name==="armsDown"){
   rot("upperarm01.L",0,0,Math.PI*.43);
   rot("upperarm01.R",0,0,-Math.PI*.43);
   rot("lowerarm01.L",0,0,.12);rot("lowerarm01.R",0,0,-.12);
 }else if(name==="armsUp"){
   rot("upperarm01.L",0,0,-Math.PI*.42);
   rot("upperarm01.R",0,0,Math.PI*.42);
 }else if(name==="step"){
   rot("upperleg01.L",.34,0,0);rot("upperleg01.R",-.22,0,0);
   rot("lowerleg01.L",-.25,0,0);rot("upperarm01.L",-.12,0,.18);rot("upperarm01.R",.12,0,-.18);
 }
 if(skeleton)skeleton.update();
 document.querySelectorAll("[data-pose]").forEach(b=>b.classList.toggle("active",b.dataset.pose===name));
}

async function init(){
 exactChunks=await Promise.all(EXACT_CHUNKS.map(async url=>{
   const buf=await fetchBinaryMaybeChunked(url);
   return new Float32Array(buf);
 }));
 const r=await fetch("./base.obj",{cache:"force-cache"});if(!r.ok)throw new Error("base.obj");
 const g=parseOBJ(await r.text());g.computeBoundingBox();let b=g.boundingBox;
 scaleFactor=1.82/(b.max.y-b.min.y);g.scale(scaleFactor,scaleFactor,scaleFactor);g.computeBoundingBox();b=g.boundingBox;
 geomCenterX=(b.min.x+b.max.x)/2;geomCenterZ=(b.min.z+b.max.z)/2;geomMinY=b.min.y;
 g.translate(-geomCenterX,-geomMinY,-geomCenterZ);g.computeBoundingBox();base=new Float32Array(g.attributes.position.array);
 body=new THREE.SkinnedMesh(g,new THREE.MeshPhysicalMaterial({color:0xd8ccc4,roughness:.63,metalness:0,clearcoat:.02,flatShading:false,side:THREE.DoubleSide,skinning:true}));
 scene.add(body);buildSkinning(g);frame();updateBody();applyPose("neutral");document.querySelector("#loading").classList.add("done");
}
function frame(){
 body.geometry.computeBoundingBox();const b=body.geometry.boundingBox,s=new THREE.Vector3(),c=new THREE.Vector3();b.getSize(s);b.getCenter(c);orbit.target.copy(c);
 const vf=THREE.MathUtils.degToRad(camera.fov),hf=2*Math.atan(Math.tan(vf/2)*Math.max(.42,innerWidth/innerHeight));
 const d=Math.max((s.y*.73)/Math.tan(vf/2),(s.x*.70)/Math.tan(hf/2),4.7);camera.position.set(c.x,c.y,c.z+d);orbit.maxDistance=Math.max(35,d*7);orbit.update();
}
init().catch(e=>{document.querySelector("#loading strong").textContent="Ladefehler";document.querySelector("#loading small").textContent=String(e)});

document.querySelectorAll("[data-pose]").forEach(b=>b.addEventListener("click",()=>applyPose(b.dataset.pose)));

// Robust free-position sheet.
// We store the TOP edge instead of translating a full-height panel.
// This means the handle can never be translated outside its own interactive box,
// and the scroll viewport always extends exactly to the bottom of the screen.
const sheet=document.querySelector("#sheet"),handle=document.querySelector("#handle"),scrollEl=document.querySelector("#scroll");
let sheetTop=innerHeight*.52,drag=false,startY=0,startTop=0;

function sheetLimits(){
  const safeTop=Math.max(8,Math.round(innerHeight*.035));
  const minVisible=88;
  return {min:safeTop,max:Math.max(safeTop,innerHeight-minVisible)};
}
function setSheetTop(y){
  const lim=sheetLimits();
  sheetTop=Math.max(lim.min,Math.min(lim.max,y));
  sheet.style.setProperty("--sheetTop",sheetTop+"px");
}
setSheetTop(sheetTop);

handle.addEventListener("pointerdown",e=>{
  drag=true;startY=e.clientY;startTop=sheetTop;
  handle.setPointerCapture(e.pointerId);
  e.preventDefault();
});
handle.addEventListener("pointermove",e=>{
  if(!drag)return;
  setSheetTop(startTop+(e.clientY-startY));
  e.preventDefault();
});
function endSheetDrag(e){
  drag=false;
  try{if(e && handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId)}catch(_){}
}
handle.addEventListener("pointerup",endSheetDrag);
handle.addEventListener("pointercancel",endSheetDrag);

// Extra recovery path for iOS: a new touch on the visible handle always starts from
// the panel's current actual top, even if a previous pointer sequence was interrupted.
handle.addEventListener("touchstart",()=>{sheetTop=sheet.getBoundingClientRect().top},{passive:true});

// Search filters controls and auto-opens matching groups.
const search=document.querySelector("#search");
search.addEventListener("input",()=>{
 const q=search.value.trim().toLowerCase();
 document.querySelectorAll("#groups .group, #faceGroups .group").forEach(g=>{
  let hits=0;
  g.querySelectorAll(".controlWrap").forEach(r=>{
    const show=!q||r.dataset.search.includes(q);
    r.classList.toggle("hidden",!show);
    if(show)hits++;
  });
  g.classList.toggle("hidden",!!q&&hits===0);
  if(q&&hits)g.open=true;
 });
});
let allOpen=false;document.querySelector("#openAll").addEventListener("click",()=>{
 allOpen=!allOpen;document.querySelectorAll("#groups .group, #faceGroups .group").forEach(g=>g.open=allOpen);document.querySelector("#openAll").textContent=allOpen?"Zu":"Alle";
});
// Global range editor. Applies one test range to every slider.
// For native 0..100 macro sliders a negative global minimum deliberately enables
// extrapolation, just like the individual overdrive editor.
document.querySelector("#applyGlobalRange").addEventListener("click",()=>{
 let mn=Number(document.querySelector("#globalMin").value);
 let mx=Number(document.querySelector("#globalMax").value);
 if(!Number.isFinite(mn))mn=-100;
 if(!Number.isFinite(mx))mx=100;
 mn=Math.max(-500,Math.min(500,mn));
 mx=Math.max(-500,Math.min(500,mx));
 if(mn>=mx)mx=mn+10;
 document.querySelector("#globalMin").value=Math.round(mn);
 document.querySelector("#globalMax").value=Math.round(mx);

 for(const [id,q] of ui){
   if(["age","caucasian","asian","african"].includes(id)) continue;
   q.inp.min=mn/100;
   q.inp.max=mx/100;
   let v=Number(q.inp.value);
   v=Math.max(Number(q.inp.min),Math.min(Number(q.inp.max),v));
   q.inp.value=v;
   q.out.textContent=q.display(v);

   if(Object.prototype.hasOwnProperty.call(state,id))state[id]=v;
   if(Object.prototype.hasOwnProperty.call(directState,id))directState[id]=v;

   if(q.rangeEditor){
     q.rangeEditor.querySelector(".minPct").value=Math.round(mn);
     q.rangeEditor.querySelector(".maxPct").value=Math.round(mx);
   }
 }
 updateBody();
});

document.querySelector("#reset").addEventListener("click",()=>{
 Object.assign(state,{gender:.5,age:.5,weight:.5,muscle:.5,height:.5,proportions:.5,breastSize:.5,breastFirmness:.5,caucasian:1/3,asian:1/3,african:1/3});
 for(const k of Object.keys(directState))directState[k]=0;
 for(const k of Object.keys(faceState))faceState[k]=0;
 for(const k of Object.keys(faceState))faceState[k]=0;
 for(const [id,q] of ui){
   q.inp.min=q.defaultMin;
   q.inp.max=q.defaultMax;
   q.inp.value=q.default;
   q.out.textContent=q.display(q.default);
   q.row.classList.remove("active");
   if(q.rangeEditor){
     q.rangeEditor.querySelector(".minPct").value=Math.round(q.defaultMin*100);
     q.rangeEditor.querySelector(".maxPct").value=Math.round(q.defaultMax*100);
     q.rangeEditor.classList.add("hidden");
   }
 }
 document.querySelectorAll("#presets button").forEach(b=>b.classList.toggle("active",b.dataset.preset==="neutral"));
 updateBody();applyPose("neutral");
});
function resize(){
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight,false);
 setSheetTop(sheetTop);
}
addEventListener("resize",resize);resize();renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera)});