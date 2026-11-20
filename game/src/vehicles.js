// SUNCOAST: HEATLINE — vehicles: the HEATLINE GT hero coupe, traffic cars,
// police interceptors and the SKY-1 helicopter. All geometry is original,
// built from primitives with the §4 proportions (length ~2.4x width, low
// sloped hood, raked glass, flared arches, spoiler, twin exhausts).
import * as THREE from '../vendor/three.module.min.js';

const paint = new THREE.MeshStandardMaterial({ color: 0xb3121f, roughness: 0.25, metalness: 0.65 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x18242e, roughness: 0.08, metalness: 0.9 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.6, metalness: 0.4 });
const tyreMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.95 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.25, metalness: 0.9 });

export function makeWheel() {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16), tyreMat);
  tyre.rotation.z = Math.PI / 2; g.add(tyre);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.32, 10), rimMat);
  rim.rotation.z = Math.PI / 2; g.add(rim);
  return g;
}

export function makeHeroCar() {
  const car = new THREE.Group();
  // Main body: low slab; hood slopes down toward the nose (-0.16 rad).
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.62, 4.8), paint);
  body.position.y = 0.62; car.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.34, 1.5), paint);
  hood.position.set(0, 0.86, 1.55); hood.rotation.x = -0.16; car.add(hood);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.3), trimMat);
  nose.position.set(0, 0.5, 2.42); car.add(nose);
  // Grille band + headlights.
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.7 }));
  grille.position.set(0, 0.62, 2.56); car.add(grille);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff6c0, emissive: 0xffedb0, emissiveIntensity: 0.9 });
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.06), lightMat);
    hl.position.set(s * 0.62, 0.78, 2.52); car.add(hl);
  }
  // Cabin + raked glass (-0.62 rad): windshield, rear glass, side windows.
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 1.9), paint);
  cabin.position.set(0, 1.12, -0.35); car.add(cabin);
  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.15), glassMat);
  shield.position.set(0, 1.28, 0.62); shield.rotation.x = -0.62; car.add(shield);
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.0), glassMat);
  rearGlass.position.set(0, 1.28, -1.32); rearGlass.rotation.x = 0.62; car.add(rearGlass);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 1.7), glassMat);
    side.position.set(s * 0.86, 1.16, -0.35); car.add(side);
  }
  // Driver: torso + helmet, readable through the glass and above the door line.
  const driverMat = new THREE.MeshStandardMaterial({ color: 0x2e4057, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.35), driverMat);
  torso.position.set(-0.38, 1.18, -0.3); car.add(torso);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 }));
  helmet.position.set(-0.38, 1.56, -0.3); car.add(helmet);
  // Flared arches (torus segments) + real wheels.
  const archMat = new THREE.MeshStandardMaterial({ color: 0x8f0e18, roughness: 0.4, metalness: 0.5 });
  car.userData.wheels = [];
  for (const [wx, wz] of [[-0.95, 1.55], [0.95, 1.55], [-0.95, -1.55], [0.95, -1.55]]) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.09, 8, 16, Math.PI), archMat);
    arch.position.set(wx, 0.42, wz); arch.rotation.y = Math.PI / 2; arch.rotation.z = 0; car.add(arch);
    const w = makeWheel(); w.position.set(wx, 0.42, wz); car.add(w); car.userData.wheels.push(w);
  }
  // Rear spoiler on short mounts + twin exhausts + brake light bar.
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.42), paint);
  wing.position.set(0, 1.32, -2.3); car.add(wing);
  for (const s of [-1, 1]) {
    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), trimMat);
    mount.position.set(s * 0.6, 1.12, -2.3); car.add(mount);
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.3 }));
    ex.rotation.x = Math.PI / 2; ex.position.set(s * 0.55, 0.42, -2.48); car.add(ex);
  }
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff2020, emissiveIntensity: 0.7 });
  const brake = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.06), brakeMat);
  brake.position.set(0, 0.86, -2.44); car.add(brake);
  car.userData.brakeMat = brakeMat;
  return car;
}

function simpleCar(color, police = false) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 4.2), mat);
  body.position.y = 0.6; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.0),
    police ? mat : glassMat);
  cab.position.set(0, 1.1, -0.2); g.add(cab);
  for (const [wx, wz] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]]) {
    const w = makeWheel(); w.position.set(wx, 0.4, wz); g.add(w);
  }
  if (police) {
    const barMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x2244ff, emissiveIntensity: 1.2 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.3), barMat);
    bar.position.set(0, 1.42, -0.2); g.add(bar); g.userData.barMat = barMat;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 1.6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    door.position.set(-0.96, 0.62, 0); g.add(door);
  }
  return g;
}

