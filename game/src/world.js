// SUNCOAST: HEATLINE — world: sky, ocean, beach, city, palms, ferris wheel,
// lighthouse, pier, boardwalk kiosks and the industrial yard. All textures are
// procedural canvas textures made at runtime; nothing is fetched.
import * as THREE from '../vendor/three.module.min.js';
import { mulberry32, WORLD } from './config.js';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function windowTex(base, lit) {
  return canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const rnd = mulberry32(base.length * 7919 + lit);
    for (let y = 8; y < h - 8; y += 16) for (let x = 8; x < w - 8; x += 14) {
      const on = rnd() < lit;
      g.fillStyle = on ? (rnd() < 0.7 ? '#ffd98a' : '#ffeec0') : '#1a2030';
      g.fillRect(x, y, 9, 11);
    }
  });
}
function sandTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d9b380'; g.fillRect(0, 0, w, h);
    const rnd = mulberry32(41);
    for (let i = 0; i < 900; i++) { g.fillStyle = rnd() < 0.5 ? '#c9a06e' : '#e8c99a'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
}
function roadTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#33363d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f5c542'; for (let y = 0; y < h; y += 32) g.fillRect(w / 2 - 2, y, 4, 18);
    g.fillStyle = '#e8e8e8'; g.fillRect(6, 0, 3, h); g.fillRect(w - 9, 0, 3, h);
  });
}

