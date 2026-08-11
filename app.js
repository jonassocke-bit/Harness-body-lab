import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MACRO, DETAIL, BREAST } from "./morph-data.js";

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

const defs=[
 {id:"gender",label:"Female ↔ Male",group:"macro",min:0,max:1,value:.5,display:v=>Math.round(v*100)},
 {id:"weight",label:"Weight",group:"macro",min:0,max:1,value:.5,display:v=>Math.round(v*100)},
 {id:"muscle",label:"Muscle",group:"macro",min:0,max:1,value:.5,display:v=>Math.round(v*100)},
 {id:"height",label:"Height",group:"macro",min:.88,max:1.12,value:1,display:v=>Math.round(v*182)},

 {id:"shoulders",label:"Shoulders",group:"torso"},{id:"vshape",label:"V-Shape",group:"torso"},
 {id:"breastSize",label:"Breast size",group:"torso",min:0,max:1,value:.5,display:v=>Math.round(v*100)},
 {id:"breastFirmness",label:"Breast firmness",group:"torso",min:0,max:1,value:.5,display:v=>Math.round(v*100)},
 {id:"bust",label:"Chest circumference",group:"torso"},{id:"underbust",label:"Underbust",group:"torso"},
 {id:"waist",label:"Waist",group:"torso"},

 {id:"hips",label:"Hips",group:"leg"},{id:"butt",label:"Butt",group:"leg"},
 {id:"thigh",label:"Thigh",group:"leg"},{id:"knee",label:"Knee",group:"leg"},
 {id:"calf",label:"Calf",group:"leg"},{id:"ankle",label:"Ankle",group:"leg"},

 {id:"neck",label:"Neck",group:"arm"},{id:"upperarm",label:"Upper arm",group:"arm"},
 {id:"wrist",label:"Wrist",group:"arm"}
].map(d=>({...{min:-1,max:1,value:0,display:v=>(v>0?"+":"")+Math.round(v*100)},...d}));

const state=Object.fromEntries(defs.map(d=>[d.id,d.value]));
const inputs=new Map();
function mkUI(){
 const groups={macro:"#macroControls",torso:"#torsoControls",leg:"#legControls",arm:"#armControls"};
 for(const d of defs){
  const row=document.createElement("div");row.className="control";
  const lab=document.createElement("label");lab.textContent=d.label;
  const inp=document.createElement("input");inp.type="range";inp.min=d.min;inp.max=d.max;inp.step=d.id==="height"?".005":".01";inp.value=d.value;
  const out=document.createElement("output");out.textContent=d.display(d.value);
  inp.addEventListener("input",()=>{state[d.id]=+inp.value;out.textContent=d.display(state[d.id]);updateBody()});
  row.append(lab,inp,out);document.querySelector(groups[d.group]).append(row);inputs.set(d.id,{inp,out,d});
 }
}
mkUI();

function triWeights(v){
 return {
  min:Math.max(0,1-v*2),
  avg:1-Math.abs(v-.5)*2,
  max:Math.max(0,v*2-1)
 };
}
function applyFlat(out,flat,amount){
 if(!flat||Math.abs(amount)<1e-6)return;
 for(let k=0;k<flat.length;k+=4){
  const i=flat[k]*3;
  out[i]+=flat[k+1]*scaleFactor*amount;
  out[i+1]+=flat[k+2]*scaleFactor*amount;
  out[i+2]-=flat[k+3]*scaleFactor*amount;
 }
}

function linkedDetailValues(){
 const v={};
 for(const k of Object.keys(DETAIL))v[k]=state[k]||0;
 if(!document.querySelector("#linked").checked)return v;
 const s=+document.querySelector("#linkStrength").value;

 // Neighbour correlations are intentionally modest. Global Weight/Muscle already handle
 // the main whole-body biological correlation via genuine MakeHuman macro targets.
 const add=(to,from,c)=>v[to]=(v[to]||0)+(state[from]||0)*c*s;
 add("butt","hips",.24); add("thigh","hips",.16);
 add("calf","thigh",.25); add("butt","thigh",.12); add("knee","thigh",.10);
 add("ankle","calf",.12);
 add("underbust","bust",.22);
 add("vshape","shoulders",.30); add("upperarm","shoulders",.10);
 add("wrist","upperarm",.08);
 add("neck","shoulders",.07);
 for(const k of Object.keys(v))v[k]=Math.max(-1,Math.min(1,v[k]));
 return v;
}

