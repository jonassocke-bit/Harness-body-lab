import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GROUPS } from "./modifier-config.js";
import { DIRECT } from "./body-morphs.js";
import { MACRO, HEIGHT, PROPORTIONS, BREAST } from "./macro-morphs.js";
import { GROUP_LABELS } from "./labels.js";

const N=13380;
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
 gender:.5,weight:.5,muscle:.5,height:.5,proportions:.5,breastSize:.5,breastFirmness:.5
};
const directState={};
const ui=new Map();

function humanize(s){
 return s.replace(/^measure-/,"").replace(/-/g," ").replace(/\br\b/,"R").replace(/\bl\b/,"L")
  .replace(/\b\w/g,m=>m.toUpperCase());
}
function fmt(v){return (v>0?"+":"")+Math.round(v*100)}
function makeControl(parent,id,label,min,max,value,handler,display=v=>fmt(v)){
 const row=document.createElement("div");row.className="control";row.dataset.search=label.toLowerCase();
 const lab=document.createElement("label");lab.textContent=label;lab.title=label;
 const inp=document.createElement("input");inp.type="range";inp.min=min;inp.max=max;inp.step=.01;inp.value=value;
 const out=document.createElement("output");out.textContent=display(value);
 inp.addEventListener("input",()=>{const v=+inp.value;out.textContent=display(v);row.classList.toggle("active",Math.abs(v-(min===0?0:(min+max)/2))>.01);handler(v)});
 row.append(lab,inp,out);parent.append(row);ui.set(id,{inp,out,row,display,default:value});
}

const core=document.querySelector("#coreControls");
makeControl(core,"gender","Female ↔ Male",0,1,.5,v=>{state.gender=v;updateBody()},v=>Math.round(v*100));
makeControl(core,"weight","Weight",0,1,.5,v=>{state.weight=v;updateBody()},v=>Math.round(v*100));
makeControl(core,"muscle","Muscle",0,1,.5,v=>{state.muscle=v;updateBody()},v=>Math.round(v*100));
makeControl(core,"height","Height",0,1,.5,v=>{state.height=v;updateBody()},v=>Math.round(v*100));
makeControl(core,"proportions","Body proportions",0,1,.5,v=>{state.proportions=v;updateBody()},v=>Math.round(v*100));
makeControl(core,"breastSize","Breast size",0,1,.5,v=>{state.breastSize=v;updateBody()},v=>Math.round(v*100));
makeControl(core,"breastFirmness","Breast firmness",0,1,.5,v=>{state.breastFirmness=v;updateBody()},v=>Math.round(v*100));

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
  makeControl(body,c.id,label,min,max,def,v=>{directState[c.id]=v;updateBody()});
 }
 groupsEl.append(det);
}
document.querySelector("#count").textContent=`${directCount+7} körperrelevante Regler aus MakeHuman`;

