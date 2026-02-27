# Paper Airplane — Endless Runner Spec

## Overview

A forward-facing 3D-perspective endless runner where you ARE a paper airplane thrown from a classroom that embarks on an epic journey through 5 distinct zones. Obstacles spawn from a vanishing point on the horizon and rush toward the player, scaling up as they approach. The player dodges by moving vertically and horizontally. Each zone has its own real music track with obstacles synced to the BPM.

The game should feel like a **spike jumper** at its core — obstacles come at you, you time your movement to survive — but the forward-facing depth perspective, zone progression, music integration, and heavy juice effects make it a unique experience.

**Core Story:** A paper airplane is thrown in class and goes on the adventure of a lifetime — soaring through a city, ascending past mountains into the northern lights, drifting through outer space, plummeting back down through a neon-lit city at night, and finally gliding peacefully over a moonlit ocean.

---

## Perspective & Camera

- **Forward-facing 3D depth** — the player flies INTO the screen
- Camera is positioned behind and slightly above the paper airplane
- A vanishing point on the horizon is where all obstacles originate
- Obstacles appear small/distant and scale up as they approach
- The plane is visible in the lower-center area of the screen, seen from behind
- Parallax layers create depth (foreground rushes past, background moves slowly)
- Use canvas 2D with scaling tricks to simulate 3D depth (no WebGL needed)

---

## Controls

- **Arrow Keys / WASD** — move the plane up, down, left, right
- The plane constantly flies forward (auto-scroll, player cannot stop it)
- Movement is smooth with easing — no instant snapping
- The plane tilts in the direction of movement (bank left/right, pitch up/down)
- There should be slight inertia — the plane doesn't stop moving immediately when you release keys

---

## Player Character — The Paper Airplane

- A paper airplane seen from behind (triangular/angular paper shape)
- **Drawn-on eyes** on the back of the plane, visible to the player
  - Eyes widen when near obstacles (fear)
  - Eyes squint during high speed
  - Eyes look in the direction of movement
  - Eyes go dizzy/spiral on death
- **Squash & stretch:** Wings flex on movement — spread wide on climb, fold tighter on dive
- **Anticipation:** Plane dips slightly before climbing, leans before turning
- **Contrail particles** always trail behind the plane (white wispy lines)
- As the run gets longer, the plane accumulates visual wear — subtle creases and small tears appear, making long runs feel earned

---

## Vertical & Horizontal Boundaries

- The plane can move freely within the screen bounds
- Flying off the edges of the screen is not possible (soft boundary, plane stops at edges)
- Obstacles occupy specific positions in the "flight corridor" — the player navigates gaps
- The corridor may narrow or shift in certain pattern chunks to increase difficulty

---

## Zone Structure

The game progresses through 5 zones. Each zone has a unique song, visual theme, obstacle set, and parallax layers. Zone transitions feature a crossfade between parallax layers and a brief "zone name" title card that fades in and out.

### LAUNCH — Classroom (Non-playable, ~3 seconds)

- **Visuals:** A classroom. Desks, chalkboard, students, a window.
- **Animation:** A hand throws the paper airplane. Camera follows it as it soars across the room and out an open window. The world opens up.
- **Audio:** Whoosh of the throw, classroom ambiance fading out, then Zone 1's song fades in.
- **Purpose:** Sets the story. Not playable — purely cinematic.

---

### ZONE 1 — City (Daytime) ☀️

**Song:** No Role Modelz — J. Cole
**Filename:** `no-role-modelz.mp3`
**BPM:** 100
**Offset:** _(to be determined — milliseconds before first beat)_

**Visuals:**
- Daytime city skyline
- Buildings line both sides creating a corridor of depth
- Blue sky above, streets and cars far below
- Sun glare and subtle lens flare
- Warm golden-hour color palette

**Parallax Layers:**
1. Foreground — close building edges and rooftops rushing past
2. Mid — buildings and structures at medium distance
3. Far — distant skyline silhouettes
4. Background — blue sky with scattered clouds (nearly static)