let body=null,base=null,scaleFactor=1;
function updateBody(){
 if(!body||!base)return;
 const out=new Float32Array(base);

 // TRUE MakeHuman adult-young macro blend:
 const gw={female:1-state.gender,male:state.gender};
 const mw=triWeights(state.muscle), ww=triWeights(state.weight);
 const muscleNames={min:"minmuscle",avg:"averagemuscle",max:"maxmuscle"};
 const weightNames={min:"minweight",avg:"averageweight",max:"maxweight"};

 for(const sex of ["female","male"]){
  for(const m of ["min","avg","max"]){
   for(const w of ["min","avg","max"]){
    const a=gw[sex]*mw[m]*ww[w];
    if(a<=0)continue;
    applyFlat(out,MACRO[`${sex}|${muscleNames[m]}|${weightNames[w]}`],a);
   }
  }
 }

 // MakeHuman breast system. Only the female component contributes these targets.
 // At Gender=Male the breast-specific morph therefore fades completely out.
 const cw=triWeights(state.breastSize);
 const fw=triWeights(state.breastFirmness);
 const cupNames={min:"mincup",avg:"averagecup",max:"maxcup"};
 const firmNames={min:"minfirmness",avg:"averagefirmness",max:"maxfirmness"};
 const femaleAmount=1-state.gender;
 if(femaleAmount>0.0001){
  for(const m of ["min","avg","max"]){
   for(const w of ["min","avg","max"]){
    for(const c of ["min","avg","max"]){
     for(const f of ["min","avg","max"]){
      const a=femaleAmount*mw[m]*ww[w]*cw[c]*fw[f];
      if(a<=0)continue;
      applyFlat(out,BREAST[`${muscleNames[m]}|${weightNames[w]}|${cupNames[c]}|${firmNames[f]}`],a);
     }
    }
   }
  }
 }

 const dv=linkedDetailValues();
 for(const [id,pair] of Object.entries(DETAIL)){
  const x=dv[id]||0;
  if(x<0)applyFlat(out,pair.minus,-x);
  else if(x>0)applyFlat(out,pair.plus,x);
 }

 // Height here is actual display scale; proportions stay untouched.
 const h=state.height;
 for(let i=1;i<out.length;i+=3)out[i]*=h;

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
 const pos=new Float32Array(N*3);
 for(let i=0;i<N;i++){pos[i*3]=verts[i][0];pos[i*3+1]=verts[i][1];pos[i*3+2]=-verts[i][2]}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setIndex(faces);g.computeVertexNormals();return g;
}
async function init(){
 const r=await fetch("./base.obj",{cache:"force-cache"});if(!r.ok)throw new Error("base.obj");
 const g=parseOBJ(await r.text());g.computeBoundingBox();let b=g.boundingBox;
 scaleFactor=1.82/(b.max.y-b.min.y);g.scale(scaleFactor,scaleFactor,scaleFactor);g.computeBoundingBox();b=g.boundingBox;
 g.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);g.computeBoundingBox();
 base=new Float32Array(g.attributes.position.array);
 body=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:0xd8ccc4,roughness:.63,metalness:0,clearcoat:.02,flatShading:false,side:THREE.DoubleSide}));
 scene.add(body);frame();updateBody();document.querySelector("#loading").classList.add("done");
}
function frame(){
 body.geometry.computeBoundingBox();const b=body.geometry.boundingBox,s=new THREE.Vector3(),c=new THREE.Vector3();b.getSize(s);b.getCenter(c);orbit.target.copy(c);
 const vf=THREE.MathUtils.degToRad(camera.fov),hf=2*Math.atan(Math.tan(vf/2)*Math.max(.42,innerWidth/innerHeight));
 const d=Math.max((s.y*.73)/Math.tan(vf/2),(s.x*.70)/Math.tan(hf/2),4.7);
 camera.position.set(c.x,c.y,c.z+d);orbit.maxDistance=Math.max(35,d*7);orbit.update();
}
init().catch(e=>{document.querySelector("#loading strong").textContent="Ladefehler";document.querySelector("#loading small").textContent=String(e)});

// UI: NO SNAPPING. Release = exact position.
const sheet=document.querySelector("#sheet"),handle=document.querySelector("#handle");
let sy=innerHeight*.54,drag=false,startY=0,startSheet=0;
function setSheet(y){sy=Math.max(innerHeight*.08,Math.min(innerHeight*.86,y));sheet.style.setProperty("--y",sy+"px")}
setSheet(sy);
handle.addEventListener("pointerdown",e=>{drag=true;startY=e.clientY;startSheet=sy;handle.setPointerCapture(e.pointerId)});
handle.addEventListener("pointermove",e=>{if(drag)setSheet(startSheet+e.clientY-startY)});
handle.addEventListener("pointerup",()=>{drag=false});
handle.addEventListener("pointercancel",()=>{drag=false});

document.querySelector("#linked").addEventListener("change",()=>{document.querySelector("#linkLabel").textContent=document.querySelector("#linked").checked?"realistisch":"frei";updateBody()});
const ls=document.querySelector("#linkStrength"),lso=ls.parentElement.querySelector("output");
ls.addEventListener("input",()=>{lso.textContent=Math.round(+ls.value*100);updateBody()});
document.querySelector("#reset").addEventListener("click",()=>{
 for(const d of defs){state[d.id]=d.value;const q=inputs.get(d.id);q.inp.value=d.value;q.out.textContent=d.display(d.value)}
 document.querySelector("#linked").checked=true;ls.value=.7;lso.textContent="70";document.querySelector("#linkLabel").textContent="realistisch";updateBody();
});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);setSheet(sy)}
addEventListener("resize",resize);resize();renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera)});