export function makeTrafficCar(color) { return simpleCar(color, false); }
export function makePoliceCar() { return simpleCar(0x1a1a22, true); }

export function makeHeli() {
  const heli = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1c2733, roughness: 0.4, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 6.5), bodyMat);
  heli.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 1.6), glassMat);
  nose.position.set(0, 0.2, 3.6); heli.add(nose);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 6.5, 8), bodyMat);
  boom.rotation.x = Math.PI / 2; boom.position.set(0, 0.5, -6); heli.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 1.4), bodyMat);
  fin.position.set(0, 1.4, -9); heli.add(fin);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.3), trimMat);
  tailRotor.position.set(0.5, 0.6, -9); heli.add(tailRotor);
  heli.userData.tailRotor = tailRotor;
  // Main rotor: blur disc + blade tips, spins visibly.
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.08, 32),
    new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.28, depthWrite: false }));
  disc.position.y = 1.5; heli.add(disc);
  const rotor = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 6.2), trimMat);
    blade.position.z = 3.1; const holder = new THREE.Group(); holder.rotation.y = (i / 4) * Math.PI * 2;
    holder.add(blade); rotor.add(holder);
  }
  rotor.position.y = 1.45; heli.add(rotor); heli.userData.rotor = rotor;
  for (const s of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 5.5, 6), trimMat);
    skid.rotation.x = Math.PI / 2; skid.position.set(s * 1.2, -1.35, 0); heli.add(skid);
  }
  // Spotlight cone + light pool on the road. Cone is narrow and bright enough
  // to read as a volume against the sunset sky; pool lands on the road.
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(6, 42, 20, 1, true), coneMat);
  cone.position.y = -22; heli.add(cone); heli.userData.cone = cone;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(7, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.5, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -41.5; heli.add(pool); heli.userData.pool = pool;
  heli.scale.set(1.6, 1.6, 1.6);
  return heli;
}

// On-foot player: simple articulated figure with a visible pistol in hand.
export function makePlayer() {
  const g = new THREE.Group();
  const jacket = new THREE.MeshStandardMaterial({ color: 0x27324a, roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc98d64, roughness: 0.8 });
  const legs = new THREE.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.36), jacket);
  torso.position.y = 1.15; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skin);
  head.position.y = 1.78; g.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0xb3121f }));
  cap.position.y = 1.96; g.add(cap);
  g.userData.limbs = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.66, 0.16), jacket);
    arm.position.set(s * 0.4, 1.2, 0); g.add(arm); g.userData.limbs.push(arm);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), legs);
    leg.position.set(s * 0.16, 0.45, 0); g.add(leg); g.userData.limbs.push(leg);
  }
  // Pistol held forward in the right hand — LARGE, visible from the shot camera.
  const gun = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.35 }));
  gun.add(barrel);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x333333 }));
  grip.position.set(0, -0.18, -0.2); gun.add(grip);
  gun.position.set(0.55, 1.32, 0.55); gun.rotation.x = -0.15; gun.rotation.y = -0.35; g.add(gun);
  g.userData.gun = gun;
  // Muzzle flash sprite (hidden until fired; staged shots hold it visible).
  // Small diamond so it reads as a burst, not a flat square.
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7),
    new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  flash.rotation.z = 0.6;
  flash.position.set(0.55, 1.35, 1.05); g.add(flash); g.userData.flash = flash;
  return g;
}

export function makeEnemy() {
  const g = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: 0x5a2e2e, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.34), shirt);
  torso.position.y = 1.12; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xd9a077 }));
  head.position.y = 1.74; g.add(head);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.78, 0.19),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
    leg.position.set(s * 0.15, 0.42, 0); g.add(leg);
  }
  // Health bar above the head (sprite pair) — large enough to read at shot distance.
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.16), new THREE.MeshBasicMaterial({ color: 0x330000, depthWrite: false }));
  bg.position.y = 2.3; g.add(bg);
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.11), new THREE.MeshBasicMaterial({ color: 0x3ddc5a, depthWrite: false }));
  fg.position.set(0, 2.3, 0.01); g.add(fg); g.userData.hpBar = fg;
  g.userData.hp = 100;
  return g;
}