**Obstacles:**
- Construction cranes swinging across the corridor
- Building gaps to thread through (two buildings close together)
- Billboards blocking portions of the flight path
- Water towers on rooftops
- Flocks of pigeons that scatter on approach (moving obstacle cluster)
- Window washer platforms hanging between buildings
- Clotheslines strung between buildings

**Pattern Chunks (3):**

1. **Crane Alley** — Cranes alternate left-right, swinging arms create a zigzag path. Moderate pacing, teaches left-right dodging.
2. **Billboard Corridor** — Large billboards block sections of the screen in sequence. Gaps are positioned so the player must read ahead and commit to a lane.
3. **Pigeon Burst** — A flock of pigeons appears on the horizon and scatters as they approach, creating a chaotic but navigable cloud of moving obstacles.

**Mood:** Smooth, confident, cruising. This is the tutorial zone — players learn the controls and the feel of the game. 100 BPM keeps things relaxed.

---

### ZONE 2 — Northern Lights 🌌

**Song:** In Ibiza — Trae The Truth
**Filename:** `in-ibiza.mp3`
**BPM:** 158
**Offset:** _(to be determined)_

**Visuals:**
- Dark sky filled with shimmering green and purple aurora curtains
- Snow-capped mountain range below
- Stars visible in the sky
- Everything has an ethereal, glowing quality
- Cool blue/green/purple color palette

**Parallax Layers:**
1. Foreground — mountain peak silhouettes rushing past
2. Mid — mid-range mountain peaks with snow detail
3. Far — distant mountain range (slow scroll)
4. Background — aurora bands rippling across the sky, star field

**Obstacles:**
- Mountain peaks jutting up from below
- Aurora energy bands (horizontal glowing bars to dodge through gaps)
- Ice crystal formations (jagged, translucent)
- Eagles swooping in from the sides
- Radio tower antennas on mountain peaks (thin, hard to see)
- Wind gust zones that push the plane sideways (visual: streaking wind lines)

**Pattern Chunks (3):**

1. **Peak Slalom** — Mountain peaks alternate sides, player weaves between them. Faster pacing matches 158 BPM.
2. **Aurora Curtain** — Horizontal aurora energy bands span the screen with gaps. Bands pulse and shift slowly — gaps move, requiring adjustment.
3. **Eagle Dive** — Eagles swoop from above in timed patterns synced to beats. Player must track multiple moving threats simultaneously.

**Mood:** Majestic, fast, exhilarating. Big BPM jump from Zone 1 (100 → 158). The aurora visuals pulsing to the beat should look incredible.

---

### ZONE 3 — Space 🚀

**Song:** Power Trip — J. Cole
**Filename:** `power-trip.mp3`
**BPM:** 100
**Offset:** _(to be determined)_

**Visuals:**
- Black void of space
- Dense star field
- Earth visible below, shrinking as you ascend
- Nebula clouds with subtle color (purple, blue, orange)
- Space stations and satellites catching sunlight

**Parallax Layers:**
1. Foreground — close space debris and small particles
2. Mid — satellites, station structures, larger debris
3. Far — distant star field (slow drift)
4. Background — deep nebula glow and Earth's curvature

**Obstacles:**
- Asteroids tumbling toward you (various sizes, rotating)
- Satellite dishes and solar panel arrays
- Space junk clusters (nuts, bolts, panels)
- ISS-like structures to fly through (tight corridors)
- Tethered astronauts (moving unpredictably on tethers)
- Satellite laser beams (thin lines across the corridor)

**Pattern Chunks (3):**

1. **Asteroid Field** — Rocks of varying sizes tumble toward you. Some rotate, some drift sideways. Find the gaps between them.
2. **Station Fly-Through** — A large space station structure approaches. Must navigate through its internal corridor (tight walls, girders, panels).
3. **Debris Cloud** — Dense cluster of small fast-moving objects. Requires precise micro-movements to thread through.

