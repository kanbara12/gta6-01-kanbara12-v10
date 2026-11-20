# SUNCOAST: HEATLINE

[![License MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Three.js 0.160.0](https://img.shields.io/badge/Three.js-0.160.0-blue.svg)](game/vendor/three.module.min.js)
[![make.fun gta6-01](https://img.shields.io/badge/make.fun-gta6--01-orange.svg)](https://make.fun)

An open-world crime story set in Suncoast after sunset. You are the new driver
for fixer Rae: meet her at the marker, run the cargo across town, sweep the
industrial yard, then lose a three-star heat with a helicopter painting your
roof. Eight jobs, one loop, $22,450 on the line.

## Play

Serve it locally and open it in a desktop browser: the game runs fully
offline, no network requests at all:

```sh
node serve.ts
# open http://localhost:8080
```

- **WASD** drive / walk, **E** enter and exit the car, **mouse click** shoot on foot
- **Space** drift (pays out), **P** pause, **H** hide the HUD, **R** change radio, **M** mute
- **Z / X / C** crew calls: Rae CLEAN SLATE, Sable EYES UP, Marlo PIT STOP
- **1–4** switch weapons: PISTOL, SMG, SHOTGUN, BAT

## The loop

| # | Job | Payout | Cash after |
|---|---|---|---|
| 1 | A FAVOR IN THE HEAT | $2,500 | $3,750 |
| 2 | LOOSE CARGO | $2,500 | $6,250 |
| 3 | THE QUIET EXIT | $3,000 | $9,250 |
| 4 | STREET SWEEP (+$450 yard bounties) | $3,500 | $13,200 |
| 5 | NO WITNESSES | $4,250 | $17,450 |
| 6 | LAST LIGHT | $2,000 | $19,450 |
| 7 | THE MARINA SWAP | $1,500 | $20,950 |
| 8 | NORTH LIGHT | $1,500 | $22,450 |

Side money: street-cash stashes ($250), drift payouts, near-miss bonuses.
Garage repaint drops the heat and refuels; the safehouse heals.

## Screenshots

Four genuine gameplay frames, staged with `?shot=` and seed 1:

1. `1-start.jpg`: JOB 1/8, $1,250: wide high establishing shot, beachfront and ferris wheel
2. `2-play.jpg`: JOB 2/8, $3,750: low rear 3/4 chase cam on the beach road at 141 km/h, Rae on the radio
3. `3-chase.jpg`: JOB 5/8, $13,200: dusk downtown pursuit, heli SKY-1 with spotlight, wanted 3
4. `4-mission.jpg`: JOB 4/8, $9,550: on foot in the container yard, pistol out, Marlo on the radio

A fifth scene, the loop-complete run to the lighthouse (`?shot=end&seed=1`,
$22,450, 8 jobs done), is prepared in the game but not submitted: the kit
caps `screenshots/` at four.

## Tech

Three.js 0.160.0 vendored locally under `game/vendor/` (see
`game/THIRD-PARTY-NOTICES.md`). All textures are procedural canvas textures,
all audio is synthesised live with WebAudio, all radio is original synth.
Zero external requests during gameplay. Source outline in `game/README.md`.

## License

MIT: see [LICENSE](LICENSE).
