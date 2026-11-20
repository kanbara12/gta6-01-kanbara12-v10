// SUNCOAST: HEATLINE — boot, loop, driving, missions, police AI, pedestrians,
// combat, HUD and screenshot staging. Plain ES modules, no network anywhere.
import * as THREE from '../vendor/three.module.min.js';
import { WORLD, MISSIONS, REP_AFTER, WANTED_AFTER, START_CASH, YARD_BOUNTY, LOOP_TOTAL, SHOTS, RADIO, WEAPONS, ABILITIES, fmtTime } from './config.js';
import { buildWorld } from './world.js';
import { makeHeroCar, makeTrafficCar, makePoliceCar, makeHeli, makePlayer, makeEnemy } from './vehicles.js';
import { GameAudio } from './audio.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot') || null;
const shotDef = SHOT ? SHOTS[SHOT] : null;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist2d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// ---------- state (one consistent stage: job/cash/REP/done/wanted/timer together) ----------
const S = {
  started: !!shotDef, paused: false, inCar: false, job: 1, cash: START_CASH, rep: 0, done: 0,
  wanted: 0, elapsed: 0, elapsedBase: 0, speed: 0, speedKmh: 0, hp: 100, fuel: 100, cond: 100,
  weapon: 0, station: 0, driftEarn: 0, targetsDown: 0, stashGot: 0, muted: false,
  shotStart: performance.now(), playT: 0, gunCooldown: 0, driftCooldown: 0,
  nearMissCd: 0, garageCd: 0, shotAt: 0, loopClosed: false,
};
const audio = new GameAudio();

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x2a1638, 220, 900);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 2200);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

const world = buildWorld(scene);
const car = makeHeroCar(); scene.add(car);
const player = makePlayer(); scene.add(player);
const heli = makeHeli(); heli.visible = false; scene.add(heli);

// Mission marker: small glowing disc + modest beam (never a giant pillar).
const markerDisc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24),
  new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0.85 }));
markerDisc.rotation.x = -Math.PI / 2; markerDisc.position.y = 0.12; scene.add(markerDisc);
const markerBeam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 7, 16, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
markerBeam.position.y = 3.5; scene.add(markerBeam);
let markerPos = { ...MISSIONS[0].marker };

// Traffic: 18 cars looping the avenues.
const avenues = [-60, -10, 60, 140, 220];
const traffic = [];
for (let i = 0; i < 18; i++) {
  const cols = [0x3a6ea5, 0xc0c0c0, 0x222222, 0x7a4a9a, 0xd8d8d8, 0x4a7a3a];
  const t = makeTrafficCar(cols[i % cols.length]);
  const ax = avenues[i % avenues.length], dir = i % 2 ? 1 : -1;
  t.position.set(ax + (Math.random() - 0.5) * 3, 0, -560 + Math.random() * 1120);
  t.rotation.y = dir > 0 ? 0 : Math.PI;
  t.userData = { ax, dir, speed: 9 + Math.random() * 7, nearCd: 0 };
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.05), hl); h.position.set(s * 0.6, 0.6, 2.12); t.add(h); }
  scene.add(t); traffic.push(t);
}
// Pedestrians: 20 walkers on the sidewalks.
const peds = [];
for (let i = 0; i < 20; i++) {
  const g = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: [0xc0392b, 0x2980b9, 0x27ae60, 0xf39c12, 0x8e44ad, 0xecf0f1][i % 6], roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), shirt); torso.position.y = 1.05; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd9a077 })); head.position.y = 1.6; g.add(head);
  const limbs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), new THREE.MeshStandardMaterial({ color: 0x222831 }));
    leg.position.set(s * 0.13, 0.35, 0); g.add(leg); limbs.push(leg);
  }
  const sideX = i % 2 ? -46 : -78;
  g.position.set(sideX + (Math.random() - 0.5) * 2, 0, -540 + Math.random() * 1080);
  g.userData = { limbs, speed: 1.1 + Math.random() * 0.8, dir: Math.random() < 0.5 ? 1 : -1, walkX: sideX, scatter: 0, phase: Math.random() * 6 };
  scene.add(g); peds.push(g);
}
// Yard enemies (mission 4).
const enemies = [];
const enemySpots = [[150, 140], [128, 165], [155, 162]];
for (const [ex, ez] of enemySpots) {
  const e = makeEnemy(); e.position.set(ex, 0, ez); e.userData.alive = true; scene.add(e); enemies.push(e);
}
// Street-cash stashes ($250 each).
const stashes = [];
for (const [sx, sz] of [[-44, 90], [60, -60], [140, 260]]) {
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x27ae60, emissiveIntensity: 0.8 }));
  s.position.set(sx, 0.5, sz); scene.add(s); stashes.push(s);
}
// Police units + heli (spawned by wanted level).
const police = [];
function spawnPolice() {
  while (police.length < 2) {
    const p = makePoliceCar();
    const a = Math.random() * Math.PI * 2;
    p.position.set(car.position.x + Math.cos(a) * 30, 0, car.position.z + Math.sin(a) * 30);
    p.userData.heading = 0; p.userData.speed = 0; p.userData.status = 'RESPONDING'; p.userData.flash = 0;
    scene.add(p); police.push(p);
  }
  heli.visible = S.wanted >= 3;
}
function clearPolice() { for (const p of police) scene.remove(p); police.length = 0; heli.visible = false; }

