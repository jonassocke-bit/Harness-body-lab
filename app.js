import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ASSET_URL =
 "https://cdn.jsdelivr.net/gh/naver/anny@main/src/anny/data/mpfb2/3dobjs/base.obj";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, innerWidth/innerHeight, .01, 20);
camera.position.set(0, .88, 3.35);

const viewport = document.querySelector("#viewport");
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(0,.88,0);
orbit.enableDamping=true;
orbit.dampingFactor=.08;
orbit.enablePan=false;
orbit.minDistance=2.0;
orbit.maxDistance=5.5;
orbit.rotateSpeed=.65;
orbit.zoomSpeed=.75;

scene.add(new THREE.HemisphereLight(0xffffff,0x202025,1.8));
const key = new THREE.DirectionalLight(0xffffff,3.2);
key.position.set(3.5,4.5,4); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff,1.2);
fill.position.set(-3,2.5,2); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff,1.5);
rim.position.set(-2.5,3,-4); scene.add(rim);

const floor = new THREE.Mesh(
 new THREE.CircleGeometry(1.25,64),
 new THREE.MeshStandardMaterial({color:0x171719,roughness:.94,transparent:true,opacity:.55})
);
floor.rotation.x=-Math.PI/2; floor.position.y=-.01; floor.receiveShadow=true; scene.add(floor);

const defs = [
 {id:"gender",label:"Gender",group:"core",min:-1,max:1,value:0},
 {id:"height",label:"Height",group:"core",min:-1,max:1,value:0},
 {id:"weight",label:"Weight",group:"core",min:-1,max:1,value:0},
 {id:"muscle",label:"Muscle",group:"core",min:-1,max:1,value:0},
 {id:"proportions",label:"Proportions",group:"core",min:-1,max:1,value:0},

 {id:"shoulders",label:"Shoulders",group:"torso",min:-1,max:1,value:0},
 {id:"chest",label:"Chest",group:"torso",min:-1,max:1,value:0},
 {id:"breast",label:"Breast",group:"torso",min:-1,max:1,value:0},
 {id:"waist",label:"Waist",group:"torso",min:-1,max:1,value:0},
 {id:"belly",label:"Belly",group:"torso",min:-1,max:1,value:0},

 {id:"hips",label:"Hips",group:"limb",min:-1,max:1,value:0},
 {id:"butt",label:"Butt",group:"limb",min:-1,max:1,value:0},
 {id:"thighs",label:"Thighs",group:"limb",min:-1,max:1,value:0},
 {id:"calves",label:"Calves",group:"limb",min:-1,max:1,value:0},
 {id:"arms",label:"Arms",group:"limb",min:-1,max:1,value:0}
];
const state=Object.fromEntries(defs.map(d=>[d.id,d.value]));
const controls=new Map();

const presets={
 neutral:{},
 female:{gender:-.85,shoulders:-.12,hips:.18,breast:.22,waist:-.12,butt:.10},
 male:{gender:.85,shoulders:.18,chest:.12,hips:-.12,breast:-.22},
 curvy:{gender:-.72,weight:.40,breast:.42,waist:.12,hips:.42,butt:.46,thighs:.22},
 muscular:{gender:.55,muscle:.75,shoulders:.40,chest:.30,arms:.34,thighs:.25,waist:-.05}
};

function makeControls(){
 const groups={core:document.querySelector("#coreControls"),torso:document.querySelector("#torsoControls"),limb:document.querySelector("#limbControls")};
 for(const d of defs){
  const row=document.createElement("div"); row.className="control";
  const label=document.createElement("label"); label.textContent=d.label;
  const input=document.createElement("input"); input.type="range"; input.min=d.min; input.max=d.max; input.step=.01; input.value=d.value;
  const out=document.createElement("output"); out.textContent="0";
  input.addEventListener("input",()=>{
   state[d.id]=+input.value; out.textContent=fmt(state[d.id]); updateBody();
   document.querySelectorAll("#presets button").forEach(b=>b.classList.remove("active"));
  });
  row.append(label,input,out); groups[d.group].append(row); controls.set(d.id,{input,out});
 }
}
function fmt(v){return (v>0?"+":"")+Math.round(v*100)}
function syncUI(){for(const [id,c] of controls){c.input.value=state[id];c.out.textContent=fmt(state[id])}}
function resetState(){defs.forEach(d=>state[d.id]=d.value);syncUI();updateBody()}
makeControls();
document.querySelector("#resetBtn").onclick=()=>{resetState(); setPresetActive("neutral")};
function setPresetActive(name){document.querySelectorAll("#presets button").forEach(b=>b.classList.toggle("active",b.dataset.preset===name))}
document.querySelectorAll("#presets button").forEach(b=>b.onclick=()=>{
 defs.forEach(d=>state[d.id]=d.value);Object.assign(state,presets[b.dataset.preset]||{});syncUI();updateBody();setPresetActive(b.dataset.preset)
});

