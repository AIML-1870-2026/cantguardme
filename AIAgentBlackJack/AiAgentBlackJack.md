# Blackjack AI Agent — Project Spec

**Course:** AIML 1870 · Code Quest · AI Agent
**Author:** Sharish
**Deliverable:** A static webpage (HTML + CSS + JavaScript) that implements a Blackjack-playing AI agent with a climbing progression system, cinematic presentation, and multi-provider LLM support.

---

## 1. Mission

Build a static webpage that is simultaneously:

1. A **correct, full-rules Blackjack implementation** (deck, dealing, scoring, payouts, all player options).
2. An **AI agent** that reads the current game state, calls an LLM for a recommendation, and executes the action — using **structured JSON output** so the action can be extracted reliably (no keyword-search ambiguity).
3. An **entertainment experience** — a climbing progression across visually and sonically distinct levels, so playing 20 hands feels like a journey, not a loop.

Every requirement from the assignment PDF is preserved. The climb, the aesthetic, and the audio design are on top of that.

---

## 2. Assignment Requirements Covered (from PDF)

| Requirement from PDF | How it's covered in this spec |
|---|---|
| Static webpage (HTML, CSS, JS) | Single-page app, no backend, GitHub Pages deployable |
| User uploads `.env` for API key | `.env` upload input, parsed in-memory only, never persisted |
| Key read in-memory only, never stored or transmitted beyond the API call | Keys live in a closed-over variable in JS, never written to `localStorage`/`sessionStorage`, never logged |
| Agent reads game state (player hand, dealer up card) | Game state object passed into prompt builder |
| Calls LLM for a recommendation | `fetch()` to the selected provider's chat completions endpoint |
| Executes the action | `Execute Recommendation` button + Autoplay mode |
| Solves the "hit and stand both appear in text" ambiguity | LLM is required to return structured JSON with a strict `action` enum — parsed, not keyword-searched |
| Behind-the-scenes console output to show interactions | `console.group` / `console.table` structured logs of request, response, parsed action, and outcome, per hand |
| Reference implementation via `temp/` folder | `temp/` folder checked into repo, excluded from deployment (via `.nojekyll` scope and manual exclusion) |
| Model Family dropdown + Model dropdown | Provider picker (OpenAI / Anthropic / Gemini) + model picker populated per provider |
| Bet Amount input | Numeric bet input, clamped to balance |
| Balance display | Chip-stack visualization + numeric balance |
| Play button | Primary action button, triggers deal + LLM call |
| Refresh Models button | Re-fetches the model list for the active provider |
| Dealer area (up card + hole card) | Top zone of the table with hole card flip on dealer turn |
| Player area (hand + score) | Bottom zone of the table |
| Current Bet display | Gold chip + bet amount on the felt |
| AI Analysis + Execute Recommendation buttons | Dealer-orb speech bubble + Execute button |
| Extensive testability | Hand history log, console debug output, basic-strategy overlay flags disagreements |
| Stretch: 2+ enhancements | **Three+ enhancements shipped:** Performance Analytics, Basic Strategy Overlay, Risk Profile Selector, plus the Climb progression as a 4th |

---

## 3. The Climb — Level Progression

The game is structured as a climb. The player starts at the bottom and ascends through distinct **zones**, each with its own visual environment, soundscape, and betting stakes. This is the primary entertainment loop — level up feels like *arriving somewhere new*.

> **TBD — pending `temp/` reference.** Sharish will provide a reference Blackjack game in `temp/` that establishes the climb's zone structure (count, theme of each, audio character). This spec locks the framework; the specific zone themes and count will be finalized after the reference is reviewed.

### Climb framework (provider-agnostic, fill in themes from reference)