// ---------- placement ----------
car.position.set(WORLD.carSpawn.x, 0, WORLD.carSpawn.z);
car.rotation.y = 0; // nose +z, toward the mission-1 marker
let heading = 0, carSpeed = 0; // m/s
player.position.set(-56, 0, WORLD.spawn.z);
player.rotation.y = 0;
let playerHeading = 0, playerSpeed = 0;
let camYaw = 0;

// ---------- input ----------
const keys = {};
addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && !S.started) { startGame(); return; }
  keys[e.code] = true;
  if (e.code === 'KeyH') document.getElementById('hud').classList.toggle('hidden');
  if ((e.code === 'KeyP' || e.code === 'Escape') && S.started && !shotDef) togglePause();
  if (e.code === 'KeyM' && S.started) { S.muted = audio.toggleMute(); }
  if (e.code === 'KeyR' && S.started) { const st = audio.nextStation(); S.station = audio.station; $('radioName').textContent = st.name; $('radioTrack').textContent = st.track; }
  if (e.code === 'KeyE' && S.started && !shotDef) toggleEnterExit();
  if (e.code === 'Digit1') S.weapon = 0; if (e.code === 'Digit2') S.weapon = 1;
  if (e.code === 'Digit3') S.weapon = 2; if (e.code === 'Digit4') S.weapon = 3;
  if (e.code === 'KeyZ' && S.started) { if (S.wanted > 0) { S.wanted--; toast('RAE — CLEAN SLATE: heat down one star'); } }
  if (e.code === 'KeyX' && S.started) toast('SABLE — EYES UP: units marked on the map');
  if (e.code === 'KeyC' && S.started) { S.fuel = 100; toast('MARLO — PIT STOP: tank full'); }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('mousedown', (e) => { if (S.started && !S.inCar && !S.paused && e.button === 0) shoot(); });
$('btnResume').onclick = () => togglePause();
$('btnSave').onclick = () => { localStorage.setItem('suncoast-save', JSON.stringify({ cash: S.cash, rep: S.rep, done: S.done, job: S.job, hp: S.hp, fuel: S.fuel })); toast('Progress saved'); };
$('btnLoad').onclick = () => {
  try { const d = JSON.parse(localStorage.getItem('suncoast-save')); if (d) { Object.assign(S, d); setMissionMarker(); toast('Save loaded'); } } catch (e) {}
};
function startGame() { S.started = true; $('title').classList.add('hidden'); audio.ensure(); }
function togglePause() {
  S.paused = !S.paused; $('pause').style.display = S.paused ? 'flex' : 'none';
  if (S.paused) {
    $('pauseStats').innerHTML = `MONEY $${S.cash.toLocaleString()} &nbsp;•&nbsp; JOBS DONE ${S.done}/8 &nbsp;•&nbsp; STAGE ${S.job}/8<br>` +
      `TARGETS DOWN ${S.targetsDown} &nbsp;•&nbsp; DRIFT EARNINGS $${S.driftEarn} &nbsp;•&nbsp; REP ${S.rep}<br>` +
      `FUEL ${Math.round(S.fuel)}% &nbsp;•&nbsp; WANTED ${'★'.repeat(S.wanted)}${'☆'.repeat(5 - S.wanted)} &nbsp;•&nbsp; HEALTH ${Math.round(S.hp)}`;
  }
}
function toggleEnterExit() {
  if (!S.inCar) {
    if (dist2d(player.position, car.position) < 10) { S.inCar = true; player.visible = false; toast('Entered the HEATLINE GT'); }
  } else { S.inCar = false; player.visible = true; player.position.set(car.position.x + 2.5, 0, car.position.z + 2.5); }
}

