# Kazhutha / Vettu

A browser-only, mobile-first Kerala card game. Regional mode calls it **Kazhutha** and uses **Vettu**; English mode calls it **Last Card** and uses **Cut**. Both run the exact same engine.

## Run locally

Use Node.js 22 LTS (Node 20.11+ is also supported).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No server accounts, API keys, or external services are needed. Fonts, card artwork, and generated sound are local.

```sh
npm test                 # Deterministic engine and AI tests
npm run test:watch       # Watch mode
npm run lint            # ESLint
npm run format:check    # Prettier
npm run build           # Type-check and produce dist/
npm run preview         # Serve the production build locally
```

For browser integration and accessibility tests:

```sh
npx playwright install chromium
npm run test:e2e
```

If Google Chrome is already installed, use `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` instead. Tests cover desktop and phone layouts, the tutorial, terminology persistence, legal moves, bot turns, round history, private handoffs, and automated accessibility checks. Screenshots and failure traces go in `test-results/`.

## Play

- Select 2–5 seats, name the players, and assign human or bot seats. The first seat is always human. Single player uses bots; pass-and-play supports any mixture of humans and bots.
- Select Easy, Medium, or Hard. Settings persist on this device.
- The A♠ holder starts and may lead **any** card. Every later player must follow the suit when possible.
- Tap or keyboard-select a legal card, then choose **Play card**. Scroll your hand sideways when it is large. Disabled cards cannot be played.
- If a player cannot follow suit, their off-suit card immediately ends the round. The highest **original lead-suit card** takes the whole pile, including the cut card. This is not a trump game.
- With no cut, all cards in the round are discarded. The highest lead-suit card determines the next leader in both cases.
- **Resolve transfers before finishes.** A player who must pick up the pile has not finished, even if their hand was temporarily empty.
- Rank simultaneous finishers in their play order. Finished players never re-enter or receive cards. If the winner finishes, the next active seat clockwise leads.
- Continue until all positions are assigned. If all remaining hands empty in one clean round, play order determines every final position.
- In pass-and-play, the outgoing hand is unmounted from the page. Each next human must reveal their hand explicitly. History shows only public played cards, never bot deductions.

## Project map

| Location                       | Responsibility                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `src/game/`                    | Typed cards, seeded shuffle, deal, move validation, round resolution, finish ordering, pure state transitions |
| `src/game/game.test.ts`        | Fixed-hand rule and finishing scenarios                                                                       |
| `src/game/ai/`                 | Easy/Medium/Hard strategies, public-only observation boundary, memory, simulations                            |
| `src/store/`                   | Zustand game session and persisted presentation preferences                                                   |
| `src/terminology/`             | Regional/English dictionary; no engine dependency                                                             |
| `src/screens/`                 | Home, setup, table, tutorial, settings, and results                                                           |
| `src/components/`              | Original CSS card artwork, seats, public history, accessible modal                                            |
| `src/utils/audio.ts`           | Optional Web Audio synthesis behind a small sound API                                                         |
| `src/styles.css`               | Responsive physical-table design, Tailwind entry/theme, reduced motion                                        |
| `e2e/`                         | Playwright gameplay, privacy, responsive, and axe accessibility checks                                        |
| `.github/workflows/deploy.yml` | Install, format/lint checks, tests, build, GitHub Pages deployment                                            |

## Engine contract

The engine imports neither React nor Zustand, storage, sound, or terminology. It can run in Node.js, a future game server, or a mobile wrapper. Moves are checked by the engine, regardless of what the UI enables.

```ts
import { createGame, seededRandom } from './src/game';

const game = createGame({
  players: [
    { id: 'you', name: 'Snehith', type: 'human' },
    { id: 'arun', name: 'Arun', type: 'bot' },
  ],
  random: seededRandom(42),
});

const state = game.getState();
const player = state.players.find((p) => p.id === state.currentPlayerId)!;
game.playCard(player.id, player.hand[0].id); // Opening lead may be any card.
```

For a complete loop, use `legalCards(hand, state.round.leadSuit)` for subsequent moves. After a round resolves, the engine is `roundEnd`: its pickup/discard and rankings are **already final**, and all play attempts are rejected. Call `advanceRound()` to open the next round. `finished` has no next round. This explicit boundary gives animation, networking, and replay clients a safe place to synchronize.

`createInitialState`, `playCard`, and `advanceRound` are also available as pure reducers. The facade returns isolated snapshots. Supply the same random seed and move sequence for deterministic replay. `initialHands` plus `startingPlayerId` allow fixed test scenarios; ordinary games always deal all 52 cards and locate A♠.

Cards in a resolved `round.plays` and history are display records, not additional physical cards. Conservation is: hands + discarded cards + **unresolved** played cards = original deck.

## AI

Bots receive their own hand, public card counts, public history, current plays, and rankings. They never receive opponents’ hands. Memory tracks observed void suits, known picked-up cards, cards played, cuts, and previous winners. Picking up a suit invalidates a prior void; playing a known card removes it from the remembered hand.

Easy chooses legal moves using injectable randomness. Medium sheds high cards, avoids known pickups, and uses simple traps. Hard is deterministic and weighs unseen higher cards, suit scarcity, short hands, public pickups, lead control, late-game position, and intervening followers before a known void. It can choose 2♥ over A♥ to trap a higher follower before a later cut. These are explainable heuristics, not machine learning or exhaustive search.

## GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Push to `main` or run **Deploy game to GitHub Pages** from the Actions tab.

The workflow installs from the lockfile, checks formatting and lint, runs all unit tests, builds, uploads `dist/`, and deploys it. It does not contain any username or repository name. Vite uses `base: './'`, so the output works at `/REPOSITORY/`, a user-site root, or a custom domain. All in-app screens use local UI state, so there are no server routes or refresh-dependent path rewrites.

The folder is ready to push but no remote repository or live deployment is created by this implementation. If it is not yet a Git repository, initialize Git and add your own remote before pushing.

References: [Vite static deployment](https://vite.dev/guide/static-deploy) and [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Current boundaries and next steps

- Games run on one device. There is no online multiplayer, login, account, statistics service, monetization, or native app yet.
- Preferences survive reload; the current game does not. Going Home pauses the in-memory session and lets you resume it.
- Pass-and-play privacy protects ordinary use of the interface; a local browser necessarily contains the complete engine state. A multiplayer server must expose only per-player observations.
- There is no arbitrary move limit or invented tiebreaker. Repeated pickups can produce long games, just as at a physical table.
- The fixed ivory-and-felt theme is intentional; there is no alternate light/dark theme.
- Generated audio starts after a user gesture, subject to browser audio support. Animation settings also respect system reduced motion.
- `.npmrc` uses legacy peer resolution for an npm 10.2 optional-peer resolver bug; installed runtime and test dependencies are locked and verified.
- Next: introduce a transport adapter and authoritative server around the pure reducers, then add reconnect/replay storage and statistics. Capacitor can package the same static build after device-specific QA. Improve bot strength with larger scenario benchmarks without changing the rules.

The playing-card and table graphics are original CSS/SVG. DM Sans and Fraunces are bundled via Fontsource under their included open font licenses.