// ---------- draggable bottom sheet ----------
const sheet=document.querySelector("#sheet"), handle=document.querySelector("#sheetHandle");
let sheetY=innerHeight*.48, dragStartY=0, dragStartSheetY=0, dragging=false;
const minY=innerHeight*.11, maxY=innerHeight*.78;
function setSheet(y,animate=false){
 sheetY=Math.max(minY,Math.min(maxY,y));
 sheet.style.transition=animate?"transform .28s cubic-bezier(.2,.8,.2,1)":"none";
 sheet.style.setProperty("--sheet-y",`${sheetY}px`);
}
setSheet(sheetY);
handle.addEventListener("pointerdown",e=>{dragging=true;dragStartY=e.clientY;dragStartSheetY=sheetY;handle.setPointerCapture(e.pointerId);sheet.style.transition="none"});
handle.addEventListener("pointermove",e=>{if(dragging)setSheet(dragStartSheetY+(e.clientY-dragStartY))});
handle.addEventListener("pointerup",e=>{
 if(!dragging)return;dragging=false;
 const snaps=[minY,innerHeight*.48,maxY];
 const nearest=snaps.reduce((a,b)=>Math.abs(b-sheetY)<Math.abs(a-sheetY)?b:a);
 setSheet(nearest,true);
});
handle.addEventListener("dblclick",()=>setSheet(sheetY<innerHeight*.3?innerHeight*.48:minY,true));