// ---------- missions ----------
function setMissionMarker() {
  if (S.job > 8) { markerDisc.visible = markerBeam.visible = false; return; }
  markerPos = { ...MISSIONS[S.job - 1].marker };
  markerDisc.position.set(markerPos.x, 0.12, markerPos.z);
  markerBeam.position.set(markerPos.x, 3.5, markerPos.z);
}
function missionTitle() { return S.job > 8 ? 'LOOP COMPLETE' : MISSIONS[S.job - 1].title; }
function completeMission() {
  const m = MISSIONS[S.job - 1];
  S.cash += m.payout; S.done++; S.rep = REP_AFTER[S.job]; S.job++;
  S.wanted = WANTED_AFTER[Math.min(S.job - 1, 8)] ?? S.wanted;
  audio.pickup();
  if (S.job > 8) { S.loopClosed = true; toast(`LOOP COMPLETE — $${LOOP_TOTAL.toLocaleString()}`); }
  else { toast(`JOB DONE: ${m.title} +$${m.payout.toLocaleString()}`); setMissionMarker(); }
  if (S.wanted >= 2) spawnPolice(); else clearPolice();
}
function shoot() {
  if (S.gunCooldown > 0 || S.weapon === 3) { if (S.weapon === 3) toast('BAT — get close'); return; }
  S.gunCooldown = 0.35; audio.shot(); S.shotAt = S.playT;
  player.userData.flash.material.opacity = 1;
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  ray.far = 70;
  const hits = ray.intersectObjects(enemies.filter(e => e.userData.alive), true);
  if (hits.length) {
    let e = hits[0].object; while (e.parent && !e.userData.hpBar) e = e.parent;
    e.userData.hp -= 34;
    e.userData.hpBar.scale.x = Math.max(0.02, e.userData.hp / 100);
    if (e.userData.hp <= 0) {
      e.userData.alive = false; e.rotation.x = -Math.PI / 2; e.position.y = 0.3;
      S.targetsDown++; S.cash += YARD_BOUNTY;
      popup(`BOUNTY +$${YARD_BOUNTY}`);
      if (S.targetsDown >= 3 && S.job === 4) completeMission();
    }
  }
  for (const p of peds) if (dist2d(p.position, player.position) < 25) p.userData.scatter = 2;
}
function popup(text) { const el = $('popup'); el.textContent = text; el.classList.remove('hidden'); if (shotDef && shotDef.popup === text) return; setTimeout(() => el.classList.add('hidden'), 2200); }
function toast(text) { const el = $('toast'); el.textContent = text; el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 2600); }

