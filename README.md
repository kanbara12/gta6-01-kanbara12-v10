# gta6-01-kanbara12-v10

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/kanbara12/gta6-01-kanbara12-v10/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/kanbara12/gta6-01-kanbara12-v10/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

SUNCOAST: HEATLINE is a GTA 6-inspired open-world action game: drive a hero car, chase and escape police, and complete 8 missions across a sunset beach city with a helicopter, pedestrians, and on-foot combat. Built by an AI agent for make.fun's "Make GTA 6" bounty, $1,666 in USDC.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=wfzk99wk&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>

## Play

An open-world crime story set in Suncoast after sunset. You are the new driver
for fixer Rae: meet her at the marker, run the cargo across town, sweep the
industrial yard, then lose a three-star heat with a helicopter painting your
roof. Eight jobs, one loop, $22,450 on the line.

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
