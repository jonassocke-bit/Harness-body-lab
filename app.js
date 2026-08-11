import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { CONTROLS, PRESETS } from "./config.js";
import { FallbackBody } from "./fallback-body.js";
import { fetchTarget, applySparseTarget } from "./target-loader.js";

const viewport=document.querySelector("#viewport");
const status=document.querySelector("#status");
const controlsEl=document.querySelector("#controls");
const techStatus=document.querySelector("#techStatus");

const state=Object.fromEntries(CONTROLS.map(c=>[c.id,c.value]));
const inputs=new Map();

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38, innerWidth/innerHeight, .01, 50);
camera.position.set(0,1.05,4.0);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const orbit=new OrbitControls(camera, renderer.domElement);
orbit.target.set(0,.75,0);
orbit.enableDamping=true;
orbit.minDistance=2.3;
orbit.maxDistance=7;

scene.add(new THREE.HemisphereLight(0xffffff,0x303030,2.2));
const key=new THREE.DirectionalLight(0xffffff,2.6); key.position.set(3,4,4); scene.add(key);
const rim=new THREE.DirectionalLight(0xffffff,1.1); rim.position.set(-4,2,-3); scene.add(rim);

let fallback=new FallbackBody();
scene.add(fallback);
let mhMesh=null, mhBase=null, mhTargets={};

function buildUI(){
  for(const c of CONTROLS){
    const row=document.createElement("div"); row.className="control";
    const label=document.createElement("label"); label.textContent=c.label;
    const input=document.createElement("input");
    input.type="range"; input.min=c.min; input.max=c.max; input.step=c.step; input.value=c.value;
    const output=document.createElement("output"); output.value=Number(c.value).toFixed(2);
    input.addEventListener("input",()=>{
      state[c.id]=Number(input.value);
      output.value=Number(input.value).toFixed(2);
      document.querySelectorAll(".presets button").forEach(b=>b.classList.remove("active"));
      updateBody();
    });
    row.append(label,input,output); controlsEl.append(row);
    inputs.set(c.id,{input,output});
  }
}
buildUI();

function syncUI(){
  for(const [id,o] of inputs){
    o.input.value=state[id]; o.output.value=Number(state[id]).toFixed(2);
  }
}
function reset(){
  for(const c of CONTROLS) state[c.id]=c.value;
  syncUI(); updateBody();
}
document.querySelector("#reset").addEventListener("click",reset);

document.querySelectorAll("[data-preset]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    reset();
    Object.assign(state, PRESETS[btn.dataset.preset]||{});
    syncUI(); updateBody();
    document.querySelectorAll(".presets button").forEach(b=>b.classList.toggle("active",b===btn));
  });
});

async function tryLoadMakeHuman(){
  try{
    const manifestRes=await fetch("./manifest.json",{cache:"no-store"});
    if(!manifestRes.ok) throw new Error("manifest missing");
    const manifest=await manifestRes.json();

    const obj=await new OBJLoader().loadAsync(manifest.base);
    let mesh=null;
    obj.traverse(o=>{ if(o.isMesh && !mesh) mesh=o; });
    if(!mesh) throw new Error("no mesh in base OBJ");

    mesh.geometry=mesh.geometry.toNonIndexed();
    mesh.geometry.computeVertexNormals();
    mesh.material=new THREE.MeshStandardMaterial({roughness:.78});
    mhBase=new Float32Array(mesh.geometry.attributes.position.array);
    mhMesh=mesh;
    mhMesh.scale.setScalar(manifest.scale ?? .1);
    mhMesh.position.y=manifest.yOffset ?? -1.1;

    for(const [id,desc] of Object.entries(manifest.targets||{})){
      const list=Array.isArray(desc)?desc:[desc];
      mhTargets[id]=[];
      for(const entry of list){
        mhTargets[id].push({
          amount:entry.amount ?? 1,
          rows:await fetchTarget(entry.file)
        });
      }
    }

    scene.remove(fallback);
    scene.add(mhMesh);
    fallback=null;
    status.textContent=`MakeHuman aktiv · ${Object.keys(mhTargets).length} Slider mit Targets`;
    techStatus.textContent="MakeHuman Base-Mesh und Target-Manifest erfolgreich geladen.";
    updateBody();
  }catch(err){
    console.info("MakeHuman assets not loaded:",err.message);
  }
}

function updateMakeHuman(){
  if(!mhMesh || !mhBase) return;
  const pos=mhMesh.geometry.attributes.position;
  const out=new Float32Array(mhBase);
  for(const [id,value] of Object.entries(state)){
    const bundles=mhTargets[id];
    if(!bundles) continue;
    for(const b of bundles) applySparseTarget(mhBase,b.rows,value*b.amount,out);
  }
  pos.array.set(out);
  pos.needsUpdate=true;
  mhMesh.geometry.computeVertexNormals();
  mhMesh.geometry.computeBoundingSphere();
}

function updateBody(){
  if(fallback) fallback.update(state);
  else updateMakeHuman();
}
updateBody();
tryLoadMakeHuman();

function onResize(){
  const w=innerWidth,h=innerHeight;
  camera.aspect=w/h; camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
}
addEventListener("resize",onResize); onResize();

renderer.setAnimationLoop(()=>{
  orbit.update();
  renderer.render(scene,camera);
});