// ---------- screenshot staging ----------
function applyShot() {
  const d = shotDef;
  S.job = d.job; S.cash = d.cash; S.rep = d.rep; S.done = d.done; S.wanted = d.wanted;
  S.elapsedBase = d.elapsed; S.speedKmh = d.speed; S.loopClosed = !!d.complete;
  setMissionMarker();
  if (d.dlg) { $('dialog').classList.remove('hidden'); $('dlgPort').textContent = d.dlg.who[0]; $('dlgWho').textContent = `${d.dlg.who} • ${d.dlg.role}`; $('dlgText').textContent = d.dlg.text; }
  if (d.popup) popup(d.popup);
  if (d.targets) { S.targetsDown = 3 - d.targets; enemies.forEach((e, i) => { if (i < S.targetsDown) { e.userData.alive = false; e.rotation.x = -Math.PI / 2; e.position.y = 0.3; e.userData.hpBar.scale.x = 0.02; } }); }
  if (SHOT === 'start') {
    car.position.set(-60, 0, 60); car.rotation.y = Math.PI; heading = Math.PI; S.inCar = true; player.visible = false;
  } else if (SHOT === 'play') {
    car.position.set(-60, 0, 220); car.rotation.y = Math.PI; heading = Math.PI; S.inCar = true; player.visible = false;
    spawnPolice(); heli.visible = true;
  } else if (SHOT === 'chase') {
    car.position.set(-60, 0, -260); car.rotation.y = Math.PI; heading = Math.PI; S.inCar = true; player.visible = false;
    spawnPolice(); heli.visible = true;
    // Roadblock ahead: two interceptors angled across the beach road.
    police[0].position.set(-62, 0, -300); police[0].rotation.y = 0.5;
    police[1].position.set(-52, 0, -312); police[1].rotation.y = -0.4;
  } else if (SHOT === 'mission') {
    S.inCar = false; player.visible = true; car.visible = false;
    markerDisc.visible = false; markerBeam.visible = false;
    player.position.set(140, 0, 154); playerHeading = Math.PI; player.rotation.y = playerHeading;
    enemies[0].position.set(131, 0, 143); enemies[1].position.set(140, 0, 141); enemies[2].position.set(149, 0, 143);
    enemies.forEach((e) => { e.rotation.y = 0; });
    $('cross').classList.remove('hidden');
  } else if (SHOT === 'end') {
    car.position.set(-60, 0, -440); car.rotation.y = Math.PI; heading = Math.PI; S.inCar = false;
    player.visible = true; player.position.set(-56.5, 0, -436); player.rotation.y = Math.PI * 0.9;
    S.job = 9; markerDisc.visible = markerBeam.visible = false;
  }
  $('title').classList.add('hidden');
}
if (shotDef) applyShot(); else setMissionMarker();