**Mood:** BPM drops back to 100 but it feels completely different from Zone 1. Quiet, tense, weightless. The slower rhythm creates suspense. Obstacles are harder to see against the dark background — silhouettes against nebula glow.

---

### ZONE 4 — Falling City (Nighttime) 🌃

**Song:** A Tale of 2 Citiez — J. Cole
**Filename:** `tale-of-2-citiez.mp3`
**BPM:** 190
**Offset:** _(to be determined)_

**Visuals:**
- Nighttime city but the plane is DESCENDING — the perspective shifts to feel like you're plummeting downward through a city
- Neon signs everywhere — pinks, blues, purples, oranges
- Lit windows in buildings streaking past
- Rain falling (particles)
- Streetlights and traffic far below rushing up
- Completely different visual identity from Zone 1's daytime city

**Parallax Layers:**
1. Foreground — neon signs and building edges streaking past
2. Mid — skyscraper faces with lit windows
3. Far — distant city grid of lights
4. Background — dark sky above receding, rain streaks

**Obstacles:**
- Neon signs protruding from buildings (various sizes and angles)
- Rooftop antennas and satellite dishes
- AC units on building ledges
- Fire escape structures
- Drones flying erratically
- Fireworks bursting (expanding hazard zones)
- Helicopters with spinning rotors
- Steam vents blasting upward

**Pattern Chunks (3):**

1. **Neon Gauntlet** — Neon signs flash and block paths in rhythm with the 190 BPM. Fast, stroboscopic, intense.
2. **Rooftop Descent** — Dense clusters of rooftop infrastructure (antennas, AC units, pipes). Tight gaps, fast approach speed.
3. **Firework Burst** — Fireworks launch and explode, creating expanding circular hazard zones the player must anticipate and avoid.

**Mood:** FASTEST ZONE. Pure adrenaline. 190 BPM is nearly double Zone 1. Neon lights, rain, and speed create visual chaos. This is the ultimate skill check. Surviving this zone should feel like an achievement.

---

### ZONE 5 — Ocean 🌊

**Song:** The Let Out — Jermaine Cole
**Filename:** `the-let-out.mp3`
**BPM:** 130
**Offset:** _(to be determined)_

**Visuals:**
- Open ocean at night
- Full moon overhead reflecting on the water surface
- Gentle waves rolling
- Bioluminescent glow in the water (blue/green)
- Occasional islands, boats, lighthouses in the distance
- Serene but still dangerous

**Parallax Layers:**
1. Foreground — wave crests and spray
2. Mid — ocean surface with moonlight reflections
3. Far — distant horizon line, occasional island silhouettes
4. Background — moonlit sky with scattered clouds, stars

**Obstacles:**
- Lighthouse beams (rotating light bars that sweep across the flight path)
- Boat masts and rigging
- Rock formations / sea stacks jutting from the water
- Seagulls flying in formations
- Whale spouts (geysers of water shooting up)
- Low-hanging cloud banks (obscure vision temporarily)
- Buoys bobbing on waves

**Pattern Chunks (3):**

1. **Lighthouse Sweep** — One or more lighthouse beams rotate, creating timing-based obstacles. Must pass through when the beam isn't in your path.
2. **Rock Archipelago** — Sea stacks and rock formations create a dense field to thread through. Some rocks are partially submerged (harder to see).
3. **Wave Crests** — Large waves rise up from below, creating temporary walls. Must time movement to pass over or between them as they crest and fall.

**Mood:** The cool-down. 130 BPM is moderate — faster than the city but way calmer than Zone 4. Peaceful, reflective, beautiful. Moonlight on bioluminescent water is the visual reward for surviving the Falling City. Still challenging enough to keep you engaged.

---

## Zone Transitions