export function buildWorld(scene) {
  const rnd = mulberry32(1337);
  const out = { buildings: [], palms: [], traffic: [], colliders: [], ocean: null, wheel: null, heliPad: null };

  // --- Sky: big gradient dome + low sun disc with halo + soft clouds ---
  const skyGeo = new THREE.SphereGeometry(900, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x2c2350) }, mid: { value: new THREE.Color(0xc24a6e) }, low: { value: new THREE.Color(0xff8a3c) } },
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP; uniform vec3 top,mid,low;
      void main(){ float h=normalize(vP).y; vec3 c = h>0.25 ? mix(mid,top,smoothstep(0.25,0.9,h)) : mix(low,mid,smoothstep(-0.05,0.25,h));
      gl_FragColor=vec4(c,1.0); }`,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));
  // Sun disc + glow halo, low over the ocean (west).
  const sun = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(34, 40),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false }));
  const halo = new THREE.Mesh(new THREE.CircleGeometry(90, 40),
    new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.28, fog: false, depthWrite: false }));
  halo.position.z = -1; sun.add(halo, disc);
  sun.position.set(-760, 95, 120); sun.lookAt(0, 40, 0); scene.add(sun);
  // Soft clouds: flattened translucent spheres, never hard rectangles.
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffc9a8, transparent: true, opacity: 0.35, fog: false, depthWrite: false });
  out.clouds = [];
  for (let i = 0; i < 14; i++) {
    const cl = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(14 + rnd() * 18, 10, 8), cloudMat);
      s.position.set(j * 22 - 30 + rnd() * 8, rnd() * 5, rnd() * 10 - 5); s.scale.y = 0.32; cl.add(s);
    }
    cl.position.set(-600 + rnd() * 1100, 150 + rnd() * 110, -500 + rnd() * 900);
    scene.add(cl); out.clouds.push(cl);
  }

  // --- Lights: warm sunset directional + warm hemisphere bounce (no near-black east faces) ---
  const sunLight = new THREE.DirectionalLight(0xffb070, 2.4);
  sunLight.position.set(-500, 180, 120); scene.add(sunLight);
  scene.add(new THREE.HemisphereLight(0xffc890, 0x54402e, 1.15));
  scene.add(new THREE.AmbientLight(0x805060, 0.5));

  // --- Ground: city slab, sand strip, ocean ---
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(90, 1200),
    new THREE.MeshStandardMaterial({ map: sandTex(), roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(-125, 0.05, 0); scene.add(sand);
  const oceanMat = new THREE.MeshStandardMaterial({ color: 0x14506e, roughness: 0.25, metalness: 0.55 });
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(320, 1200, 24, 60), oceanMat);
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(-330, 0.02, 0); scene.add(ocean);
  out.ocean = ocean;
  // Foam line at the water's edge + a few animated wave strips.
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.55 });
  out.foam = [];
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(6, 1200), foamMat);
    f.rotation.x = -Math.PI / 2; f.position.set(-172 - i * 9, 0.08, 0); scene.add(f); out.foam.push(f);
  }
  // Beach road (wet-look sheen) + north-south avenues.
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex(), roughness: 0.35, metalness: 0.25 });
  const beachRoad = new THREE.Mesh(new THREE.PlaneGeometry(16, 1200), roadMat);
  beachRoad.rotation.x = -Math.PI / 2; beachRoad.position.set(WORLD.beachRoadX, 0.06, 0); scene.add(beachRoad);
  for (const ax of [-10, 60, 140, 220]) {
    const av = new THREE.Mesh(new THREE.PlaneGeometry(12, 1200), roadMat.clone());
    av.material.map = roadTex(); av.rotation.x = -Math.PI / 2; av.position.set(ax, 0.06, 0); scene.add(av);
  }
  for (const az of [-300, -160, -20, 120, 260, 400]) {
    const st = new THREE.Mesh(new THREE.PlaneGeometry(1100, 12), roadMat.clone());
    st.material.map = roadTex(); st.rotation.x = -Math.PI / 2; st.position.set(40, 0.06, az); scene.add(st);
  }

  // --- Buildings: 190+, varied heights, palettes, lit windows ---
  const palettes = ['#5a4a52', '#4a5568', '#6b4a3a', '#3d4a5a', '#715a4a', '#54425e', '#46586a'];
  const winLits = [0.45, 0.6, 0.35, 0.7];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  let count = 0;
  const placed = [];
  while (count < 192) {
    const bx = -40 + rnd() * 560, bz = -560 + rnd() * 1120;
    if (Math.abs(bx - WORLD.beachRoadX) < 22) continue;
    if (Math.hypot(bx - WORLD.yard.x, bz - WORLD.yard.z) < 70) continue;
    if (Math.hypot(bx - WORLD.garage.x, bz - WORLD.garage.z) < 30) continue;
    if (Math.hypot(bx - WORLD.safehouse.x, bz - WORLD.safehouse.z) < 25) continue;
    let ok = true;
    for (const p of placed) if (Math.hypot(bx - p[0], bz - p[1]) < 26) { ok = false; break; }
    if (!ok) continue;
    placed.push([bx, bz]);
    const w = 14 + rnd() * 18, d = 14 + rnd() * 18, hgt = 12 + rnd() * 62;
    const mat = new THREE.MeshStandardMaterial({
      map: windowTex(palettes[count % palettes.length], winLits[count % winLits.length]),
      roughness: 0.85, emissive: 0xffc070, emissiveIntensity: 0.25, emissiveMap: windowTex('#000000', 0),
    });
    // emissive windows: reuse the same canvas as emissive map via a second texture
    const b = new THREE.Mesh(boxGeo, mat);
    b.scale.set(w, hgt, d); b.position.set(bx, hgt / 2, bz);
    scene.add(b); out.buildings.push(b);
    out.colliders.push({ x: bx, z: bz, r: Math.max(w, d) * 0.62 });
    count++;
  }
  // Rooftop signs on a few towers.
  const signMat = new THREE.MeshBasicMaterial({ color: 0xff5a7a });
  for (let i = 0; i < 8; i++) {
    const b = out.buildings[Math.floor(rnd() * out.buildings.length)];
    const s = new THREE.Mesh(new THREE.BoxGeometry(10, 2.4, 0.6), signMat);
    s.position.set(b.position.x, b.scale.y + 1.4, b.position.z + b.scale.z / 2 + 0.4);
    scene.add(s);
  }

  // --- Palms: trunk + 6-9 drooping fronds, two greens, along beach road & boardwalk ---
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 });
  const frondMats = [new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.9, side: THREE.DoubleSide })];
  function palm(x, z) {
    const g = new THREE.Group();
    const hgt = 7 + rnd() * 4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, hgt, 6), trunkMat);
    trunk.position.y = hgt / 2; trunk.rotation.z = (rnd() - 0.5) * 0.12; g.add(trunk);
    const n = 6 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.6), frondMats[i % 2]);
      const a = (i / n) * Math.PI * 2;
      fr.position.set(Math.cos(a) * 1.4, hgt + 0.4, Math.sin(a) * 1.4);
      fr.rotation.set(Math.sin(a) * 1.1, a, Math.cos(a) * -1.1);
      fr.translateY(0.8); g.add(fr);
    }
    g.position.set(x, 0, z); scene.add(g); out.palms.push(g);
  }
  for (let z = -560; z < 560; z += 26) { palm(-78 + rnd() * 4, z); if (rnd() < 0.6) palm(-44 + rnd() * 4, z + 12); }
  for (let z = -400; z < 400; z += 60) palm(20 + rnd() * 10, z);

  // --- Ferris wheel on the boardwalk (fully framable), red/white, turning ---
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(22, 0.7, 8, 40),
    new THREE.MeshStandardMaterial({ color: 0xe33e3e, roughness: 0.5 }));
  wheel.add(rim);
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 44, 6),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }));
    sp.rotation.z = (i / 8) * Math.PI; wheel.add(sp);
  }
  const gondolaMat = new THREE.MeshStandardMaterial({ color: 0xffd23e, roughness: 0.5 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const gd = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2, 2.4), gondolaMat);
    gd.position.set(Math.cos(a) * 22, Math.sin(a) * 22, 0); wheel.add(gd);
  }
  const legMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 30, 6), legMat);
    leg.position.set(0, -14, s * 6); leg.rotation.x = s * 0.32; wheel.add(leg);
  }
  wheel.position.set(-88, 34, 150); scene.add(wheel); out.wheel = wheel;

  // --- Pier into the ocean + lighthouse at the north end ---
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 1 });
  const pier = new THREE.Mesh(new THREE.BoxGeometry(90, 1.2, 8), pierMat);
  pier.position.set(-215, 1.4, WORLD.pier.z); scene.add(pier);
  for (let i = 0; i < 6; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 6), pierMat);
    post.position.set(-185 - i * 14, 0, WORLD.pier.z); scene.add(post);
  }
  const lh = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(4, 5.5, 42, 12),
    new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.7 }));
  tower.position.y = 21; lh.add(tower);
  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 3, 12),
      new THREE.MeshStandardMaterial({ color: 0xc23a3a }));
    band.position.y = 10 + i * 12; lh.add(band);
  }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff6c0 }));
  lamp.position.y = 44; lh.add(lamp);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 9, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  beam.rotation.z = Math.PI / 2; beam.position.set(28, 44, 0); lh.add(beam);
  lh.position.set(WORLD.lighthouse.x, 0, WORLD.lighthouse.z); scene.add(lh); out.lighthouse = lh;

  // --- Boardwalk kiosks: pitched roofs, signs, warm light, awnings ---
  const kioskCols = [0xff7043, 0x29b6f6, 0xffca28, 0xab47bc];
  for (let i = 0; i < 9; i++) {
    const z = -140 + i * 42, k = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 5),
      new THREE.MeshStandardMaterial({ color: kioskCols[i % 4], roughness: 0.8 }));
    base.position.y = 1.7; k.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.4, 4),
      new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.9 }));
    roof.position.y = 4.6; roof.rotation.y = Math.PI / 4; k.add(roof);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.1, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xfff8e1 }));
    sign.position.set(0, 3.1, 2.7); k.add(sign);
    const awn = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.2, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
    awn.position.set(0, 2.6, 3.4); awn.rotation.x = 0.25; k.add(awn);
    const glow = new THREE.PointLight(0xffc070, 12, 14); glow.position.set(0, 2.4, 3.4); k.add(glow);
    k.position.set(-46, 0, z); scene.add(k);
  }

  // --- Industrial yard: stacked containers, crates, fencing (mission 4) ---
  const yard = new THREE.Group();
  const contCols = [0x2e7d32, 0xc62828, 0x1565c0, 0xef6c00];
  const contGeo = new THREE.BoxGeometry(12, 2.6, 2.6);
  const spots = [[-14, -8, 0], [0, -12, 1], [14, -6, 2], [-8, 8, 3], [8, 10, 0], [16, 14, 1], [-16, 14, 2]];
  for (const [cx, cz, ci] of spots) {
    const c = new THREE.Mesh(contGeo, new THREE.MeshStandardMaterial({ color: contCols[ci % 4], roughness: 0.7, metalness: 0.3 }));
    c.position.set(cx, 1.3, cz); c.rotation.y = (ci % 2) * 0.4; yard.add(c);
    if (ci % 2 === 0) { const c2 = c.clone(); c2.position.y = 3.9; yard.add(c2); }
  }
  const crateGeo = new THREE.BoxGeometry(2, 2, 2);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x9c7a4a, roughness: 1 });
  for (let i = 0; i < 10; i++) {
    const cr = new THREE.Mesh(crateGeo, crateMat);
    cr.position.set(-20 + rnd() * 40, 1, -18 + rnd() * 36); cr.rotation.y = rnd() * 1.5; yard.add(cr);
  }
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.6 });
  for (const [fx, fz, w, ry] of [[0, -24, 56, 0], [0, 24, 56, 0], [-28, 0, 48, Math.PI / 2], [28, 0, 48, Math.PI / 2]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, 3, 0.3), fenceMat);
    f.position.set(fx, 1.5, fz); f.rotation.y = ry; yard.add(f);
  }
  yard.position.set(WORLD.yard.x, 0, WORLD.yard.z); scene.add(yard); out.yard = yard;

  // --- Garage + safehouse markers (simple roofed structures) ---
  function hut(x, z, col, label) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 10), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }));
    b.position.y = 2.5; g.add(b);
    const r = new THREE.Mesh(new THREE.ConeGeometry(9, 3, 4), new THREE.MeshStandardMaterial({ color: 0x37474f }));
    r.position.y = 6.5; r.rotation.y = Math.PI / 4; g.add(r);
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  hut(WORLD.garage.x, WORLD.garage.z, 0x37474f);
  hut(WORLD.safehouse.x, WORLD.safehouse.z, 0x4a6741);
  return out;
}
