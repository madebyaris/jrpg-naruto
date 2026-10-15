# KAGERO — Hollow Pagoda

A rogue-like action JRPG in the browser. You are Asa, last seal-bearer of the Hollow Seal. The fighters, portraits, and camp conversations are 2D. The rooms and camera are a 3D court you can orbit, in the spirit of a Suikoden field view. Movement is camera-relative, and the fighting is a small arena brawler: dash, a three-hit string, a heavy cut, and chakra jutsu.

## Story

The campaign is told the way a grim action-RPG tells one: a camp on the porch, recurring voices, a quest that changes, and bosses who speak.

The Hollow Seal walked the names of the dead down the pagoda so they would not climb back into the living. A plague of unburied names — the Blank — rose anyway. The regent sealed the road with the clan still inside. Aya, your aunt, can wait only on the porch. You still have a living name, so the gate opens downward for you.

- **Act I — The Latch.** Kurogane, your uncle, holds the first gate because he was ordered to. Quest: Open the Latch.
- **Act II — The Record.** Futae split her mask so one face could forget the Blank. Quest: Unmask the Record.
- **Act III — The Bell.** Seijin is the regent's order, copied into a bell. Quest: Silence the Echo.

Clearing the bell buys one breath. The pagoda then copies the three acts deeper, and the copy already knows your seals. Soot, who escaped, and Hoshi, the ink monk, speak at camp. When a boss falls you return to those voices, then choose one seal: a name you borrow, not a prize. Death returns you to Aya. The seals you carried do not.

Every floor is a short chain of courtyards that ends in a boss. Clear the puppets, the gate opens, the warden wakes. Beat the boss and choose one seal. Death ends the run.

## Run

```bash
npm install
npm test
npm run dev
```

Open the local URL Vite prints. `npm run build` typechecks and writes `dist/`.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows | Run, relative to the camera |
| Shift or Space | Dash, with a short invulnerable window |
| J, left click, or Attack | Three-hit combo |
| Dash / Jutsu buttons | Same as Shift and L |
| K | Heavy cut |
| L | Jutsu (spends chakra) |
| Tab | Cycle jutsu |
| F | Lock the nearest foe |
| Q / E or right-drag | Orbit the camera |
| Mouse wheel | Zoom |
| R | Reset the camera behind you |
| Esc | Pause |
| 1 / 2 / 3 | Choose a seal after a boss |
| Enter, or Continue | Advance the camp conversation |

Pots break if you cut them. Green motes restore health, blue motes restore chakra.

## Floors

1. **Kurogane, Gate Warden** — slow blade, a stamped circle you walk out of.
2. **Futae of the Twin Mask** — dash strikes, a fan of kunai, a shade that joins late.
3. **Seijin of the Pagoda** — orbs, lanes, a ring you dodge by standing inside or outside.
4. The three return, harder, with an elite in each court.

Seals stack for the rest of the run: damage, dash charges, chakra, health, attack speed, lifesteal, and the other two jutsu (Mirror Rite, Void Palm). Cinder Fan is yours from the first step.