// ---------- HUD ----------
function buildStaticHud() {
  $('weapons').innerHTML = WEAPONS.map((w, i) => `<span class="w${i === S.weapon ? ' on' : ''}">${i + 1} ${w}</span>`).join('');
  $('abilities').innerHTML = ABILITIES.map(a => `<div><span class="disc">${a.who}</span><span class="k">${a.key}</span>${a.name} — ${a.ab}</div>`).join('');
}
buildStaticHud();
const mm = $('minimap').getContext('2d');
function districtLabel() {
  const p = S.inCar ? car.position : player.position;
  if (p.x < -100) return 'BEACHFRONT'; if (p.z < -300) return 'NORTH BEACH';
  if (p.x > 200) return 'INDUSTRIAL'; return 'DOWNTOWN';
}
function streetLabel() {
  const p = S.inCar ? car.position : player.position;
  if (Math.abs(p.x + 60) < 10) return 'Beachfront Rd';
  if (Math.abs(p.x - 60) < 10) return 'Ocean Ave';
  if (Math.abs(p.x - 140) < 10) return 'Yard St';
  return 'Suncoast Blvd';
}
function updateHud() {
  const m = S.job > 8 ? null : MISSIONS[S.job - 1];
  $('jobTitle').textContent = S.loopClosed ? 'STORY LOOP COMPLETE' : `JOB ${S.job}/8 • ${missionTitle()}`;
  $('jobObj').textContent = S.loopClosed ? `Loop total $${LOOP_TOTAL.toLocaleString()} — all 8 jobs done` : m.obj;
  $('jobNext').textContent = S.job >= 8 ? 'NEXT: —' : `NEXT: ${MISSIONS[S.job].title}`;
  const tgt = S.inCar ? car.position : player.position;
  const md = Math.round(dist2d(tgt, markerPos));
  $('jobMark').textContent = S.loopClosed ? 'TARGETS —' : (S.job === 4 ? `TARGETS ${3 - S.targetsDown}/3` : `MARKER ${md} m`);
  const el = S.elapsedBase + S.playT;
  $('jobTimer').textContent = S.loopClosed ? 'STORY LOOP COMPLETE' : `${fmtTime(el)} / PAR ${m.par}`;
  $('cash').textContent = '$' + S.cash.toLocaleString();
  $('hpRep').textContent = `HP ${Math.round(S.hp)}  •  REP ${S.rep}`;
  $('repfill').style.width = (S.rep / 10 * 100) + '%';
  $('stars').innerHTML = [0, 1, 2, 3, 4].map(i => i < S.wanted ? '★' : '<span class="off">☆</span>').join('');
  const rows = shotDef && shotDef.police ? shotDef.police : police.map(p => ({ call: p === police[0] ? 'SNOOK-12' : 'SNOOK-11', d: Math.round(dist2d(p.position, tgt)), st: p.userData.status }));
  if (rows.length > 0) {
    $('police').classList.remove('hidden');
    $('policeRows').innerHTML = rows.map(r => `<div class="row"><span><b>${r.call}</b></span><span>${r.d}m • ${r.st}</span></div>`).join('');
    $('policeLine').textContent = S.wanted === 0 ? 'POLICE: CLEAR' : S.wanted >= 3 ? 'POLICE: IN SIGHT' : 'POLICE: PURSUIT';
  } else { $('police').classList.add('hidden'); $('policeLine').textContent = 'POLICE: CLEAR'; }
  $('speed').innerHTML = `${Math.round(S.speedKmh)} <small>km/h</small>`;
  $('fuelPct').textContent = Math.round(S.fuel) + '%'; $('fuelFill').style.width = S.fuel + '%';
  $('condPct').textContent = Math.round(S.cond) + '%'; $('condFill').style.width = S.cond + '%';
  $('carLabel').textContent = `HEATLINE GT — COND ${Math.round(S.cond)}%`;
  const tod = SHOT === 'chase' || SHOT === 'mission' ? 'DUSK' : 'GOLDEN';
  $('mapLabel').innerHTML = `${districtLabel()} • ${streetLabel()}<br>${tod} • ${S.done} JOBS DONE`;
  // Minimap.
  mm.clearRect(0, 0, 150, 150);
  mm.fillStyle = '#101826'; mm.beginPath(); mm.arc(75, 75, 74, 0, 7); mm.fill();
  mm.fillStyle = '#14506e'; mm.fillRect(0, 0, 18, 150); // ocean strip (west)
  mm.fillStyle = '#d9b380'; mm.fillRect(18, 0, 8, 150); // sand
  mm.strokeStyle = '#3a4a5a'; mm.lineWidth = 3;
  for (const ax of [-60, -10, 60, 140, 220]) { mm.beginPath(); mm.moveTo(75 + ax * 0.11, 0); mm.lineTo(75 + ax * 0.11, 150); mm.stroke(); }
  const px = 75 + tgt.x * 0.11, pz = 75 + tgt.z * 0.11;
  if (!S.loopClosed) {
    const pulse = 3 + Math.sin(S.playT * 4) * 1.5;
    mm.fillStyle = '#ffb02e'; mm.beginPath(); mm.arc(75 + markerPos.x * 0.11, 75 + markerPos.z * 0.11, pulse + 2, 0, 7); mm.fill();
  }
  for (const p of police) { mm.fillStyle = '#ff3b30'; mm.beginPath(); mm.arc(75 + p.position.x * 0.11, 75 + p.position.z * 0.11, 3, 0, 7); mm.fill(); }
  mm.fillStyle = '#ffd23e'; mm.beginPath(); mm.moveTo(px, pz - 5); mm.lineTo(px + 4, pz + 4); mm.lineTo(px - 4, pz + 4); mm.closePath(); mm.fill();
}

