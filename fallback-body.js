import * as THREE from "three";

function capsule(r, len, mat, radial=20) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, radial), mat);
}
function sphere(rx, ry, rz, mat) {
  const g = new THREE.SphereGeometry(1, 28, 18);
  const m = new THREE.Mesh(g, mat);
  m.scale.set(rx, ry, rz);
  return m;
}

export class FallbackBody extends THREE.Group {
  constructor() {
    super();
    this.mat = new THREE.MeshStandardMaterial({roughness:.78, metalness:0});
    this.parts = {};
    this.build();
  }

  build() {
    const mat=this.mat;
    const pelvis=sphere(.31,.27,.22,mat); pelvis.position.y=1.03;
    const torso=sphere(.34,.47,.20,mat); torso.position.y=1.52;
    const chest=sphere(.36,.28,.22,mat); chest.position.y=1.73;
    const head=sphere(.16,.22,.16,mat); head.position.y=2.23;
    const neck=capsule(.095,.10,mat); neck.position.y=2.01;

    const lArm=capsule(.075,.52,mat); lArm.position.set(-.43,1.55,0); lArm.rotation.z=.10;
    const rArm=capsule(.075,.52,mat); rArm.position.set(.43,1.55,0); rArm.rotation.z=-.10;
    const lLeg=capsule(.11,.74,mat); lLeg.position.set(-.16,.43,0);
    const rLeg=capsule(.11,.74,mat); rLeg.position.set(.16,.43,0);

    this.parts={pelvis,torso,chest,head,neck,lArm,rArm,lLeg,rLeg};
    Object.values(this.parts).forEach(p=>this.add(p));
    this.position.y=-1.1;
  }

  update(p) {
    const sex = p.gender ?? .5;
    const weight = p.weight ?? .5;
    const muscle = p.muscle ?? .5;
    const height = p.height ?? .5;
    const chestD = p.chest ?? 0;
    const shoulders = p.shoulders ?? 0;
    const waist = p.waist ?? 0;
    const hips = p.hips ?? 0;
    const butt = p.butt ?? 0;
    const thighs = p.thighs ?? 0;
    const calves = p.calves ?? 0;
    const arms = p.arms ?? 0;
    const breast = p.breastSize ?? .5;

    const bulk = (weight-.5)*.34 + (muscle-.5)*.12;
    const male = sex-.5;
    const h = .86 + height*.28;

    this.scale.y=h;

    this.parts.torso.scale.set(
      1 + bulk + shoulders*.10 + male*.06,
      1,
      1 + bulk*.7 + chestD*.08
    );
    this.parts.chest.scale.set(
      1 + bulk + shoulders*.12 + chestD*.14 + male*.08,
      1,
      1 + bulk*.65 + chestD*.12 + (breast-.5)*.16
    );
    this.parts.pelvis.scale.set(
      1 + bulk + hips*.18 - male*.07,
      1 + weight*.06,
      1 + bulk*.6 + butt*.20
    );

    const waistFactor = 1 + bulk*.55 + waist*.14 - (1-sex)*.035;
    this.parts.torso.scale.x *= waistFactor;

    const armScale = 1 + bulk*.35 + muscle*.08 + arms*.14;
    this.parts.lArm.scale.x=this.parts.lArm.scale.z=armScale;
    this.parts.rArm.scale.x=this.parts.rArm.scale.z=armScale;
    const legScale = 1 + bulk*.30 + thighs*.12 + calves*.06;
    this.parts.lLeg.scale.x=this.parts.lLeg.scale.z=legScale;
    this.parts.rLeg.scale.x=this.parts.rLeg.scale.z=legScale;

    const shoulderX = .43 * (1+shoulders*.16+male*.08);
    this.parts.lArm.position.x=-shoulderX;
    this.parts.rArm.position.x= shoulderX;
    const hipX=.16*(1+hips*.12);
    this.parts.lLeg.position.x=-hipX;
    this.parts.rLeg.position.x= hipX;
  }
}
