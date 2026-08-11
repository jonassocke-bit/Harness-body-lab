import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ASSET_URL =
 "https://cdn.jsdelivr.net/gh/naver/anny@main/src/anny/data/mpfb2/3dobjs/base.obj";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, innerWidth/innerHeight, .01, 100);
camera.position.set(0, 1, 6);

const viewport = document.querySelector("#viewport");
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(0,.9,0);
orbit.enableDamping=true;
orbit.dampingFactor=.08;
orbit.enablePan=false;
orbit.minDistance=.65;
orbit.maxDistance=25;
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

// ---------- MakeHuman OBJ parser ----------
// hm08: X = left/right, Y = up, Z = front/back.
function parseBodyOBJ(text){
 const rawVerts=[[0,0,0]];
 const uv=[[0,0]];
 const faces=[];
 let group="body";
 const keepGroup=()=>!(group.startsWith("helper-")||group.startsWith("joint-"));

 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim(); if(!line||line[0]==="#")continue;
  const p=line.split(/\s+/);
  if(p[0]==="v") rawVerts.push([+p[1],+p[2],+p[3]]);
  else if(p[0]==="vt") uv.push([+p[1],+p[2]]);
  else if(p[0]==="g"||p[0]==="o") group=(p[1]||"").toLowerCase();
  else if(p[0]==="f" && keepGroup()){
   const refs=p.slice(1).map(s=>s.split("/").map(Number));
   for(let k=1;k<refs.length-1;k++) faces.push([refs[0],refs[k],refs[k+1]]);
  }
 }

 const positions=[],uvs=[];
 for(const tri of faces){
  for(const ref of tri){
   let vi=ref[0]; if(vi<0)vi=rawVerts.length+vi;
   const v=rawVerts[vi];
   positions.push(v[0],v[1],-v[2]);
   if(ref[1] && uv[ref[1]])uvs.push(uv[ref[1]][0],uv[ref[1]][1]);
   else uvs.push(0,0);
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
  geo.computeBoundingBox(); let bb=geo.boundingBox;
  rawHeight=bb.max.y-bb.min.y;
  const scale=1.82/rawHeight;
  geo.scale(scale,scale,scale);
  geo.computeBoundingBox(); bb=geo.boundingBox;

  // Centre X and depth Z. Keep feet exactly on Y=0.
  const cx=(bb.min.x+bb.max.x)/2;
  const cz=(bb.min.z+bb.max.z)/2;
  const footY=bb.min.y;
  geo.translate(-cx,-footY,-cz);
  geo.computeBoundingBox();

  bbox=geo.boundingBox;
  yMin=0; yMax=bbox.max.y; rawHeight=yMax; centerX=0;
  base=new Float32Array(geo.attributes.position.array);
  const mat=new THREE.MeshPhysicalMaterial({
   color:0xe1d4ca, roughness:.72, metalness:0, clearcoat:.06, clearcoatRoughness:.8,
   side:THREE.DoubleSide
  });
  body=new THREE.Mesh(geo,mat);body.castShadow=true;body.receiveShadow=true;scene.add(body);

  function frameWholeBody(){
    geo.computeBoundingBox();
    const box=geo.boundingBox;
    const size=new THREE.Vector3(); box.getSize(size);
    const center=new THREE.Vector3(); box.getCenter(center);

    orbit.target.set(center.x, center.y, center.z);

    const vFov=THREE.MathUtils.degToRad(camera.fov);
    const aspect=Math.max(.42, innerWidth/innerHeight);
    const hFov=2*Math.atan(Math.tan(vFov/2)*aspect);
    const distH=(size.y*.62)/Math.tan(vFov/2);
    const distW=(size.x*.62)/Math.tan(hFov/2);
    const distance=Math.max(distH,distW,4.2);

    camera.position.set(center.x, center.y, center.z + distance);
    camera.near=Math.max(.01,distance/250);
    camera.far=Math.max(60,distance*10);
    camera.updateProjectionMatrix();

    orbit.minDistance=Math.max(.55,distance*.15);
    orbit.maxDistance=Math.max(25,distance*5);
    orbit.update();
  }
  frameWholeBody();
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

 // Spatial torso boundary. The hm08 basemesh is in a T/A pose, so HEIGHT alone cannot
 // distinguish shoulders from arms/hands. These masks always require proximity to torso.
 const torsoHalf=.34;
 const innerTorsoHalf=.29;

 for(let i=0;i<base.length;i+=3){
  let x=base[i], y=base[i+1], z=base[i+2];
  const t=y/rawHeight;
  const ax=Math.abs(x);

  const torsoSpatial=1-smoothstep(torsoHalf,torsoHalf+.10,ax);
  const innerTorso=1-smoothstep(innerTorsoHalf,innerTorsoHalf+.08,ax);
  const pelvisSpatial=1-smoothstep(.38,.50,ax);

  // Body mass: torso, pelvis and limb thickness separately so hands/feet stay stable.
  const torsoMask=smoothstep(.40,.48,t)*(1-smoothstep(.86,.93,t))*torsoSpatial;
  const pelvisMask=bell(t,.48,.12)*pelvisSpatial;
  const legMask=smoothstep(.08,.14,t)*(1-smoothstep(.50,.57,t));
  const armMask=smoothstep(.34,.43,ax)*smoothstep(.49,.58,t)*(1-smoothstep(.82,.89,t))
                *(1-smoothstep(.70,.92,ax)); // fades out before wrists/hands
  const massMask=Math.max(torsoMask,pelvisMask*.9,legMask*.45,armMask*.45);
  const weight=s.weight;
  x*=1+weight*.11*massMask;
  z*=1+weight*.10*massMask;

  // Gender - only anatomical torso/pelvis zones, never hands.
  const maleShoulder=s.gender*.075*bell(t,.76,.11)*torsoSpatial;
  const malePelvis=-s.gender*.055*bell(t,.50,.09)*pelvisSpatial;
  x*=1+maleShoulder+malePelvis;
  z*=1+s.gender*.030*bell(t,.70,.14)*torsoSpatial-s.gender*.020*bell(t,.51,.10)*pelvisSpatial;

  // SHOULDERS: clavicle/upper torso only. Previous version affected all vertices at
  // shoulder height, including hands in T-pose. The x-bound mask fixes that.
  const shoulderM=bell(t,.78,.075)*torsoSpatial;
  x*=1+s.shoulders*.145*shoulderM;
  z*=1+s.shoulders*.025*shoulderM;

  // Chest
  const chestM=bell(t,.70,.105)*innerTorso;
  x*=1+s.chest*.095*chestM;
  z*=1+s.chest*.13*chestM;

  // Breast / front-back projection; torso only
  const breastM=bell(t,.70,.065)*innerTorso*smoothstep(.035,.12,ax);
  z += (z>=0?1:-1)*s.breast*.070*breastM*(.85-.25*s.gender);

  // Waist
  const waistM=bell(t,.59,.070)*innerTorso;
  x*=1+s.waist*.15*waistM;
  z*=1+s.waist*.11*waistM;

  // Belly
  const bellyM=bell(t,.57,.10)*innerTorso;
  x*=1+s.belly*.065*bellyM;
  z += (z>=0?1:-1)*s.belly*.060*bellyM;

  // Hips/pelvis
  const hipM=bell(t,.48,.075)*pelvisSpatial;
  x*=1+s.hips*.17*hipM;
  z*=1+s.hips*.08*hipM;

  // Butt
  const buttM=bell(t,.46,.07)*pelvisSpatial;
  z += (z>=0?1:-1)*s.butt*.072*buttM;

  // Legs: use local leg centres to avoid pulling both legs away from centre.
  const thighM=bell(t,.35,.11), calfM=bell(t,.17,.085);
  const legCentre=(x<0?-0.105:0.105);
  const legRegion=(ax<.35)?1:0;
  if(legRegion){
   x=legCentre+(x-legCentre)*(1+s.thighs*.13*thighM+s.calves*.12*calfM);
   z*=1+s.thighs*.09*thighM+s.calves*.09*calfM;
  }

  // Arms: thickness only, fade to zero toward hands.
  x*=1+s.arms*.035*armMask+s.muscle*.025*armMask;
  z*=1+s.arms*.085*armMask+s.muscle*.060*armMask;

  // Torso muscle
  x*=1+s.muscle*.055*bell(t,.74,.13)*torsoSpatial;
  z*=1+s.muscle*.050*bell(t,.72,.13)*torsoSpatial;

  // Proportions + height
  const prop=s.proportions;
  if(t<.50) y*=1+prop*.075;
  else y += rawHeight*.50*prop*.075 + (y-rawHeight*.50)*(1-prop*.035);
  y*=1+s.height*.105;

  out[i]=x; out[i+1]=y; out[i+2]=z;
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
