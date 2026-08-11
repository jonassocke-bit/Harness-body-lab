import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const BODY_VERTEX_COUNT = 13380; // visible hm08 body: vertices 0..13379

const BODY_URL =
  "https://cdn.jsdelivr.net/gh/naver/anny@main/src/anny/data/mpfb2/3dobjs/base.obj";

const TARGETS = {
  waist: {
    minus: "https://media.githubusercontent.com/media/makehumancommunity/makehuman-assets/master/base/targets/measure/measure-waist-circ-decr.target",
    plus:  "https://media.githubusercontent.com/media/makehumancommunity/makehuman-assets/master/base/targets/measure/measure-waist-circ-incr.target"
  },
  hips: {
    minus: "https://media.githubusercontent.com/media/makehumancommunity/makehuman-assets/master/base/targets/measure/measure-hips-circ-decr.target",
    plus:  "https://media.githubusercontent.com/media/makehumancommunity/makehuman-assets/master/base/targets/measure/measure-hips-circ-incr.target"
  }
};

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.01,100);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
document.querySelector("#viewport").appendChild(renderer.domElement);

const orbit=new OrbitControls(camera,renderer.domElement);
orbit.enableDamping=true;
orbit.dampingFactor=.08;
orbit.enablePan=true;
orbit.screenSpacePanning=true;
orbit.touches.ONE=THREE.TOUCH.ROTATE;
orbit.touches.TWO=THREE.TOUCH.DOLLY_PAN;
orbit.minDistance=.7;
orbit.maxDistance=30;

scene.add(new THREE.HemisphereLight(0xffffff,0x25252a,1.85));
const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(3,4,4);scene.add(key);
const fill=new THREE.DirectionalLight(0xffffff,.9);fill.position.set(-3,2,3);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,1.1);rim.position.set(-2,3,-4);scene.add(rim);

const floor=new THREE.Mesh(
  new THREE.CircleGeometry(1.15,64),
  new THREE.MeshStandardMaterial({color:0x171719,roughness:1,transparent:true,opacity:.48})
);
floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);

let body=null;
let base=null;
let scaleFactor=1;
const morphs={};
const values={waist:0,hips:0};

function parseBodyOBJ(text){
  const verts=[];
  const faces=[];
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith("#")) continue;
    const p=line.split(/\s+/);
    if(p[0]==="v"){
      verts.push([+p[1],+p[2],+p[3]]);
    }else if(p[0]==="f"){
      const ids=p.slice(1).map(s=>{
        let i=parseInt(s.split("/")[0],10);
        if(i<0)i=verts.length+1+i;
        return i-1;
      });
      // Only faces whose ALL original indices are part of visible body.
      if(ids.every(i=>i>=0 && i<BODY_VERTEX_COUNT)){
        for(let k=1;k<ids.length-1;k++) faces.push(ids[0],ids[k],ids[k+1]);
      }
    }
  }

  if(verts.length<BODY_VERTEX_COUNT) throw new Error("hm08 vertex count too small");

  const pos=new Float32Array(BODY_VERTEX_COUNT*3);
  for(let i=0;i<BODY_VERTEX_COUNT;i++){
    const v=verts[i];
    pos[i*3]=v[0];
    pos[i*3+1]=v[1];
    pos[i*3+2]=-v[2];
  }

  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.BufferAttribute(pos,3));
  g.setIndex(faces);
  g.computeVertexNormals();
  g.normalizeNormals();
  return g;
}

function parseTarget(text){
  if(text.startsWith("version https://git-lfs")) throw new Error("Git LFS pointer statt Targetdaten");
  const map=new Map();
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith("#"))continue;
    const p=line.split(/\s+/);
    if(p.length<4)continue;
    const i=+p[0],x=+p[1],y=+p[2],z=+p[3];
    if(Number.isInteger(i)&&i>=0&&i<BODY_VERTEX_COUNT&&[x,y,z].every(Number.isFinite)){
      map.set(i,[x,y,z]);
    }
  }
  if(!map.size)throw new Error("Target enthält keine Body-Vertices");
  return map;
}

async function getText(url,timeoutMs=12000){
  const c=new AbortController();
  const t=setTimeout(()=>c.abort(),timeoutMs);
  try{
    const r=await fetch(url,{cache:"force-cache",signal:c.signal});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    return await r.text();
  }finally{clearTimeout(t)}
}

async function loadMorphPair(name){
  const spec=TARGETS[name];
  const [minus,plus]=await Promise.all([
    getText(spec.minus),
    getText(spec.plus)
  ]);
  morphs[name]={minus:parseTarget(minus),plus:parseTarget(plus)};
}

function applyMorph(out,map,amount){
  if(!map||!amount)return;
  for(const [i,d] of map){
    const j=i*3;
    out[j]+=d[0]*scaleFactor*amount;
    out[j+1]+=d[1]*scaleFactor*amount;
    out[j+2]-=d[2]*scaleFactor*amount;
  }
}

function updateBody(){
  if(!body||!base)return;
  const out=new Float32Array(base);
  for(const name of ["waist","hips"]){
    const v=values[name];
    const pair=morphs[name];
    if(!pair)continue;
    if(v<0)applyMorph(out,pair.minus,-v);
    if(v>0)applyMorph(out,pair.plus,v);
  }
  const p=body.geometry.attributes.position;
  p.array.set(out);
  p.needsUpdate=true;
  body.geometry.computeVertexNormals();
  body.geometry.normalizeNormals();
  body.geometry.computeBoundingSphere();
}