// ---------- OBJ parser; strips MakeHuman helper/joint geometry ----------
function parseBodyOBJ(text){
 const verts=[[0,0,0]];
 const uv=[[0,0]];
 const positions=[],uvs=[];
 let group="body";
 const keepGroup=()=>!(group.startsWith("helper-")||group.startsWith("joint-"));
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim(); if(!line||line[0]==="#")continue;
  const p=line.split(/\s+/);
  if(p[0]==="v") verts.push([+p[1],+p[2],+p[3]]);
  else if(p[0]==="vt") uv.push([+p[1],+p[2]]);
  else if(p[0]==="g"||p[0]==="o") group=(p[1]||"").toLowerCase();
  else if(p[0]==="f" && keepGroup()){
   const refs=p.slice(1).map(s=>s.split("/").map(Number));
   for(let k=1;k<refs.length-1;k++){
    for(const ref of [refs[0],refs[k],refs[k+1]]){
     let vi=ref[0]; if(vi<0)vi=verts.length+vi;
     const v=verts[vi];
     // MakeHuman: Z up. Convert to Three.js Y-up and invert depth.
     positions.push(v[0],v[2],-v[1]);
     if(ref[1] && uv[ref[1]])uvs.push(uv[ref[1]][0],uv[ref[1]][1]);
     else uvs.push(0,0);
    }
   }
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
 g.computeVertexNormals();
 return g;
}

let body=null, base=null, bbox=null, centerX=0, yMin=0, yMax=1, rawHeight=1;

async function loadBody(){
 try{
  const r=await fetch(ASSET_URL,{cache:"force-cache"});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const geo=parseBodyOBJ(await r.text());
  geo.computeBoundingBox(); const bb=geo.boundingBox;
  rawHeight=bb.max.y-bb.min.y;
  const scale=1.82/rawHeight;
  geo.scale(scale,scale,scale); geo.computeBoundingBox();
  bbox=geo.boundingBox;yMin=bbox.min.y;yMax=bbox.max.y;rawHeight=yMax-yMin;centerX=(bbox.min.x+bbox.max.x)/2;
  // center foot plane and x
  geo.translate(-centerX,-yMin,0); yMin=0;yMax=rawHeight;centerX=0;
  base=new Float32Array(geo.attributes.position.array);
  const mat=new THREE.MeshPhysicalMaterial({
   color:0xe1d4ca, roughness:.72, metalness:0, clearcoat:.06, clearcoatRoughness:.8,
   side:THREE.DoubleSide
  });
  body=new THREE.Mesh(geo,mat);body.castShadow=true;body.receiveShadow=true;scene.add(body);
  document.querySelector("#loading").classList.add("hidden");
  updateBody();
 }catch(err){
  const el=document.querySelector("#loading");
  el.querySelector("strong").textContent="Mesh konnte nicht geladen werden";
  el.querySelector("small").textContent=String(err.message)+" · Seite neu laden";
  el.querySelector(".spinner").style.display="none";
 }
}

function smoothstep(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)}
function bell(t,c,w){const x=(t-c)/w;return Math.exp(-x*x*2.2)}
function side01(x){return Math.min(1,Math.abs(x)/.38)}
function updateBody(){
 if(!body||!base)return;
 const p=body.geometry.attributes.position;
 const out=new Float32Array(base.length);
 const s=state;
 for(let i=0;i<base.length;i+=3){
  let x=base[i], y=base[i+1], z=base[i+2];
  const t=y/rawHeight; // 0 feet -> 1 head
  const ax=Math.abs(x);

  // Global body mass. Focus torso + limbs, avoid distorting head/hands/feet aggressively.
  const torsoMask=smoothstep(.38,.48,t)*(1-smoothstep(.86,.94,t));
  const legMask=smoothstep(.05,.14,t)*(1-smoothstep(.52,.60,t));
  const armSide=smoothstep(.23,.36,ax)*smoothstep(.48,.58,t)*(1-smoothstep(.83,.90,t));
  const massMask=Math.max(torsoMask*.95,legMask*.55,armSide*.6);
  const weight=s.weight;
  let radial=1+weight*.12*massMask;
  x*=radial; z*=1+weight*.10*massMask;

  // Gender: wider male shoulder/chest; wider female pelvis/thigh root.
  x*=1+s.gender*( .085*bell(t,.75,.10) - .065*bell(t,.51,.085) );
  z*=1+s.gender*( .035*bell(t,.70,.14) - .025*bell(t,.52,.10) );

  // Shoulders
  x*=1+s.shoulders*.14*bell(t,.78,.075);

  // Chest circumference/depth
  const chestM=bell(t,.70,.105);
  x*=1+s.chest*.095*chestM;
  z*=1+s.chest*.13*chestM;

  // Breast projection: front is +z or -z depends base; use bilateral depth magnitude with female bias.
  const breastM=bell(t,.70,.065)*smoothstep(.035,.12,ax)*(1-smoothstep(.28,.38,ax));
  const frontSign=z>=0?1:-1;
  z += frontSign*s.breast*.075*breastM*(.85-.25*s.gender);

  // Waist
  const waistM=bell(t,.59,.075);
  x*=1+s.waist*.15*waistM;
  z*=1+s.waist*.11*waistM;

  // Belly projection / circumference
  const bellyM=bell(t,.57,.10);
  x*=1+s.belly*.07*bellyM;
  z += (z>=0?1:-1)*s.belly*.065*bellyM;

  // Hips/pelvis width
  const hipM=bell(t,.48,.075);
  x*=1+s.hips*.17*hipM;
  z*=1+s.hips*.08*hipM;

  // Butt depth around posterior pelvis (symmetric depth fallback but strongest outward)
  const buttM=bell(t,.46,.07);
  z += (z>=0?1:-1)*s.butt*.075*buttM;

  // thighs and calves
  const thighM=bell(t,.35,.11), calfM=bell(t,.17,.085);
  // scale x relative to approximate limb centers rather than whole body center
  const legCenter=(x<0?-0.105:0.105);
  x=legCenter+(x-legCenter)*(1+s.thighs*.13*thighM+s.calves*.12*calfM);
  z*=1+s.thighs*.09*thighM+s.calves*.09*calfM;

  // arms/muscle
  const armM=armSide;
  x*=1+s.arms*.045*armM+s.muscle*.035*armM;
  z*=1+s.arms*.09*armM+s.muscle*.07*armM;
  x*=1+s.muscle*.06*bell(t,.74,.13);
  z*=1+s.muscle*.05*bell(t,.72,.13);

  // Body proportions: leg length vs torso; height: actual global size
  const prop=s.proportions;
  if(t<.50) y*=1+prop*.075;
  else y += rawHeight*.50*prop*.075 + (y-rawHeight*.50)*(1-prop*.035);
  const hScale=1+s.height*.105;
  y*=hScale;

  out[i]=x;out[i+1]=y;out[i+2]=z;
 }
 p.array.set(out);p.needsUpdate=true;
 body.geometry.computeVertexNormals();
 body.geometry.computeBoundingSphere();
}
loadBody();

function resize(){
 const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
addEventListener("resize",()=>{resize();setSheet(Math.min(sheetY,innerHeight*.78))});resize();

renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera)});