function tri(v){return{min:Math.max(0,1-v*2),avg:1-Math.abs(v-.5)*2,max:Math.max(0,v*2-1)}}
function apply(out,flat,a){
 if(!flat||Math.abs(a)<1e-7)return;
 for(let k=0;k<flat.length;k+=4){
  const i=flat[k]*3;out[i]+=flat[k+1]*scaleFactor*a;out[i+1]+=flat[k+2]*scaleFactor*a;out[i+2]-=flat[k+3]*scaleFactor*a;
 }
}
let body=null,base=null,scaleFactor=1;
function updateBody(){
 if(!body||!base)return;
 const out=new Float32Array(base);
 const gw={female:1-state.gender,male:state.gender};
 const mw=tri(state.muscle),ww=tri(state.weight);
 const mn={min:"minmuscle",avg:"averagemuscle",max:"maxmuscle"};
 const wn={min:"minweight",avg:"averageweight",max:"maxweight"};
 for(const sex of ["female","male"])for(const m of ["min","avg","max"])for(const w of ["min","avg","max"]){
  const a=gw[sex]*mw[m]*ww[w]; if(a)apply(out,MACRO[`${sex}|${mn[m]}|${wn[w]}`],a);
 }

 // Height: neutral .5 = no extra height target, extrema use MakeHuman conditioned targets.
 const hv=state.height<.5?{name:"minheight",a:(.5-state.height)*2}:{name:"maxheight",a:(state.height-.5)*2};
 if(hv.a>0)for(const sex of ["female","male"])for(const m of ["min","avg","max"])for(const w of ["min","avg","max"]){
  const a=gw[sex]*mw[m]*ww[w]*hv.a;if(a)apply(out,HEIGHT[`${sex}|${mn[m]}|${wn[w]}|${hv.name}`],a);
 }

 // Body proportions: regular .5 is neutral.
 const pv=state.proportions<.5?{name:"uncommonproportions",a:(.5-state.proportions)*2}:{name:"idealproportions",a:(state.proportions-.5)*2};
 if(pv.a>0)for(const sex of ["female","male"])for(const m of ["min","avg","max"])for(const w of ["min","avg","max"]){
  const a=gw[sex]*mw[m]*ww[w]*pv.a;if(a)apply(out,PROPORTIONS[`${sex}|${mn[m]}|${wn[w]}|${pv.name}`],a);
 }

 // Breast size/firmness conditioned by female component + Weight/Muscle.
 const cw=tri(state.breastSize),fw=tri(state.breastFirmness);
 const cn={min:"mincup",avg:"averagecup",max:"maxcup"},fn={min:"minfirmness",avg:"averagefirmness",max:"maxfirmness"};
 const female=1-state.gender;
 if(female>0)for(const m of ["min","avg","max"])for(const w of ["min","avg","max"])for(const c of ["min","avg","max"])for(const f of ["min","avg","max"]){
  const a=female*mw[m]*ww[w]*cw[c]*fw[f];if(a)apply(out,BREAST[`${mn[m]}|${wn[w]}|${cn[c]}|${fn[f]}`],a);
 }

 // Every direct MakeHuman body modifier is additive on top.
 for(const [id,v] of Object.entries(directState)){
  if(!v)continue;const d=DIRECT[id];
  if(v<0)apply(out,d.minus,-v);else apply(out,d.plus,v);
 }
 const p=body.geometry.attributes.position;p.array.set(out);p.needsUpdate=true;
 body.geometry.computeVertexNormals();body.geometry.normalizeNormals();body.geometry.computeBoundingSphere();
}
function parseOBJ(text){
 const verts=[],faces=[];
 for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(!line||line[0]==="#")continue;const p=line.split(/\s+/);
  if(p[0]==="v")verts.push([+p[1],+p[2],+p[3]]);
  else if(p[0]==="f"){const ids=p.slice(1).map(s=>{let i=parseInt(s.split("/")[0]);if(i<0)i=verts.length+1+i;return i-1});if(ids.every(i=>i>=0&&i<N))for(let k=1;k<ids.length-1;k++)faces.push(ids[0],ids[k],ids[k+1]);}
 }
 const pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=verts[i][0];pos[i*3+1]=verts[i][1];pos[i*3+2]=-verts[i][2]}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setIndex(faces);g.computeVertexNormals();return g;
}
async function init(){
 const r=await fetch("./base.obj",{cache:"force-cache"});if(!r.ok)throw new Error("base.obj");
 const g=parseOBJ(await r.text());g.computeBoundingBox();let b=g.boundingBox;scaleFactor=1.82/(b.max.y-b.min.y);g.scale(scaleFactor,scaleFactor,scaleFactor);g.computeBoundingBox();b=g.boundingBox;
 g.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);g.computeBoundingBox();base=new Float32Array(g.attributes.position.array);
 body=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:0xd8ccc4,roughness:.63,metalness:0,clearcoat:.02,flatShading:false,side:THREE.DoubleSide}));
 scene.add(body);frame();updateBody();document.querySelector("#loading").classList.add("done");
}
function frame(){
 body.geometry.computeBoundingBox();const b=body.geometry.boundingBox,s=new THREE.Vector3(),c=new THREE.Vector3();b.getSize(s);b.getCenter(c);orbit.target.copy(c);
 const vf=THREE.MathUtils.degToRad(camera.fov),hf=2*Math.atan(Math.tan(vf/2)*Math.max(.42,innerWidth/innerHeight));
 const d=Math.max((s.y*.73)/Math.tan(vf/2),(s.x*.70)/Math.tan(hf/2),4.7);camera.position.set(c.x,c.y,c.z+d);orbit.maxDistance=Math.max(35,d*7);orbit.update();
}
init().catch(e=>{document.querySelector("#loading strong").textContent="Ladefehler";document.querySelector("#loading small").textContent=String(e)});

// No snapping: sheet stays exactly where released.
const sheet=document.querySelector("#sheet"),handle=document.querySelector("#handle");
let sy=innerHeight*.52,drag=false,startY=0,startSheet=0;
function setSheet(y){sy=Math.max(innerHeight*.07,Math.min(innerHeight*.88,y));sheet.style.setProperty("--y",sy+"px")}
setSheet(sy);handle.addEventListener("pointerdown",e=>{drag=true;startY=e.clientY;startSheet=sy;handle.setPointerCapture(e.pointerId)});
handle.addEventListener("pointermove",e=>{if(drag)setSheet(startSheet+e.clientY-startY)});handle.addEventListener("pointerup",()=>drag=false);handle.addEventListener("pointercancel",()=>drag=false);

// Search filters controls and auto-opens matching groups.
const search=document.querySelector("#search");
search.addEventListener("input",()=>{
 const q=search.value.trim().toLowerCase();
 document.querySelectorAll(".group:not(.core)").forEach(g=>{
  let hits=0;g.querySelectorAll(".control").forEach(r=>{const show=!q||r.dataset.search.includes(q);r.classList.toggle("hidden",!show);if(show)hits++});
  g.classList.toggle("hidden",!!q&&hits===0);if(q&&hits)g.open=true;
 });
});
let allOpen=false;document.querySelector("#openAll").addEventListener("click",()=>{
 allOpen=!allOpen;document.querySelectorAll(".group").forEach(g=>g.open=allOpen);document.querySelector("#openAll").textContent=allOpen?"Zu":"Alle";
});
document.querySelector("#reset").addEventListener("click",()=>{
 Object.assign(state,{gender:.5,weight:.5,muscle:.5,height:.5,proportions:.5,breastSize:.5,breastFirmness:.5});
 for(const k of Object.keys(directState))directState[k]=0;
 for(const [id,q] of ui){q.inp.value=q.default;q.out.textContent=q.display(q.default);q.row.classList.remove("active")}
 updateBody();
});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);setSheet(sy)}
addEventListener("resize",resize);resize();renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera)});