function frameBody(){
  body.geometry.computeBoundingBox();
  const box=body.geometry.boundingBox;
  const size=new THREE.Vector3();box.getSize(size);
  const center=new THREE.Vector3();box.getCenter(center);
  orbit.target.copy(center);

  const vf=THREE.MathUtils.degToRad(camera.fov);
  const hf=2*Math.atan(Math.tan(vf/2)*Math.max(.42,innerWidth/innerHeight));
  const dH=(size.y*.7)/Math.tan(vf/2);
  const dW=(size.x*.68)/Math.tan(hf/2);
  const dist=Math.max(dH,dW,4.5);
  camera.position.set(center.x,center.y,center.z+dist);
  orbit.maxDistance=Math.max(30,dist*6);
  orbit.update();
}

async function init(){
  const status=document.querySelector("#status");
  const targetState=document.querySelector("#targetState");
  try{
    const geo=parseBodyOBJ(await getText(BODY_URL));
    geo.computeBoundingBox();
    let bb=geo.boundingBox;
    scaleFactor=1.82/(bb.max.y-bb.min.y);
    geo.scale(scaleFactor,scaleFactor,scaleFactor);
    geo.computeBoundingBox();bb=geo.boundingBox;

    const cx=(bb.min.x+bb.max.x)/2;
    const cz=(bb.min.z+bb.max.z)/2;
    geo.translate(-cx,-bb.min.y,-cz);
    geo.computeBoundingBox();

    base=new Float32Array(geo.attributes.position.array);

    const mat=new THREE.MeshPhysicalMaterial({
      color:0xd8ccc4,
      roughness:.64,
      metalness:0,
      clearcoat:.025,
      clearcoatRoughness:.9,
      flatShading:false,
      side:THREE.DoubleSide
    });
    body=new THREE.Mesh(geo,mat);
    scene.add(body);
    frameBody();

    targetState.textContent="Mesh korrekt · echte Targets werden geprüft…";

    const results=await Promise.allSettled([
      loadMorphPair("waist"),
      loadMorphPair("hips")
    ]);
    const ok=results.filter(r=>r.status==="fulfilled").length;
    targetState.textContent=`${ok}/2 echte MakeHuman-Morphs aktiv`;

    if(ok<2){
      throw new Error(`${ok}/2 Morphs geladen – GitHub LFS/Media blockiert`);
    }

    status.classList.add("ok");
    updateBody();
  }catch(err){
    status.classList.remove("loading");
    status.classList.add("error");
    status.querySelector("strong").textContent="Quality Test konnte nicht vollständig laden";
    status.querySelector("small").textContent=err?.name==="AbortError"?"Netzwerk-Timeout":String(err.message||err);
    targetState.textContent="Ladefehler – Screenshot davon reicht mir";
  }
}

for(const name of ["waist","hips"]){
  const input=document.querySelector("#"+name);
  const out=document.querySelector("#"+name+"Out");
  input.addEventListener("input",()=>{
    values[name]=+input.value;
    out.textContent=(values[name]>0?"+":"")+Math.round(values[name]*100);
    updateBody();
  });
}

document.querySelector("#reset").addEventListener("click",()=>{
  values.waist=0;values.hips=0;
  for(const name of ["waist","hips"]){
    document.querySelector("#"+name).value=0;
    document.querySelector("#"+name+"Out").textContent="0";
  }
  updateBody();
});

document.querySelectorAll("[data-view]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    if(!body)return;
    document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b===btn));
    body.geometry.computeBoundingBox();
    const box=body.geometry.boundingBox;
    const size=new THREE.Vector3();box.getSize(size);
    const center=new THREE.Vector3();box.getCenter(center);
    const dist=camera.position.distanceTo(orbit.target);
    const view=btn.dataset.view;
    if(view==="front")camera.position.set(center.x,center.y,center.z+dist);
    if(view==="back")camera.position.set(center.x,center.y,center.z-dist);
    if(view==="side")camera.position.set(center.x+dist,center.y,center.z);
    orbit.target.copy(center);orbit.update();
  });
});

// draggable bottom sheet
const sheet=document.querySelector("#sheet"),handle=document.querySelector("#handle");
let sy=innerHeight*.67,drag=false,startY=0,startSheet=0;
function setSheet(y,animate=false){
  const min=innerHeight*.12,max=innerHeight*.82;
  sy=Math.max(min,Math.min(max,y));
  sheet.style.transition=animate?"transform .28s cubic-bezier(.2,.8,.2,1)":"none";
  sheet.style.setProperty("--y",`${sy}px`);
}
setSheet(sy);
handle.addEventListener("pointerdown",e=>{
  drag=true;startY=e.clientY;startSheet=sy;handle.setPointerCapture(e.pointerId);
});
handle.addEventListener("pointermove",e=>{if(drag)setSheet(startSheet+e.clientY-startY)});
handle.addEventListener("pointerup",()=>{
  drag=false;
  const snaps=[innerHeight*.12,innerHeight*.67,innerHeight*.82];
  setSheet(snaps.reduce((a,b)=>Math.abs(b-sy)<Math.abs(a-sy)?b:a),true);
});

function resize(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight,false);
}
addEventListener("resize",()=>{resize();setSheet(sy)});
resize();
renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera)});
init();