- When approaching a zone boundary, the current zone's parallax layers begin to fade out while the next zone's layers fade in over ~2 seconds
- A **zone title card** appears center-screen: the zone name in large text, fades in and out
- The current song crossfades into the next zone's song (fade out over 1 sec, new song fades in over 1 sec)
- The **Now Playing notification** appears in the **top-right corner**:
  - Format: `🎵 Song Title — Artist`
  - Animation: **Slides in from the right**, stays for **5 seconds**, then **fades out**
  - Clean, minimal design — semi-transparent dark background with white text
  - Example: `🎵 No Role Modelz — J. Cole`
- Speed may adjust between zones to match the new BPM feel

---

## Song Registry

Claude Code: reference this table for all music integration. Audio files will be located in an `/audio/` directory.

| Zone | Filename | Display Title | Artist | BPM | Offset (ms) |
|------|----------|--------------|--------|-----|-------------|
| City | `no-role-modelz.mp3` | No Role Modelz | J. Cole | 100 | TBD |
| Northern Lights | `in-ibiza.mp3` | In Ibiza | Trae The Truth | 158 | TBD |
| Space | `power-trip.mp3` | Power Trip | J. Cole | 100 | TBD |
| Falling City | `tale-of-2-citiez.mp3` | A Tale of 2 Citiez | J. Cole | 190 | TBD |
| Ocean | `the-let-out.mp3` | The Let Out | J. Cole | 130 | TBD |

**Implementation notes for Claude Code:**
- Load audio files using the Web Audio API
- Use each song's BPM to calculate beat intervals: `beatInterval = 60000 / BPM` (in ms)
- The offset value defines how many milliseconds into the audio file the first beat occurs
- Obstacle spawning should align to beat intervals
- Crossfade between songs during zone transitions (fade out current over 1s, fade in next over 1s)
- If an audio file fails to load, the game should still be playable without music

---

## Juice Effects

### Squash & Stretch
- Paper airplane wings flex on movement
- Wings spread wide when climbing, fold tighter when diving
- Paper bends and flexes on sharp direction changes
- Landing near a surface causes a brief compression

### Eyes / Expression
- Two drawn-on eyes on the back/top of the plane, always visible to the player
- Eyes look in the direction of movement
- Eyes widen in fear when near obstacles
- Eyes squint during high speed sections
- Eyes go dizzy/spiral on death
- Subtle but adds tons of personality

### Easing
- All movement transitions use easing curves — no instant position changes
- The plane accelerates into movement and decelerates out
- Camera movements (zone transitions, death) use smooth easing

### Particles
- **Contrails** — always trailing behind the plane (white wispy lines)
- **Zone-specific particles:**
  - City: dust motes, paper scraps in the wind
  - Northern Lights: aurora shimmer particles, snowflakes
  - Space: star streaks during speed, small debris particles
  - Falling City: rain drops, neon sparks, steam wisps
  - Ocean: sea spray, bioluminescent specks
- **Near-miss particles** — sparks/streaks when narrowly dodging an obstacle
- **Death particles** — paper confetti burst (torn paper pieces in various sizes)
- **Zone transition particles** — burst of particles matching the new zone's theme

### Screen Shake
- **Near-misses** — brief subtle shake
- **Zone transitions** — medium shake during the transition moment
- **Turbulence zones** — sustained rumble shake (within certain pattern chunks)
- **Death** — strong sharp shake on impact before the freeze frame
- Shake intensity should be tunable — never nauseating

### Death Animation
1. **Freeze frame** — game pauses for 300ms on impact
2. **Screen shake** — sharp, strong shake during the freeze
3. **Crumple animation** — the paper airplane crumples/folds in on itself (~500ms)
4. **Confetti burst** — torn paper particles explode outward from the crumple point
5. **Fade to game over screen** — after particles settle (~1s)
6. Total death sequence: ~2 seconds. Should feel impactful, not frustrating.

### Freeze Frames
- 300ms freeze on death impact (before crumple)
- Brief 100ms freeze on entering a new zone (dramatic pause)

