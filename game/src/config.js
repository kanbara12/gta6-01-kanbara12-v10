// SUNCOAST: HEATLINE — shared constants, economy and screenshot staging.
// All numbers here are the single source of truth for the HUD and the shots.
export const WORLD = {
  size: 1200, beachRoadX: -60, oceanX: -170, sandX: -110,
  yard: { x: 140, z: 150 }, garage: { x: -20, z: 260 },
  safehouse: { x: 60, z: -240 }, marina: { x: -140, z: 420 },
  lighthouse: { x: -150, z: -480 }, pier: { x: -150, z: 60 },
  spawn: { x: -60, z: -40 }, carSpawn: { x: -52, z: -40 },
  marker1: { x: -60, z: 4 }, // ~44 m from the player/car spawns
};

export const MISSIONS = [
  { n: 1, title: 'A FAVOR IN THE HEAT', payout: 2500, obj: 'Meet the fixer Rae at the glowing marker', par: '1:00', marker: { x: -60, z: 4 } },
  { n: 2, title: 'LOOSE CARGO', payout: 2500, obj: 'Pick up the sealed package at the next marker', par: '1:30', marker: { x: -60, z: 180 } },
  { n: 3, title: 'THE QUIET EXIT', payout: 3000, obj: 'Deliver the package across town, keep it quiet', par: '2:00', marker: { x: 180, z: -160 } },
  { n: 4, title: 'STREET SWEEP', payout: 3500, obj: 'Clear the hostile crew in the industrial yard', par: '3:00', marker: { x: 140, z: 150 } },
  { n: 5, title: 'NO WITNESSES', payout: 4250, obj: 'Reach the garage and lose the heat', par: '2:30', marker: { x: -20, z: 260 } },
  { n: 6, title: 'LAST LIGHT', payout: 2000, obj: 'Final run at dusk, through the roadblocks', par: '2:00', marker: { x: -60, z: -420 } },
  { n: 7, title: 'THE MARINA SWAP', payout: 1500, obj: 'Case swap at the marina dock', par: '1:30', marker: { x: -140, z: 420 } },
  { n: 8, title: 'NORTH LIGHT', payout: 1500, obj: 'North-beach run to the lighthouse', par: '1:30', marker: { x: -150, z: -480 } },
];
// REP after each job completes: +1 per job, +1 extra on the yard sweep, +2 on the final run.
export const REP_AFTER = [0, 1, 2, 3, 5, 6, 7, 8, 10];
export const WANTED_AFTER = [0, 0, 0, 0, 2, 3, 4, 1, 1];
export const START_CASH = 1250;
export const YARD_BOUNTY = 150;
export const LOOP_TOTAL = 22450; // 19750 story + 1250 start + 450 yard bounties

// Screenshot staging — every value the HUD shows in each submitted frame.
// Cash is the cumulative §2 figure for that job; elapsed is shown as mm:ss.
export const SHOTS = {
  start:   { job: 1, cash: 1250,  rep: 0, done: 0, wanted: 0, elapsed: 47,  par: '1:00', speed: 128, heli: false, police: [], dlg: null,
             cam: 'wide',  note: 'WIDE HIGH establishing, beachfront + ferris wheel' },
  play:    { job: 2, cash: 3750,  rep: 1, done: 1, wanted: 0, elapsed: 72,  par: '1:30', speed: 141, heli: true,  police: [
               { call: 'SNOOK-12', d: 6,  st: 'RAMMING' }, { call: 'SNOOK-11', d: 14, st: 'PURSUIT' },
               { call: 'SNOOK-13', d: 38, st: 'RESPONDING' }, { call: 'AIR-1 SKY-1', d: 42, st: 'SPOTLIGHT' }],
             dlg: { who: 'RAE', role: 'FIXER', text: 'Package is sealed and hot. Beach road, keep it above a hundred — I will talk you through the handoff.' },
             cam: 'chase', note: 'LOW rear 3/4 chase cam, beach road' },
  chase:   { job: 5, cash: 13200, rep: 5, done: 4, wanted: 3, elapsed: 129, par: '2:30', speed: 152, heli: true,  police: [
               { call: 'SNOOK-12', d: 6,  st: 'RAMMING' }, { call: 'SNOOK-11', d: 14, st: 'PURSUIT' },
               { call: 'SNOOK-13', d: 38, st: 'RESPONDING' }, { call: 'SNOOK-14', d: 55, st: 'ROADBLOCK' },
               { call: 'AIR-1 SKY-1', d: 42, st: 'SPOTLIGHT' }],
             dlg: { who: 'SABLE', role: 'LOOKOUT', text: 'EYES UP — roadblock two streets ahead, heli is painting you. Cut through the marina lane, now.' },
             popup: 'DRIFT x3 +$150', cam: 'chaseWide', note: 'DUSK downtown pursuit, heli + spotlight' },
  mission: { job: 4, cash: 9550,  rep: 4, done: 3, wanted: 2, elapsed: 151, par: '3:00', speed: 0,   heli: false, police: [], targets: 2,
             dlg: { who: 'MARLO', role: 'DRIVER', text: 'The yard crew skimmed our cut. I keep the engine running — you handle the yard.' },
             cam: 'foot',  note: 'ON FOOT container yard, pistol + 3 enemies' },
  end:     { job: 8, cash: 22450, rep: 10, done: 8, wanted: 0, elapsed: 0,  par: '—',   speed: 0,   heli: false, police: [],
             dlg: { who: 'RAE', role: 'FIXER', text: 'Loop closed. Twenty-two four-fifty, clean. Suncoast is ours tonight.' },
             cam: 'lighthouse', complete: true, note: 'North beach road to the lighthouse' },
};

export const RADIO = [
  { name: 'SHORELINE 96.7', track: 'Sunset Run' },
  { name: 'PIER 102.5', track: 'Boardwalk Lights' },
  { name: 'DUNE 89.9', track: 'Night Mirage' },
];
export const WEAPONS = ['PISTOL', 'SMG', 'SHOTGUN', 'BAT'];
export const ABILITIES = [
  { key: 'Z', who: 'R', name: 'Rae', ab: 'CLEAN SLATE' },
  { key: 'X', who: 'S', name: 'Sable', ab: 'EYES UP' },
  { key: 'C', who: 'M', name: 'Marlo', ab: 'PIT STOP' },
];
export function fmtTime(s) { const m = Math.floor(s / 60); return m + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
