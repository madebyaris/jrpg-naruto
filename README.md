# KAGERO — Hollow Pagoda

A rogue-like action JRPG in the browser. You play a lone blade of the Hollow Seal, descending a pagoda one floor at a time. The fighters are flat inked sprites. The rooms, pillars, and camera are 3D, in the spirit of a Suikoden field view: a high three-quarter angle you can orbit. Movement is camera-relative, and the fighting is built like a small arena brawler — dash-cancels, a three-hit string, a heavy cut, and chakra jutsu — without borrowing anyone else's ninja.

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

Pots break if you cut them. Green motes restore health, blue motes restore chakra.

## Floors

1. **Kurogane, Gate Warden** — slow blade, a stamped circle you walk out of.
2. **Futae of the Twin Mask** — dash strikes, a fan of kunai, a shade that joins late.
3. **Seijin of the Pagoda** — orbs, lanes, a ring you dodge by standing inside or outside.
4. The three return, harder, with an elite in each court.

Seals stack for the rest of the run: damage, dash charges, chakra, health, attack speed, lifesteal, and the other two jutsu (Mirror Rite, Void Palm). Cinder Fan is yours from the first step.