### Anticipation
- Plane dips slightly before climbing
- Plane leans before turning
- Slight "wind-up" feel to all movements

### Sound Design
- **Whoosh** — on directional movement (pitch varies with speed)
- **Wind ambient** — constant, intensity increases with speed
- **Fwip** — near-miss sound (satisfying, quick)
- **Paper rustle** — subtle ambient paper fluttering
- **Crumple** — death sound (crunching paper)
- **Zone transition** — swell/whoosh sound bridging zones
- **UI sounds** — menu clicks, score tally on game over
- All sounds should be generated programmatically using the **Web Audio API** (oscillators, noise, filters) — no additional audio files needed beyond the 5 songs

---

## Rhythm Integration (Stretch Challenge: Rhythm Runner)

This game integrates rhythm mechanics throughout all zones, not as a separate mode.

### Beat-Synced Obstacles
- Obstacles spawn timing is aligned to beat intervals based on the current zone's BPM
- `beatInterval = 60000 / BPM` gives the base interval
- Obstacles can spawn on every beat, every 2nd beat, every 4th beat, etc. depending on density needed
- Pattern chunks are designed in beat-length units (e.g., a chunk might be 8 beats long)

### Rhythm Scoring
- **On-beat bonus:** When the player makes a dodge/movement that coincides with a beat, they receive bonus points
- Timing windows:
  - **Perfect** (within ±50ms of beat): 3x bonus, bright flash effect
  - **Good** (within ±150ms of beat): 1.5x bonus, subtle glow effect
  - **Miss** (outside ±150ms): no bonus, no visual feedback
- A small rhythm accuracy indicator appears briefly on perfect/good hits

### Visual Beat Feedback
- Screen edges pulse subtly to the beat (barely perceptible but felt)
- Background elements (parallax layers) can subtly pulse or shift to the rhythm
- Obstacles that are beat-synced can have a subtle glow or pulse as they spawn
- The contrail behind the plane pulses to the beat

---

## Scoring System

| Source | Points | Notes |
|--------|--------|-------|
| Distance | 1 point per unit | Always accumulating |
| Near-miss | +50 points | Threading close to an obstacle without hitting it |
| Combo multiplier | x2, x3, x4... | Consecutive near-misses build the multiplier. Resets on taking damage or going 5 seconds without a near-miss |
| On-beat bonus | +25 (good), +75 (perfect) | Rhythm accuracy during dodges |
| Zone completion | +500 points | Bonus for reaching each new zone |

---

## Difficulty Progression

- **Within zones:** Speed gradually increases from the start to end of each zone
- **Between zones:** Base speed increases with each new zone
- **Obstacle density:** More obstacles per pattern chunk in later zones
- **BPM drives pacing:** Higher BPM zones (158, 190) naturally feel harder because obstacles arrive faster
- **Visual complexity:** Later zones have more visual noise, making obstacles harder to read
- **Pattern chunk difficulty:** Each zone's chunks range from "introduction" to "challenging"
- **The Falling City (Zone 4) at 190 BPM is the climax difficulty** — surviving it should feel like a real achievement
- **Ocean (Zone 5) is slightly easier** — a reward for surviving Zone 4, but still challenging

---

## UI

### Start Screen
- A hand holding a paper airplane in the center of the screen
- The classroom is visible in the background (blurred or illustrated)
- **"Tap to Throw"** or **"Press SPACE to Throw"** prompt with a subtle bounce animation
- High score displayed below the prompt
- Furthest zone reached displayed
- Clean, minimal design — the airplane is the focus

### HUD (During Gameplay)
- **Top-left:** Distance counter (styled like a flight distance tracker)
- **Top-center:** Current zone name (small, subtle)
- **Top-right:** Score + combo multiplier (multiplier pulses when active)
- **Now Playing notification:** Top-right, slides in during zone transitions (see Zone Transitions section)
- HUD elements should be semi-transparent and minimal — never obscure gameplay