// ---------- per-frame updates ----------
const clock = new THREE.Clock();
const oceanBase = world.ocean.geometry.attributes.position.array.slice();
let frame = 0;
function stepPolice(dt) {
  const tgt = S.inCar ? car.position : player.position;
  for (const p of police) {
    if (shotDef) { // staged chase: hold formation, flash light bar
      p.userData.flash += dt * 6; p.userData.barMat.emissive.setHex(Math.sin(p.userData.flash) > 0 ? 0xff2222 : 0x2244ff);
      continue;
    }
    const dx = tgt.x - p.position.x, dz = tgt.z - p.position.z;
    const d = Math.hypot(dx, dz) || 1;
    let want = Math.atan2(dx, dz);
    // Building collision avoidance: steer around a collider dead ahead.
    for (const c of world.colliders) {
      const cx = c.x - p.position.x, cz = c.z - p.position.z;
      const along = cx * Math.sin(p.userData.heading) + cz * Math.cos(p.userData.heading);
      const side = cx * Math.cos(p.userData.heading) - cz * Math.sin(p.userData.heading);
      if (along > 0 && along < 14 && Math.abs(side) < c.r + 3) { want += side > 0 ? -0.9 : 0.9; break; }
    }
    let dh = want - p.userData.heading;
    while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
    p.userData.heading += clamp(dh, -1.6 * dt, 1.6 * dt);
    p.userData.speed = clamp(p.userData.speed + (d > 12 ? 14 : -10) * dt, 0, 34);
    p.position.x += Math.sin(p.userData.heading) * p.userData.speed * dt;
    p.position.z += Math.cos(p.userData.heading) * p.userData.speed * dt;
    p.rotation.y = p.userData.heading;
    p.userData.status = d < 10 ? 'RAMMING' : d < 45 ? 'PURSUIT' : d > 120 ? 'SEARCHING' : 'RESPONDING';
    p.userData.flash += dt * 6; p.userData.barMat.emissive.setHex(Math.sin(p.userData.flash) > 0 ? 0xff2222 : 0x2244ff);
    if (d < 4.5 && S.inCar) { S.cond = Math.max(30, S.cond - 0.4); car.position.x += Math.sin(p.userData.heading) * 0.4; }
  }
  if (heli.visible) {
    const a = S.playT * 0.22 + (shotDef ? -1.05 : 0);
    const hy = shotDef ? 20 : 42;
    heli.position.set(tgt.x + Math.cos(a) * 42, hy, tgt.z + Math.sin(a) * 42);
    heli.lookAt(tgt.x, 0, tgt.z);
    heli.userData.rotor.rotation.y += dt * 22;
    heli.userData.tailRotor.rotation.z += dt * 30;
    heli.userData.cone.scale.y = hy / 42;
    heli.userData.pool.position.y = -hy + 0.5;
  }
}
function stepWorld(dt, t) {
  world.wheel.rotation.z -= dt * 0.12;
  for (const c of world.clouds) { c.position.x += dt * 1.2; if (c.position.x > 700) c.position.x = -700; }
  const pos = world.ocean.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const bx = oceanBase[i * 3], by = oceanBase[i * 3 + 1];
    pos.setZ(i, Math.sin(bx * 0.06 + t * 1.1) * 0.6 + Math.cos(by * 0.05 + t * 0.8) * 0.5);
  }
  pos.needsUpdate = true;
  world.foam.forEach((f, i) => { f.material.opacity = 0.4 + Math.sin(t * 1.4 + i) * 0.18; });
  markerDisc.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
  markerBeam.material.opacity = 0.24 + Math.sin(t * 3) * 0.08;
  for (const tr of traffic) {
    tr.position.z += tr.userData.dir * tr.userData.speed * dt;
    if (tr.position.z > 570) tr.position.z = -570; if (tr.position.z < -570) tr.position.z = 570;
  }
  for (const p of peds) {
    const u = p.userData;
    if (u.scatter > 0) { u.scatter -= dt; p.position.x += (p.position.x < -60 ? -1 : 1) * 3 * dt; }
    else {
      p.position.z += u.dir * u.speed * dt;
      if (p.position.z > 560) u.dir = -1; if (p.position.z < -560) u.dir = 1;
      // Scatter from a fast car or gunfire.
      const nearCar = S.inCar && dist2d(p.position, car.position) < 8 && S.speedKmh > 40;
      if (nearCar || (S.playT - S.shotAt < 1.5 && dist2d(p.position, player.position) < 25)) u.scatter = 2;
    }
    const sw = Math.sin(t * 7 + u.phase) * 0.45;
    u.limbs[0].rotation.x = sw; u.limbs[1].rotation.x = -sw;
    p.rotation.y = u.dir > 0 ? 0 : Math.PI;
  }
  for (const e of enemies) {
    if (!e.userData.alive || shotDef) continue;
    const d = dist2d(e.position, player.position);
    if (d < 30 && d > 3) { const a = Math.atan2(player.position.x - e.position.x, player.position.z - e.position.z); e.position.x += Math.sin(a) * 1.6 * dt; e.position.z += Math.cos(a) * 1.6 * dt; e.rotation.y = a; }
  }
  player.userData.flash.material.opacity = Math.max(0, player.userData.flash.material.opacity - dt * 6);
}
function stepDrive(dt) {
  if (!S.started || S.paused) return;
  if (shotDef) { // staged hold: world stays alive, speedo shows the staged speed
    car.userData.wheels.forEach(w => { w.rotation.x += (S.speedKmh / 3.6) * dt / 0.42; });
    return;
  }
  if (S.inCar) {
    const fwd = keys['KeyW'] || keys['ArrowUp'], back = keys['KeyS'] || keys['ArrowDown'];
    const left = keys['KeyA'] || keys['ArrowLeft'], right = keys['KeyD'] || keys['ArrowRight'];
    if (fwd) carSpeed += 24 * dt; if (back) carSpeed -= 30 * dt;
    carSpeed -= carSpeed * 0.55 * dt;
    carSpeed = clamp(carSpeed, -12, 55);
    const steer = (left ? 1 : 0) - (right ? 1 : 0);
    if (Math.abs(carSpeed) > 0.5) heading += steer * 1.5 * dt * clamp(Math.abs(carSpeed) / 12, 0, 1) * Math.sign(carSpeed);
    car.position.x += Math.sin(heading) * carSpeed * dt;
    car.position.z += Math.cos(heading) * carSpeed * dt;
    car.rotation.y = heading;
    car.userData.wheels.forEach(w => { w.rotation.x += carSpeed * dt / 0.42; });
    car.userData.brakeMat.emissiveIntensity = (back || keys['Space']) ? 2.2 : 0.7;
    S.speedKmh = Math.abs(carSpeed) * 3.6;
    audio.setEngine(S.speedKmh, fwd);
    // Drift: handbrake at speed pays out.
    if (keys['Space'] && S.speedKmh > 90 && S.driftCooldown <= 0) {
      S.driftCooldown = 5; S.driftEarn += 150; S.cash += 150; popup('DRIFT x3 +$150');
    }
    // Near miss.
    for (const tr of traffic) {
      if (tr.userData.nearCd <= 0 && Math.abs(tr.position.x - car.position.x) < 3.5 && Math.abs(tr.position.z - car.position.z) < 7 && S.speedKmh > 80) {
        tr.userData.nearCd = 8; S.cash += 50; popup('NEAR MISS +$50');
      }
      tr.userData.nearCd -= dt;
    }
    // Building collision: push out.
    for (const c of world.colliders) {
      const d = Math.hypot(car.position.x - c.x, car.position.z - c.z);
      if (d < c.r + 2 && d > 0.01) {
        const push = (c.r + 2 - d);
        car.position.x += (car.position.x - c.x) / d * push; car.position.z += (car.position.z - c.z) / d * push;
        carSpeed *= 0.4; S.cond = Math.max(30, S.cond - 0.5);
      }
    }
    car.position.x = clamp(car.position.x, -560, 580); car.position.z = clamp(car.position.z, -560, 580);
    // Garage repaint drops heat + refuel; safehouse heals.
    if (S.garageCd <= 0 && Math.hypot(car.position.x - WORLD.garage.x, car.position.z - WORLD.garage.z) < 12) {
      S.garageCd = 10; S.wanted = 0; S.fuel = 100; S.cond = 100; clearPolice(); toast('GARAGE — repaint done, heat clear');
    }
    S.garageCd -= dt; S.driftCooldown -= dt;
    S.fuel = Math.max(0, S.fuel - Math.abs(carSpeed) * dt * 0.004);
    // Mission marker (driving).
    if (!S.loopClosed && S.job !== 4 && dist2d(car.position, markerPos) < 7) completeMission();
    if (S.job === 4 && !S.inCar) { /* yard is on foot */ }
    // Stashes.
    for (const s of stashes) {
      if (s.visible && dist2d(car.position, s.position) < 4) { s.visible = false; S.cash += 250; S.stashGot++; popup('STREET CASH +$250'); }
    }
  } else {
    const fwd = keys['KeyW'] || keys['ArrowUp'], back = keys['KeyS'] || keys['ArrowDown'];
    const left = keys['KeyA'] || keys['ArrowLeft'], right = keys['KeyD'] || keys['ArrowRight'];
    const turn = (left ? 1 : 0) - (right ? 1 : 0);
    playerHeading += turn * 2.4 * dt;
    const mv = (fwd ? 1 : 0) - (back ? 0.55 : 0);
    playerSpeed = mv * 6;
    player.position.x += Math.sin(playerHeading) * playerSpeed * dt;
    player.position.z += Math.cos(playerHeading) * playerSpeed * dt;
    player.rotation.y = playerHeading;
    const sw = Math.sin(S.playT * 9) * (playerSpeed !== 0 ? 0.5 : 0);
    player.userData.limbs[0].rotation.x = sw; player.userData.limbs[1].rotation.x = -sw;
    player.userData.limbs[2].rotation.x = -sw; player.userData.limbs[3].rotation.x = sw;
    S.speedKmh = 0;
    for (const c of world.colliders) {
      const d = Math.hypot(player.position.x - c.x, player.position.z - c.z);
      if (d < c.r + 1 && d > 0.01) { player.position.x += (player.position.x - c.x) / d * (c.r + 1 - d); player.position.z += (player.position.z - c.z) / d * (c.r + 1 - d); }
    }
    if (Math.hypot(player.position.x - WORLD.safehouse.x, player.position.z - WORLD.safehouse.z) < 10) S.hp = 100;
    if (!S.loopClosed && dist2d(player.position, markerPos) < 7) {
      if (S.job === 4) { /* yard completes on kills, not on arrival */ }
      else completeMission();
    }
    for (const s of stashes) {
      if (s.visible && dist2d(player.position, s.position) < 4) { s.visible = false; S.cash += 250; S.stashGot++; popup('STREET CASH +$250'); }
    }
  }
  S.gunCooldown = Math.max(0, S.gunCooldown - dt);
}
function stepCamera(dt) {
  const tgt = S.inCar ? car.position : player.position;
  const base = S.inCar ? heading : playerHeading;
  let off, look;
  if (SHOT === 'start') {
    // WIDE HIGH establishing: whole beachfront, ferris wheel framed.
    camera.position.set(-190, 55, 30);
    camera.lookAt(-60, 4, 90); return;
  }
  if (SHOT === 'chase') {
    off = new THREE.Vector3(Math.sin(base + 0.55) * -9.5, 4.6, Math.cos(base + 0.55) * -9.5);
    camera.position.copy(tgt).add(off); camera.lookAt(tgt.x, 3, tgt.z - 24); return;
  }
  if (SHOT === 'mission') {
    camera.position.set(138.5, 4.2, 161.5);
    camera.lookAt(140, 1.2, 143); return;
  }
  if (SHOT === 'end') {
    camera.position.set(-46, 4.2, -420);
    camera.lookAt(-95, 6, -462); return;
  }
  // Default low rear 3/4 chase cam: 6.5 m behind, 2.7 m up, 2.3 m to the side.
  const side = 2.3;
  off = new THREE.Vector3(-Math.sin(base) * 6.5 + Math.cos(base) * side, 2.7, -Math.cos(base) * 6.5 - Math.sin(base) * side);
  const want = new THREE.Vector3().copy(tgt).add(off);
  if (!camera.userData.snapped || shotDef) camera.position.copy(want);
  else camera.position.lerp(want, 1 - Math.pow(0.001, dt));
  camera.userData.snapped = true;
  look = new THREE.Vector3(tgt.x + Math.sin(base) * 8, 1.6, tgt.z + Math.cos(base) * 8);
  camera.lookAt(look);
}
window.__suncoast = { state: S, version: 'v10', shot: SHOT, world: { buildings: world.buildings.length, palms: world.palms.length } };
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (S.started && !S.paused) S.playT += dt;
  stepWorld(dt, t);
  stepDrive(dt);
  stepPolice(dt);
  stepCamera(dt);
  if (frame++ % 6 === 0) updateHud();
  renderer.render(scene, camera);
}
updateHud();
loop();