- **Level advancement trigger:** *(To be decided against reference — most likely bankroll threshold, e.g., Level 2 at $2k, Level 3 at $5k, etc.)*
- **Level count:** *(To be decided against reference — likely 5 zones based on typical climb games)*
- **Bust behavior:** *(To be decided against reference — recommend soft fail: drop one level with a reset stake, so the player isn't punished out of the game)*
- **Per-level changes that MUST happen on advancement:**
  - Background environment swaps with a cross-fade (≥ 600ms, eased)
  - Ambient audio bed cross-fades to the new zone's track (≥ 2s)
  - Accent color palette shifts (CSS variables re-mapped)
  - Chip design may update (denomination art changes)
  - A "LEVEL UP" moment plays: orb flares, felt shimmers, a unique stinger SFX, the level name typesets in
  - Minimum bet increases; maximum bet ceiling increases

### Level-up moment (cinematic)

When the player hits the advancement threshold:
1. The current hand completes and pays out normally.
2. Before the next deal, the screen briefly dims.
3. The dealer orb expands, pulses gold, and emits a ring.
4. The level name materializes in large serif gold type ("LEVEL 2 — THE HIGH LIMIT ROOM" or similar).
5. The background cross-fades; the ambient track cross-fades; chip denominations update.
6. A subtle confetti-of-light effect (no gaudy confetti) drifts across the felt.
7. The UI returns to play-ready state.

This moment should feel *earned*. It is the game's biggest reward.

---

## 4. Game Rules

Full casino Blackjack, dealer stands on all 17s (S17). The rule set is non-negotiable — the LLM needs a real decision space.

### Cards and scoring
- Full 52-card single deck, reshuffled between every hand (per Sharish's choice — simplicity, no counting viable, LLM can't cheat with card memory).
- Ace = 1 or 11, whichever gives the best non-busted total.
- Face cards = 10.
- Blackjack = Ace + 10-value card on the initial two cards. Pays 3:2.

### Player actions supported
- **Hit** — draw a card.
- **Stand** — end turn.
- **Double Down** — double the bet, receive exactly one more card, then stand. Allowed only on the initial two cards when balance supports it.
- **Split** — when the initial two cards have equal rank, split into two hands with an additional bet equal to the original. Each hand plays out independently. Split Aces receive exactly one card each (standard rule). Resplitting is disabled for v1.
- **Surrender** — forfeit the hand and recover half the bet. Allowed only on the initial two cards, before any other action (late surrender).

### Dealer play
- Dealer reveals hole card after the player completes all hands.
- Dealer hits until reaching 17 or higher; dealer stands on all 17s (including soft 17).
- Dealer busts lose to any non-busted player hand.

### Payouts
- Natural blackjack: 3:2 (bet × 1.5 returned as winnings + original bet).
- Standard win: 1:1.
- Push (tie): bet returned.
- Loss: bet lost.
- Surrender: half bet returned.
- Insurance: **not offered in v1** (complexity/value tradeoff, can be added later).

### Balance
- Starts at $1000.
- Persists across hands within a session.
- On bust-to-zero: behavior governed by the climb's bust rule.

---

## 5. The Agent — LLM Integration

This is the technical heart of the assignment. The agent's job: given a game state, recommend an action. Executed reliably.

### Provider support

Three providers, user picks one at a time (the dropdown matches the reference screenshot):

| Provider | Example models | API endpoint |
|---|---|---|
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `o1`, `o1-mini` | `https://api.openai.com/v1/chat/completions` |
| Anthropic | `claude-opus-4-7`, `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5` | `https://api.anthropic.com/v1/messages` |
| Gemini | `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash` | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |

**Model list refresh:** the `Refresh Models` button fetches the live model list from each provider's models endpoint when possible; falls back to a hardcoded list if the models endpoint isn't available or the key for that provider is missing.

Anthropic's browser API requires the `anthropic-dangerous-direct-browser-access: true` header — this is expected and documented; the user understands they're running their own keys in their own browser.

### API key handling

- Single `.env` file upload. Parsed with a simple regex (`^([A-Z_]+)=(.+)$` per line, ignoring comments/blank lines).
- Recognized keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`. User only needs the keys for providers they plan to use.
- Keys are stored in a module-scoped JS object and **never**:
  - Written to `localStorage` / `sessionStorage` / `IndexedDB`
  - Logged to console (even masked)
  - Sent anywhere except the provider's API endpoint in the `Authorization` header
- If the user tries to use a provider they haven't provided a key for, a gentle inline error appears next to the provider picker.

### Structured output — the core technical solution

**The assignment's central problem:** "hit" and "stand" both appear in prose, keyword search fails. **The solution:** require structured JSON output, parse the JSON, read the `action` field directly.

Every provider supports forcing JSON output:
- **OpenAI:** `response_format: { type: "json_object" }` plus a JSON schema in the system prompt. Or `response_format: { type: "json_schema", json_schema: {...} }` for strict mode (GPT-4o-2024-08-06+).
- **Anthropic:** prompt the model to respond in JSON, validate with `JSON.parse`. Optionally use tool calling with a single tool whose input schema is the response shape — even more robust than prompt-based JSON.
- **Gemini:** `generationConfig.responseMimeType: "application/json"` plus `responseSchema`.

**The response schema — the contract:**

```json
{
  "action": "hit | stand | double | split | surrender",
  "confidence": 0.0,
  "short_reasoning": "One sentence, ≤ 90 chars, shown in the dealer orb's speech bubble.",
  "long_reasoning": "2-4 sentences. Shown when user clicks 'Why?' on the bubble.",
  "expected_value_estimate": "positive | neutral | negative"
}
```

The `action` field is an enum — no ambiguity. The client:
1. Parses the JSON.
2. Validates `action ∈ {hit, stand, double, split, surrender}`.
3. Checks legality against the current game state (can't double after hitting, can't split unequal cards, etc.).
4. If invalid/illegal: flag in console, show a friendly error in the bubble, fall back to asking the model again with an error-correcting system message.

### The system prompt

Built dynamically per request, with three composable pieces:

1. **Role + rules** — "You are an expert Blackjack advisor. Rules: dealer stands on S17, 3:2 blackjack payout, late surrender allowed…"
2. **Risk profile** (from the user's selector — see §7):
   - *Conservative:* "Prioritize capital preservation. Prefer stand and surrender in marginal spots."
   - *Balanced:* "Follow basic strategy closely. Take positive-EV risks but avoid marginal plays."
   - *Aggressive:* "Maximize expected value aggressively. Double and split whenever EV is positive, even slightly."
3. **Output contract** — "Respond ONLY with a JSON object matching this schema. No prose before or after."

### The user message (game state)

```
Your hand: 8♠, 6♠ (total: 14, soft: no)
Dealer up card: K♦ (value: 10)
Available actions: hit, stand, surrender
Bet: $10 of $1000 bankroll
What do you recommend?
```

Legal actions are explicitly enumerated — the model doesn't have to guess whether double is allowed.

### Advisor vs. Autoplay mode

- **Advisor mode:** LLM recommends → bubble appears → user clicks "Execute Recommendation" → action runs.
- **Autoplay mode:** LLM recommends → 1.2s pause so the user can read the bubble → action runs automatically. Continues through multi-action hands (hit → hit → stand) with one LLM call per decision.

A toggle in the settings panel switches between modes. Default: Advisor.

### Console output (per the PDF's debugging requirement)

Every LLM interaction logs a collapsible group:

```
▼ Hand #7 · LLM call · gpt-4o
  ├─ System prompt: (full text)
  ├─ User message: (full state)
  ├─ Raw response: {"action": "stand", ...}
  ├─ Parsed action: "stand"
  ├─ Legality check: ✓
  ├─ Basic strategy says: stand (AGREE)
  ├─ Confidence: 0.88
  ├─ Latency: 842ms
  └─ Tokens: 247 in, 58 out
```

This gives Sharish and the grader a clear audit trail for every decision, exactly as the PDF asks.

---

## 6. Structure of the App

### File layout

```
/
├── index.html              # The single page
├── css/
│   ├── base.css            # Resets, CSS variables, typography
│   ├── table.css           # Felt, chips, cards
│   ├── orb.css             # Dealer AI orb + speech bubble
│   ├── panels.css          # Settings panel, dashboard
│   └── levels.css          # Per-zone palette overrides
├── js/
│   ├── main.js             # Bootstrap, event wiring
│   ├── env.js              # .env parsing, key management (in-memory)
│   ├── deck.js             # Card + deck + shuffle
│   ├── game.js             # Hand state, rules, payouts, round flow
│   ├── strategy.js         # Basic strategy lookup table
│   ├── providers/
│   │   ├── openai.js       # OpenAI-specific fetch + parse
│   │   ├── anthropic.js    # Anthropic-specific fetch + parse
│   │   └── gemini.js       # Gemini-specific fetch + parse
│   ├── agent.js            # Provider-agnostic agent interface, prompt builder, JSON validation
│   ├── ui/
│   │   ├── table.js        # Rendering cards, chips, deal animations
│   │   ├── orb.js          # Orb state machine (idle/thinking/speaking/reacting)
│   │   ├── bubble.js       # Typewriter speech bubble
│   │   ├── levels.js       # Zone transitions, level-up moment
│   │   ├── audio.js        # Howler-backed audio manager with cross-fades
│   │   └── dashboard.js    # Performance analytics panel
│   └── history.js          # Hand history log + export
├── assets/
│   ├── audio/              # Ambient loops, SFX, level stingers
│   ├── fonts/              # Self-hosted display + body fonts
│   └── img/                # Card face SVGs, chip SVGs, background textures
└── temp/                   # Reference implementation (NOT deployed)
```

### The single page

No routing. One HTML file. Major regions:
- **Top bar** — title ("BLACKJACK WITH AI AGENTS"), level indicator (Roman numeral), ABOUT button, gear icon for settings
- **The table** — felt surface, dealer zone, player zone, chip tray, betting circle
- **The dealer orb** — floats near the table, left or right, with its speech bubble
- **Dashboard drawer** — pulls up from the bottom edge, shows performance analytics
- **Settings drawer** — slides in from the right, all controls live here
- **History log** — collapsible panel, shows past hands

---

## 7. Feature List (the enhancements)

The PDF requires 2+ enhancements. This spec ships **four**:

### 7.1 Basic Strategy Overlay (enhancement #1)

- A precomputed basic strategy lookup table lives in `strategy.js`.
- For every recommendation, compute what basic strategy says independently.
- Display both in the UI: orb says "stand", small chip next to it reads "✓ matches basic strategy" or "⚠ basic strategy says surrender".
- Track **agreement rate** across the session. Displayed in the dashboard.
- This is also the core of decision-quality scoring for the analytics.

### 7.2 Performance Analytics Dashboard (enhancement #2)

A pull-up drawer from the bottom edge. Shows:
- **Bankroll curve** — line chart of balance over hand #
- **Win rate** — % wins, % losses, % pushes
- **ROI** — net profit/loss as % of total wagered
- **Decision quality** — % of decisions matching basic strategy
- **Avg confidence** — mean `confidence` field across all recs
- **Per-model comparison** — if multiple providers used, side-by-side
- **Token/cost tracker** — running tally, rough $ estimate per provider

All computed client-side from the hand history log.

### 7.3 Risk Profile Selector (enhancement #3)

Three profiles in the settings: **Conservative**, **Balanced**, **Aggressive**. Each profile modifies the system prompt (see §5). The dashboard shows how recommendations shift across profiles — a demonstrable, reproducible change in agent behavior from prompt engineering alone.

### 7.4 The Climb (enhancement #4 — the showpiece)

Zone-based level progression. Visual environment, audio bed, and chip design shift on advancement. See §3.

---

## 8. Aesthetic Direction — The Scene

**One-line vision:** *A private, candlelit Vegas table at midnight, with a pulsing intelligence seated across from you.*

### Visual identity

**Color palette (base / Level 1):**
- `--felt`: `#0e3b2e` (deep forest green, slightly desaturated)
- `--felt-highlight`: `#145843` (subtle radial glow under the playing area)
- `--gold`: `#c9a961` (primary accent — borders, numbers, title)
- `--gold-bright`: `#e6c87a` (highlights, glow)
- `--gold-deep`: `#8a6f3c` (shadows on gold elements)
- `--ivory`: `#f4ead5` (card faces, text on felt)
- `--shadow`: `#02130b` (deep shadow under cards and chips)
- `--blood`: `#8c1c1c` (loss pulses, red suits)
- `--orb`: `#f0d98c → #fff4d0 → #ffffff` (radial gradient for the AI orb)

Each climb level re-maps these via CSS variable swap. The felt shifts from forest green → burgundy velvet → midnight blue → black marble → (level 5 TBD against reference).

### Typography

- **Display:** `Playfair Display` or `Cormorant Garamond` (self-hosted). Serif, tall, with pronounced contrast. For "BLACKJACK WITH AI AGENTS", level names, card ranks on face cards.
- **Body:** `EB Garamond` or `Lora`. Refined serif for readability without losing the classic-casino register.
- **Monospace (console overlays only):** `JetBrains Mono` at small sizes for the debug drawer and console-styled details.

Avoid `Inter`, `Roboto`, `Arial`, and system sans-serif. This is a *private casino*, not a dashboard.

### Card design (photorealistic)

- SVG-based card faces with subtle paper texture overlay (noise SVG filter at low opacity).
- Each card has three layers: base (ivory with off-white grain), ink (suit + rank in true red `#a01818` or deep black `#0a0a0a`), and a soft inner shadow on the bottom-right for depth.
- Card backs: reactive — a subtle art-deco diamond lattice in gold on deep red, with a slow shimmer animation (conic gradient rotation at 8s per cycle). The shimmer speeds up during dealing.
- Each card has a real drop shadow (`filter: drop-shadow(0 6px 18px rgba(0,0,0,0.55))`) that updates during flip animations.

### Card dealing animation (cinematic)

Each dealt card:
1. Starts face-down at the deck position (top-right of the table).
2. Arcs through 3D space with perspective (`transform: translate3d + rotateY + rotateX`).
3. Lands at its target position with a slight bounce (cubic-bezier `0.34, 1.56, 0.64, 1`).
4. Flips face-up on landing (player cards only; dealer's hole card stays down until reveal).
5. Shadow softens as it settles.
6. Duration: ~450ms per card, slight stagger between cards in a deal (120ms).

Hole card reveal: full 3D Y-rotation with an accelerating ease, ~550ms.

### Chip stack (betting visualization)

- Chips are 3D-feeling: layered divs with `box-shadow` rings to simulate the chip edge pattern.
- Denominations: $1 (white), $5 (red), $10 (blue), $25 (green), $100 (black), $500 (purple), $1000 (gold — unlocked at higher climb levels).
- When the user changes the bet, chips *physically stack and unstack* in the betting circle with a 180ms ease per chip, tiny rotation variance for personality.
- Balance display: a chip tower on the chip tray, height proportional to log($balance). Updates with a springy animation.

### The dealer orb

- A `<div>` with a radial gradient core, wrapped in three concentric glow layers (box-shadows at increasing blur/spread).
- **Idle:** slow breathing animation (scale 1.0 → 1.04 over 3s), gold gradient.
- **Thinking:** scale pulses faster, hue shifts slightly toward white-gold, three "thinking dots" orbit the perimeter in a slow rotation.
- **Speaking:** orb stabilizes, emits a soft ring pulse each time a new word types in the bubble.
- **Reacting to outcomes:**
  - Win: flares brighter, brief gold ring expands outward
  - Loss: dims, cools to a grayer tone briefly
  - Blackjack: major flare, multiple rings, ~1.2s celebration
  - Bust: orb shudders, red edge bleed
- Hovers off-table by default; on mobile, anchors to the top-right corner.

### Speech bubble

- Elegant tapered bubble with a tail pointing to the orb.
- Parchment-colored background (`var(--ivory)` with a subtle inner shadow).
- Serif type, slightly larger than body (18–20px).
- Typewriter effect: each character appears with a ~22ms delay, with a tiny cursor block that blinks until the sentence completes.
- `Why?` link at the bottom-right reveals the `long_reasoning`.
- Small meta row underneath: model name, confidence %, latency.

### Win / Lose / Blackjack moments

- **Win:** felt pulses gold from the center outward (1 ring, 600ms). Chip tower grows with a spring. A soft "ding" SFX. Orb flares.
- **Blackjack:** full-screen gold shimmer sweep across the felt (600ms), a louder celebratory stinger, orb does its full flare, a brief "BLACKJACK" typeset appears in display serif across the felt (fades in and out, 1.4s total).
- **Loss:** felt pulses red from the center (400ms), chip tower shrinks, a subdued "thud" SFX, orb dims.
- **Bust:** orb shudders, red edge bleed, screen shakes by 3px for 180ms, deep thud SFX.
- **Push:** neutral chime, no flash.
- **Surrender:** soft sigh SFX, felt briefly desaturates, orb remains neutral.

### Backgrounds & atmosphere

Each zone has a layered background:
- **Base:** a rich textured gradient (felt at level 1, velvet at level 2, etc.)
- **Overlay:** a fine noise/grain SVG filter at ~3% opacity for film-grain feel
- **Vignette:** radial darkening at the edges to focus attention on the table
- **Atmospheric particles (optional, low density):** slow-drifting dust motes for candlelight effect, implemented as a CSS-only animation

### Layout composition

- Table is **centered but asymmetric** — the dealer orb lives in the upper-right negative space, breaking strict symmetry and giving the scene a *gaze*.
- Generous padding around the table, no elements fighting the cards for attention during a hand.
- Settings and dashboard live off-canvas until invoked.
- The **level indicator** (Roman numeral, e.g. `II`) lives in the top-left, set large in display serif, quietly watermarked over the background — not a loud HUD element.

---

## 9. Audio Design — The Soundscape

Audio is **not decoration here**. It is the other half of the atmosphere. The page will sound as intentional as it looks.

### Tech

- **[Howler.js](https://howlerjs.com/)** for audio management — handles sprite loading, cross-fades, master volume, gapless loops.
- All audio files self-hosted in `assets/audio/`.
- Master volume slider in settings (defaults to 60%).
- Mute toggle (keyboard shortcut `M`).
- All audio initialization deferred until first user interaction (browser autoplay policy).

### The ambient bed (per zone, cross-faded on level up)

Each zone has one looping ambient track that plays at low volume (~20–25% of master) under everything:

- **Level 1 — The Lounge:** smoky late-night jazz trio, upright bass walking, brushed drums, occasional piano. Think Blue Note at 1am. Tempo ~90bpm.
- **Level 2 — *(TBD, pending reference)*:** candidate — velvet-room bossa or more orchestrated jazz with strings.
- **Level 3 — *(TBD)*:** candidate — richer, heavier, deeper room tone. Darker piano, tension.
- **Level 4 — *(TBD)*:** candidate — electronic undercurrent emerges, noir synths under the jazz, tempo subtly drops.
- **Level 5 — *(TBD)*:** candidate — full cinematic score territory, spare and reverent, whatever the "summit" feels like.

Cross-fade duration between zones: **2.2 seconds**, equal-power crossfade curve (Howler supports this natively).

### Ambient room noise (persistent, layered over music)

A second looping track at ~8% volume:
- Soft crowd murmur (indistinct conversation in the distance)
- Occasional glass clink
- Distant laughter, once every 40–60 seconds
- Subtle HVAC hum

This is the layer that makes the page feel *inhabited*.

### SFX library (triggered by game events)

Every significant event has a dedicated SFX. All are layered over the ambient bed at ~40–55% volume.

| Event | Sound |
|---|---|
| Card dealt (player) | Crisp paper snap + soft slide |
| Card dealt (dealer, face down) | Muted snap, slightly deeper |
| Hole card flip | Longer paper flick + soft thump |
| Chip placed (bet) | Single chip clink (ceramic, not plastic) |
| Chip stack grows/shrinks | Rapid cascade of chip clicks, pitch-varied |
| Deck shuffled (between hands) | Riffle shuffle + cut |
| Orb thinking | Very subtle synth pad swell, almost subliminal |
| Orb speaking (per word typed) | Tiny tick, almost inaudible — adds to the typewriter feel |
| Recommendation received | Soft chime (single bell tone, resonant) |
| Execute recommendation clicked | Warm button "thunk" |
| Win | Bright ding (warm bell) |
| Blackjack | Celebratory stinger — short, elegant, a small musical flourish (no slot machine energy) |
| Loss | Low, brief thud |
| Bust | Deeper thud + a drop in ambient volume for 200ms (like the room notices) |
| Push | Neutral tick |
| Surrender | Soft paper slide, like cards being pushed away |
| Level up | The big moment — a 2-second stinger that bridges the outgoing and incoming ambient tracks. Should feel like *rising*. |
| Settings drawer open/close | Faint hydraulic slide |
| Error (invalid move, API fail) | Muted electronic "nope" |

### Audio mixing rules

- No two SFX triggered within 50ms of each other — if they collide, the later one drops volume 30% so nothing clips.
- During the level-up moment, ambient tracks cross-fade at a reduced rate (3s instead of 2.2s) to let the stinger breathe.
- The thinking-orb synth pad **ducks** the ambient music by -3dB during an LLM call, then restores on response. This is subtle but makes the "thinking" moment feel weightier.
- On page load, audio fades in from silence over ~1.2s after first interaction.

### Accessibility

- Master mute (keyboard `M`, button in settings).
- Captions toggle: when enabled, SFX triggers also show a small text indicator (e.g., "♪ chip placed") in the corner. Useful for hearing-impaired users and for demos without audio.
- All game state is visually communicated — audio is enhancement, not substitute.

---

## 10. Interaction Design

### Keyboard shortcuts
- `Space` — Play / Execute Recommendation
- `H` — Hit
- `S` — Stand
- `D` — Double
- `P` — Split
- `R` — Surrender
- `M` — Toggle mute
- `⇧ + S` — Open settings drawer
- `⇧ + D` — Open dashboard drawer
- `?` — Show shortcuts overlay

### Mouse / touch
- All buttons have generous tap targets (44px+).
- Hover states use gold underline animations, not color fills (more refined).
- Draggable bet slider with chip-stack preview as you drag.

### Responsive behavior
- Desktop-first (this is a *showpiece*), but degrades gracefully.
- Below 768px: table recomposes vertically (dealer → orb bubble → player), orb anchors top-right as a smaller version.
- Animations reduce in intensity on `prefers-reduced-motion: reduce`.

### Empty / error states
- No API key uploaded → friendly prompt in settings: *"Upload a .env file with your API key to start."*
- API call fails → speech bubble appears: *"The dealer hesitates… (API error: 401 Unauthorized)"*. Orb dims. User can retry or switch providers.
- Invalid JSON returned → automatic retry once with an error-correcting addendum; if it fails twice, fall back to basic-strategy recommendation and mark the hand as "basic strategy fallback" in the log.
- No balance → at level 1, offer a single reset. On the climb, apply the bust rule.

---

## 11. The `temp/` Reference Folder

Per the PDF's instructions:
- `temp/` lives inside the project repo.
- Contains a working static webpage that demonstrates: `.env` parsing, fetch to LLM API, response handling, error handling.
- Claude Code is explicitly told to use it as a reference **only** — not to include it in the final deployment.
- `temp/` is excluded from GitHub Pages deployment (either by branch-based deploy that doesn't include `temp/`, or by a build step that copies everything *except* `temp/` to the deploy branch).

### Prompt for Claude Code (from the PDF, adapted)

```
The temp/ folder contains a working example of a static webpage that
interacts with an LLM via an uploaded .env file. Use it as a reference for:
 - How to parse a .env file for the API key (in-memory only)
 - The fetch() call structure for the LLM API
 - Error handling patterns for failed API requests

Do NOT include the temp/ folder in the final build or deployment.

Build a static Blackjack AI agent page that:
 - Accepts API keys via a single .env file upload (OPENAI_API_KEY,
   ANTHROPIC_API_KEY, GEMINI_API_KEY — user provides whichever they'll use)
 - Implements full-rules Blackjack (deck, dealing, scoring, payouts,
   hit/stand/double/split/surrender)
 - Calls the LLM for a recommendation via structured JSON output so the
   action can be extracted reliably without keyword-search ambiguity
 - Provides Advisor mode (confirm before execute) and Autoplay mode
 - Logs every LLM interaction to the console with full request, response,
   parsed action, legality check, basic-strategy comparison, latency, tokens
 - Tracks player balance across hands
 - Supports OpenAI, Anthropic, and Gemini
 - Implements the climb: multiple visually and sonically distinct levels
   with cross-faded ambient audio and environment swaps on advancement
 - Ships the four enhancements: Basic Strategy Overlay, Performance
   Analytics Dashboard, Risk Profile Selector, and the Climb itself
 - Follows the full aesthetic + audio spec in this document
```

---

## 12. Testability (per PDF)

The PDF emphasizes playing *many* hands and checking consistency. This spec builds testability in:

- **Hand history log** — every hand recorded with timestamp, starting hand, dealer up card, AI recommendation, action taken, outcome, balance change, tokens/cost, and agreement with basic strategy.
- **Export log as JSON** — button in dashboard, download the full session for external analysis.
- **Consistency check built in** — the console log explicitly shows recommendation, parsed action, executed action, and basic-strategy comparison. A single glance tells you whether all three line up.
- **Replay mode (future):** the log is structured to allow replay of past hands for debugging. Not in v1 scope but the data is there.

---

## 13. Non-Goals (v1)

So the scope is crisp:
- ❌ Multi-hand comparison mode (sending the same hand to multiple providers simultaneously) — cool idea, deferred.
- ❌ Insurance bets — adds rules complexity without much agent-decision value.
- ❌ Resplitting — one split depth is plenty for v1.
- ❌ Real card counting (would require a shoe, which we explicitly don't have).
- ❌ User accounts / persistence across sessions — sessionStorage would technically work but adds complexity for no assignment value.
- ❌ Multiplayer / spectator mode.

---

## 14. Deployment

- GitHub Pages, `main` branch, `/` as publish directory.
- `.nojekyll` file at root to allow underscored asset folders.
- `temp/` folder excluded via a `.gitattributes` + `.gitignore` pattern that keeps it in the repo but not in the deployed artifact. Alternative: a small build script that copies everything except `temp/` to a `gh-pages` branch.

---

## 15. Open Questions (locked in on next pass)

These get answered once the `temp/` reference is dropped in:

1. **Climb structure:** how many levels, what are their named themes, what are the advancement thresholds, what's the bust behavior?
2. **Audio specifics per zone:** instrumentation shift per level — reference should clarify the vibe arc.
3. **Visual transition style between zones:** cross-fade (current assumption), or something more theatrical (camera-zoom-out-then-back-in, curtain pull, etc.)?
4. **Chip denomination art:** does the climb unlock new chip designs, or just raise the bet ceiling with existing chips?

Everything else is locked.

---

## 16. Definition of Done

The project is done when:

1. All PDF requirements in §2 are verifiably met.
2. The four enhancements (§7) are shipped and work.
3. A user can play 20+ hands across the climb without hitting a bug.
4. The console log for any hand shows the full agent audit trail.
5. No API key ever touches persistent storage or leaves the browser except in an outbound API call to the provider.
6. On a cold load with audio enabled, the ambient bed fades in, and playing a hand feels *satisfying* — the cards have weight, the chips clink, the orb pulses, the felt breathes, and when the hand ends, the outcome *lands*.
7. A classmate who has never seen the project can play it, understand what's happening, and want to keep playing.

The last point is the real test.

---

*End of spec.*