### Game Over Screen
- **Boarding pass design** — styled to look like an airline boarding pass or flight ticket
- Contains:
  - **Flight distance** (total distance traveled)
  - **Destination reached** (zone name where you died)
  - **Score** (total points)
  - **Best combo** (highest multiplier reached)
  - **High score** (all-time best, highlighted if beaten)
  - **Retry button** ("Book Another Flight" or similar)
- The boarding pass slides in from the bottom with a smooth animation
- Background shows the zone where you died, blurred and darkened

---

## High Score Persistence

- Stored in **localStorage**
- Data saved:
  - Best distance
  - Best score
  - Furthest zone reached
  - Best combo streak
- Displayed on start screen and game over screen
- If high score is beaten, a "NEW HIGH SCORE" celebration with particles and screen flash

---

## Bonus Features

### Near-Miss Combo Multiplier
- When the plane passes very close to an obstacle without hitting it, it counts as a "near-miss"
- Consecutive near-misses increase the multiplier: x2 → x3 → x4 → ...
- The multiplier applies to all points earned while active
- Visual feedback: the plane gets a glowing aura that intensifies with higher combos
- The combo resets if 5 seconds pass without a near-miss or if the player dies
- A combo counter is visible in the HUD (top-right, near the score)

---

## Technical Notes for Claude Code

### Architecture
- **Single HTML file** with embedded CSS and JavaScript
- Use **HTML5 Canvas** for all rendering
- Use **requestAnimationFrame** for the game loop
- Use **Web Audio API** for sound effects (generate programmatically) and music playback

### 3D Depth Effect (Canvas 2D)
- Obstacles are defined with a Z position (distance from camera)
- Each frame, Z decreases (object moves closer)
- Screen X and Y are calculated from 3D position using perspective projection:
  - `screenX = (worldX / z) * focalLength + centerX`
  - `screenY = (worldY / z) * focalLength + centerY`
  - `scale = focalLength / z`
- Objects are drawn scaled based on their Z distance
- This creates a convincing 3D depth effect with pure 2D canvas

### Collision Detection
- Collision boxes scale with the object's apparent size
- Only check collisions when objects are "close" (Z is within a threshold near the plane's Z position)
- Use simple rectangle or circle collision for performance

### Performance
- Object pool for obstacles and particles (avoid garbage collection spikes)
- Only render objects within visible Z range
- Particle count should be reasonable — cap at ~100 active particles
- Target 60 FPS consistently

### File Structure
```
/index.html          — single file game (all HTML, CSS, JS)
/audio/
  no-role-modelz.mp3
  in-ibiza.mp3
  power-trip.mp3
  tale-of-2-citiez.mp3
  the-let-out.mp3
```

### Important Implementation Details
- The game must work in modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile support is a nice-to-have but not required — optimize for keyboard controls
- All sound effects should be synthesized using Web Audio API (no additional audio files)
- The 5 music tracks are the ONLY external files — everything else is code-generated
- If music files are missing, the game should still function fully (just without music)
- Canvas should be responsive — fill the browser window, maintain aspect ratio

---

## Summary

This is a paper airplane endless runner with:
- **5 unique zones** with distinct visuals, obstacles, and music
- **Forward-facing 3D depth perspective** (obstacles rush toward you from the horizon)
- **5 real music tracks** synced to gameplay via BPM
- **15 pattern chunks** (3 per zone) that are all hand-designed and completable
- **Full juice effects** (squash/stretch, particles, screen shake, easing, freeze frames, eyes, death animation)
- **Rhythm scoring** (on-beat bonuses with visual feedback)
- **Near-miss combo system** with multiplier
- **Boarding pass game over screen** and **Now Playing notifications**
- **High score persistence** via localStorage
- A narrative arc told purely through zone progression: classroom → city → aurora → space → falling city → ocean

Build it to feel incredible. Every interaction should have feedback. Every moment should have juice. Make the player forget they're looking at a browser game.
