# RGB Chef's Kitchen — Game Specification

## Overview

RGB Chef's Kitchen is an Overcooked-style arcade cooking game where ingredients are pure light. Players control a chibi chef character who physically moves around a top-down kitchen, grabbing Red, Green, and Blue ingredient bottles and pouring them into a bubbling cauldron to mix colors. Customers arrive at the serving window with color orders, and players must match those colors precisely to earn stars. The game teaches RGB color mixing through play — not tutorials. A separate "Recipe Learn" mode offers a deep interactive textbook with a petal color wheel, constrained RGB mixing, palette generation, contrast checking, color blindness simulation, and accessible palette tools, all wrapped in an animated cookbook aesthetic.

---

## Game Modes

### Mode 1: Cooking Competition (The Game)

The core arcade experience. An Overcooked-inspired kitchen where you physically move a chef character between stations, grab RGB ingredient bottles, pour them into a pot, and serve mixed colors to waiting customers.

### Mode 2: Recipe Learn (The Interactive Textbook)

An educational mode accessed via a "Recipe Book" tab. Opens with a 3D cookbook-opening animation. Contains the RGB petal color wheel with constrained two-primary mixing, a full palette generator, contrast checker, color blindness simulator, and accessible palette mode. All stretch challenge features live here.

### Mode Connection

- Any color mixed in the Cooking Competition can be sent to Recipe Learn for deeper exploration
- Palette challenges in the game reference concepts from Recipe Learn
- Color blindness rounds in Act 4 connect to the CVD simulator in Recipe Learn

---

## Mode 1: Cooking Competition — Detailed Spec

### The Kitchen (Game Map)

A top-down (or slight ¾ perspective) view of a restaurant kitchen. The entire UI IS the kitchen — no separate toolbars or panels floating outside the game world.

#### Station Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   [DINING AREA — visible through window, NPCs eating]    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   [SERVING WINDOW]              [MENU BOARD / ORDERS]    │
│   ┌─────────┐                   ┌──────────────────┐     │
│   │ Customer │                  │ Current order    │     │
│   │ stands   │                  │ + patience meter │     │
│   │ here     │                  │ + score          │     │
│   └─────────┘                   └──────────────────┘     │
│                                                          │
│                    ┌───────────┐                          │
│                    │  STOVE /  │                          │
│                    │   POT     │                          │
│                    │ (bubbles) │                          │
│                    └───────────┘                          │
│                                                          │
│                       🧑‍🍳                                │
│                   (player chef)                           │
│                                                          │
│   ┌─────┐    ┌─────┐    ┌─────┐       ┌──────────┐      │
│   │  R  │    │  G  │    │  B  │       │  TRASH   │      │
│   │ 🔴  │    │ 🟢  │    │ 🔵  │       │  CAN     │      │
│   └─────┘    └─────┘    └─────┘       └──────────┘      │
│                                                          │
│                                       ┌──────────────┐   │
│                                       │  RECIPE BOOK │   │
│                                       │  STAND       │   │
│                                       └──────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Station Descriptions

- **Ingredient Bottles (R, G, B):** Three stations at the bottom of the kitchen. Each has a glowing bottle filled with red, green, or blue luminous liquid. Walk up and press SPACE/E to pick up. The bottles glow and cast colored light on the nearby floor.
- **Stove / Pot (center):** The main mixing area. A large bubbling cauldron sits on a stove. The liquid inside reflects the current mixed color. Constant bubble animation, steam particles rising in the mixed color, swirling liquid effect. Walk up while holding a bottle and press SPACE/E to pour — triggers a pour animation with liquid stream particles. Walk up empty-handed and press SPACE/E to stir — opens a momentary precision slider for fine-tuning.
- **Serving Window (top):** Where customers wait. Walk here with a finished dish (interact with pot to "plate" it first) and press SPACE/E to serve. A side-by-side comparison appears showing target vs. your color.
- **Menu Board (top-right):** Displays the current customer order, patience meter, round number, stars earned, and score. Styled as a chalkboard.
- **Trash Can:** Walk here and press SPACE/E to dump the current pot contents and start fresh. Dump animation with splash particles.
- **Recipe Book Stand:** Walk here and press SPACE/E to open a quick-reference palette tool (simplified version of Recipe Learn mode). Shows harmony suggestions for the current order.
- **Dining Area (background, behind serving window):** Visible through a pass-through window. Background NPC customers sit at tables eating colorful dishes. Ambient movement adds life to the scene.

### Player Character (The Chef)

#### Appearance
- Chibi / cute top-down style (similar to Overcooked characters)
- White chef hat, white apron, colored undershirt
- Small, round, expressive face
- Visible legs that animate during movement
- Approximately 48x48 or 64x64 pixel sprite size relative to the kitchen

#### Movement
- **WASD or Arrow Keys** to move in 4 directions (or 8 with diagonals)
- Smooth, responsive movement with slight acceleration/deceleration
- Character faces the direction of movement
- Movement speed is consistent; slightly slower when carrying a bottle
- Collision detection with kitchen stations and walls — cannot walk through objects

#### Walk Cycle Animation
- 4-frame animation per direction (idle, step-left, neutral, step-right)
- Direction-aware: separate sprites for up, down, left, right (or mirrored for left/right)
- Idle animation: subtle breathing/bobbing, occasional blink

#### Carrying State
- When holding a bottle, the character lifts it above their head (visible colored bottle sprite)
- Slightly slower walk speed
- Cannot pick up a second bottle — must pour or drop first

#### Expressions / Reactions
- **Idle:** Gentle bobbing, blinking
- **Pouring:** Focused face, tilting motion
- **Serving (3 stars):** Huge smile, does a victory jump with sparkle particles
- **Serving (2 stars):** Smile, thumbs up
- **Serving (1 star):** Slight wince, shrug
- **Serving (0 stars):** Sad face, chef hat droops
- **Timer running low:** Sweat drops appear, movement animation speeds up slightly
- **Timer critical:** Red-faced panic, sweat flying

#### Interaction System
- **SPACE or E:** Context-sensitive interact button
  - Near ingredient bottle (empty-handed) → Pick up bottle
  - Near pot (holding bottle) → Pour into pot (increases that RGB channel by an increment, amount depends on how long you "pour" — hold the button for continuous pour)
  - Near pot (empty-handed) → Stir / open precision slider overlay
  - Near serving window → Serve dish to customer
  - Near trash can → Dump pot contents
  - Near recipe book stand → Open quick-reference palette overlay
- **Q:** Drop currently held item (bottle returns to its station)
- **ESC:** Pause menu

### Customer NPC Characters

#### Roster
A rotating cast of 10-15 unique customer designs:
- Diverse humans: different hairstyles, skin tones, outfits, accessories, ages
- Fantasy characters (unlocked in later acts): a dragon, a forest elf, a robot, a ghost, a wizard
- Each has a unique name displayed in their speech bubble

#### Behavior Cycle

1. **Entrance Animation:** Customer walks in from the right side of the serving window. Door chime sound effect. Walk cycle animation as they approach the counter.

2. **Order Placement:** Speech bubble pops up above them with:
   - A color swatch showing their desired color
   - In harder levels: only a hex code, or only a color name like "Teal"
   - Order also appears on the Menu Board

3. **Waiting State:** Customer stands at the window with idle animations:
   - Tapping foot
   - Looking at a watch/phone
   - Yawning
   - Waving to get attention
   - Arms crossed (getting impatient)
   - Patience meter visible above their head (green → yellow → red)

4. **Reaction to Service:**
   - **3 Stars (ΔE < 5):** Big smile, hearts float up, happy dance animation, leaves a tip (bonus points), cheerful exit
   - **2 Stars (ΔE < 15):** Nod, thumbs up, satisfied smile, normal exit
   - **1 Star (ΔE < 30):** Shrug, "meh" expression, walks away unimpressed
   - **0 Stars (ΔE ≥ 30 or patience expired):** Angry face, red tint, steam puffs from ears, shakes head, storms off. Player loses a life/chance.

5. **Exit Animation:** Walk off screen to the left with their dish (or without if angry). New customer enters after a brief delay.

#### Special Customers (Act 4 — Accessibility Rounds)

- **Color Blind Customer:** Wears tinted glasses. Their speech bubble shows the color as THEY see it (CVD-simulated). Player must reverse-engineer the actual color they want. A toggle shows the CVD simulation view.
- **Health Inspector:** Walks in with a clipboard and magnifying glass. Doesn't order food — instead inspects the menu board. Player must ensure text/background color combinations meet WCAG AA or AAA contrast ratios.
- **Event Planner:** Carries a binder. Orders an entire palette (5 colors) for a banquet. All colors must have sufficient contrast with a specified "tablecloth" background color.

#### Background / Ambient Characters

- **Dining area customers:** 3-5 NPCs visible through the pass-through window, sitting at tables. They eat, chat, gesture. Purely decorative but add atmosphere.
- **Sous Chef NPC:** Occasionally walks through the back of the kitchen carrying something. Not interactive — just ambient life.
- **Kitchen Cat:** A small cat sprite that wanders around the kitchen floor randomly. Idle animations include sitting, licking paw, sleeping. Purely cosmetic and charming.

### The Pot / Cauldron (Animated Color Explorer)

This is the assignment's "Animated Color Explorer" requirement, disguised as the game's central cooking mechanic.

#### Visual Design
- Large cauldron or modern cooking pot sitting on a glowing stove burner
- The liquid inside displays the current mixed color
- Takes up a significant portion of the center of the kitchen

#### Animations (always active)
- **Bubbling:** Random bubbles rise from the bottom of the pot, pop at the surface. Bubble color matches the current mixed color. Frequency increases with higher total RGB values.
- **Swirling:** The liquid has a slow swirl animation (CSS or canvas gradient rotation).
- **Steam / Particles:** Colored steam particles rise above the pot. Color matches the mix. Particle count and intensity scale with saturation/brightness.
- **Pulse / Breathing:** The pot's glow subtly pulses in and out (breathing effect). The glow color matches the mixed color.
- **Pour animation:** When pouring an ingredient, a stream of colored liquid arcs from the bottle into the pot. Splash particles on impact. The pot liquid ripples.
- **Color transitions:** When the mix changes, the liquid smoothly animates from the old color to the new color (CSS transition or interpolation, ~300ms).

#### Information Display
- **Hex code** floats above the pot like steam text, updating in real-time
- **RGB values** (R: xxx, G: xxx, B: xxx) displayed on a small tag/label attached to the pot
- **Color name** (food-themed, e.g., "Saffron Blaze", "Ocean Mist", "Berry Dusk") appears below the hex code

#### Pour Mechanics
- Each pour interaction adds approximately 15-25 units to that channel (configurable per difficulty)
- Holding the interact button does a continuous pour (value ramps up smoothly)
- Precision slider (accessed by stirring) allows single-unit adjustments
- The pot visually fills as total RGB increases (liquid level rises)

### Scoring System

#### Star Rating (per dish)
- **3 Stars:** Color distance ΔE < 5 (nearly perfect match)
- **2 Stars:** Color distance ΔE < 15 (close)
- **1 Star:** Color distance ΔE < 30 (acceptable)
- **0 Stars:** Color distance ΔE ≥ 30 OR customer patience expired

#### Color Distance Calculation
Use CIE76 ΔE formula (Euclidean distance in Lab color space) for perceptually accurate scoring. Convert RGB to Lab before calculating.

#### Points
- 3 stars = 1000 points + speed bonus (up to 500 extra based on remaining patience)
- 2 stars = 500 points
- 1 star = 200 points
- 0 stars = 0 points, lose one life
- Tip bonus from 3-star: extra 200 points

#### Lives
- Start with 3 lives (represented as chef hats)
- Lose a life on 0 stars
- Game over when all lives lost
- Earn extra life every 5000 points

#### Progression
- Stars unlock new acts/levels
- Cumulative star count gates access (e.g., Act 2 requires 10 stars, Act 3 requires 25, etc.)

### Game Levels / Acts

#### Act 1: Culinary School (Tutorial — 6 levels)

Teaches basic RGB mixing through simple orders. Generous patience timers. On-screen hints.

| Level | Order | Teaching Goal |
|-------|-------|---------------|
| 1-1 | "Mix me pure Red!" | Just pour red. Learn movement + interaction. |
| 1-2 | "I'd like pure Green!" | Same, reinforces controls. |
| 1-3 | "Pure Blue, please!" | Completes the three primaries. |
| 1-4 | "Yellow, please!" | Teaches R + G = Yellow. Surprising for most. |
| 1-5 | "How about Cyan?" | Teaches G + B = Cyan. |
| 1-6 | "Magenta!" then "White!" | Teaches R + B = Magenta, then all three = White. |

- On-screen hints appear: "Tip: Yellow is made of Red + Green light!"
- Patience timers are very generous (60+ seconds)
- Wide star tolerance (ΔE thresholds are relaxed)

#### Act 2: Line Cook (Precision — 10 levels)

Customers order specific colors shown as swatches. Tighter tolerances. Standard patience timers.

- Customers show a specific color swatch
- Player must match within standard ΔE thresholds
- Colors range from easy (primary + secondary) to subtle (salmon, teal, lavender, olive)
- Some rounds show only the hex code, no swatch — player predicts visually
- Teaches the mental model: two largest values = hue, smallest = lightness

#### Act 3: Sous Chef (Palette Challenges — 8 levels)

Customers order not single colors but *palettes* — multiple colors that must be harmonious.

- "Dinner party — I need a complementary pair based on this blue!"
- "Triadic appetizer platter — three colors 120° apart!"
- "Analogous dessert spread — five neighboring colors!"
- Player mixes each color in sequence, one at a time
- Recipe book stand becomes essential — use it to plan your palette
- Unlocks palette harmony concepts through gameplay

#### Act 4: Head Chef — The Accessible Kitchen (Stretch Challenges — 8 levels)

Special customers introduce accessibility challenges.

| Level | Customer Type | Challenge |
|-------|--------------|-----------|
| 4-1 | Color blind (protanopia) | See their view, mix the RIGHT color |
| 4-2 | Color blind (deuteranopia) | Same, different CVD type |
| 4-3 | Color blind (tritanopia) | Same, different CVD type |
| 4-4 | Health Inspector | Fix menu text/background contrast to pass AA |
| 4-5 | Health Inspector | Harder — must pass AAA |
| 4-6 | Event Planner | 5-color palette, all contrast against white |
| 4-7 | Event Planner | 5-color palette, all contrast against dark bg |
| 4-8 | Mixed round | Multiple special customers in sequence |

- CVD simulation overlay toggleable during color-blind rounds
- Contrast ratio displayed in real-time during inspector rounds
- WCAG pass/fail badges shown (AA, AAA, normal text, large text)

#### Act 5: Iron Chef Championship (Endgame — Endless/10 challenge levels)

Fast-paced rounds combining everything. High pressure, tight timers, narrow tolerances.

- **Speed rounds:** 15-second timer per customer
- **Mystery ingredient:** One RGB channel is locked/limited (e.g., "Red is broken! Max 50!")
- **Memory rounds:** See the target color for 3 seconds, then it disappears. Mix from memory.
- **Rush hour:** Multiple customers queue up, orders pile up
- **Combo challenges:** Mix a color, then its complement, then a triadic set — all in sequence
- **Boss round:** A legendary food critic arrives with an impossibly specific color and the tightest tolerance

### Controls Screen (Pre-Game Overlay)

Displayed as a full-screen animated overlay before the game starts. Themed as a kitchen orientation poster.

#### Layout

Title: **"Welcome to Chef RGB's Kitchen!"**

A cute illustration of the chef character waving, standing in a mini kitchen scene. The background has the pot bubbling, bottles glowing, ambient kitchen warmth.

##### Controls Section:

```
🎮 MOVEMENT
   ⬆️
 ⬅️ ⬇️ ➡️   or   W A S D     Move your chef around the kitchen

🔧 ACTIONS
   SPACE  or  E              Pick up / Pour / Interact with station
   Q                         Drop held item
   ESC                       Pause menu

📍 KITCHEN STATIONS
   🔴 🟢 🔵  Ingredient Bottles  — Walk up and grab one!
   🍳  Stove & Pot              — Pour ingredients to mix colors
   🪟  Serving Window           — Deliver your finished dish
   📖  Recipe Book              — Check color harmonies & palettes
   🗑️  Trash Can                — Dump the pot and start over

💡 PRO TIPS
   • Carry only ONE bottle at a time — plan your trips!
   • Hold SPACE while at the pot for a continuous pour
   • Interact with the pot empty-handed to fine-tune (stir)
   • Watch the customer's patience meter above their head!
   • 3-star dishes earn bonus tips!
```

##### Animation on this screen:
- Chef character does a wave animation
- Ingredient bottles pulse/glow in sequence (R → G → B)
- Pot bubbles gently in the background
- Kitchen cat walks across the bottom of the screen

##### Dismiss:
- Large button: **[ START COOKING! ]**
- Or press SPACE to begin
- Screen slides up / fades out and drops the player into the kitchen

##### Accessibility:
- Controls screen also accessible from the pause menu (ESC → "Controls")
- Remappable keys stretch goal if time permits

### Visual Style (Competition Mode)

#### Overall Aesthetic
- Dark, moody kitchen atmosphere — think a professional restaurant kitchen at night
- Main illumination comes from the stove glow and the RGB bottles casting colored light
- Warm ambient lighting (slight orange-brown tint on surfaces)
- Pixel art or clean vector chibi style for characters and objects
- Rich, saturated colors for the interactive elements against the dark background

#### Surfaces & Textures
- Dark wood or dark tile floor with subtle texture
- Stainless steel counters with slight reflection
- Chalkboard texture for the menu board (chalk-style font)
- Warm brick or dark tile wall behind the stove
- Frosted glass pass-through window to the dining area

#### Lighting Effects
- R, G, B bottles cast radial colored light on the floor around them
- The pot casts a glow in the current mixed color
- Overhead warm lights create subtle pools of light on work surfaces
- When pouring, the stream of liquid creates a moving light trail

#### Typography
- Menu board / UI: Handwritten chalk-style font (e.g., "Caveat", "Patrick Hand", "Permanent Marker")
- Hex codes / technical values: Monospace font (e.g., "JetBrains Mono", "Fira Code")
- Customer speech bubbles: Rounded, friendly sans-serif (e.g., "Nunito", "Quicksand")

#### Sound Design (if implemented)
- Kitchen ambiance: sizzling, distant chatter
- Pour sound: liquid pouring/splashing
- Bubble sounds from the pot
- Door chime when customer enters
- Star earned: ding/chime
- 3-star: fanfare
- 0-star: sad trombone
- Background music: upbeat, jazzy kitchen theme

---

## Mode 2: Recipe Learn — Detailed Spec

### Cookbook Opening Animation

Triggered when the player clicks the "Recipe Learn" tab/button from the main menu.

#### Animation Sequence (3-5 seconds total):

1. **Book appears** (~0.5s): A leather-bound cookbook slides up from the bottom of the screen. Dark brown leather cover with gold embossed text: "The RGB Chef's Handbook". A small embossed color wheel on the cover.

2. **Cover flips open** (~1s): The front cover rotates on its left edge (3D CSS perspective transform or canvas animation). The inside cover briefly visible — has a handwritten "Property of Chef RGB" note.

3. **Pages fan** (~1s): Several pages flip quickly (rapid page-turn animation), suggesting the book has many chapters.

4. **Landing** (~0.5s): Pages settle and stop on the first chapter. The page content fades in.

5. **UI appears** (~0.5s): Navigation tabs slide in from the right edge, styled as colored bookmark ribbons poking out of the page edges.

#### Persistent Book Frame

After opening, the Recipe Learn mode is framed by the book:
- Visible book spine on the left edge
- Parchment / cream-colored page texture as the background
- Page tabs (bookmarks) on the right edge for switching sections
- A "close book" button (X) in the top-right that triggers a reverse closing animation and returns to the main menu

### Section 1: The Petal Color Wheel

The central educational tool. A faithful recreation of the RGB petal color wheel.

#### Petal Wheel Visualization (center-left of the page)

- Full RGB spectrum arranged as petals radiating from a white center
- Each petal represents a single hue
- Gradient within each petal: white (center) → pure saturated color (mid-petal) → near-black (tip)
- Black background behind the wheel for contrast
- Interactive: hovering a petal highlights it; clicking selects that color
- Approximately 36 petals covering the full 360° hue range

#### Two-Primary Selection Panel (right side)

- Three large circular buttons: R (red), G (green), B (blue)
- Radio-style selection: click two to select them (third is automatically the "constrained" one)
- Visual feedback: selected primaries have a glowing border/ring; unselected one is dimmed
- Label below: "Click two primaries to set your hue range"
- The petal wheel visually highlights the hue range covered by the selected two primaries

#### RGB Sliders (constrained)

- Three horizontal sliders for R, G, B
- The two selected primaries: full range 0-255
- The third (constrained) primary: range limited to 0 → min(other two)
- The constrained slider has a visual indicator (different track color, lock icon) showing it's limited
- Slider handles glow in their respective colors
- Values displayed numerically next to each slider

#### Color Wheel Marker

- A circular marker/dot on the petal wheel shows the current mixed color's position
- Moves in real-time as sliders are adjusted
- Bright saturated colors → marker appears in the middle of a petal
- Dark colors → marker moves toward petal tips
- Light/pastel colors → marker drifts toward the white center
- Smooth animated transitions when marker moves

#### Color Preview & Info

- Large color swatch showing the currently mixed color
- Hex code displayed prominently (e.g., #FF8000)
- RGB values (R: 255, G: 128, B: 0)
- Food-themed color name (e.g., "Tangerine Zest")

#### Color Recipe Card

- A text panel styled as a handwritten recipe card
- Dynamically updates to explain the current mix:
  - "Red and Green are dominant → Orange zone"
  - "Blue adds nothing → Pure saturated hue"
  - Or: "All three high → Approaching white (like adding cream)"
  - Or: "All three low → Very dark (barely cooked)"
- References the mental model: "The two largest values (R, G) determine the hue. The smallest value (B) determines lightness."

### Section 2: Palette Generator (Recipe Book Pages)

#### Harmony Types (each is a "recipe page" you can flip to)

1. **Complementary:** Base color + color 180° opposite on the wheel. Two swatches.
2. **Analogous:** Base color + 2-4 neighbors (±30° each). Five swatches.
3. **Triadic:** Three colors 120° apart. Three swatches.
4. **Split-Complementary:** Base + two colors adjacent to its complement (±30° from 180°). Three swatches.
5. **Tetradic (Rectangle):** Four colors forming a rectangle on the wheel (two complementary pairs). Four swatches.

#### Palette Display

- Each palette shown as a row of color swatches on a recipe card
- Each swatch shows:
  - The color fill
  - Hex code below (e.g., #3A7BDB)
  - Food-themed color name (e.g., "Blueberry Glaze")
  - Click-to-copy: clicking the hex code copies it to clipboard with a small "Copied!" toast (styled as a kitchen timer ding animation)
- Swatches animate in one-by-one when a palette is generated (staggered fade-in or flip-in, like cards being dealt)

#### Mini Color Wheel

- A small version of the petal wheel showing dots/markers where each palette color sits
- Lines or arcs drawn between the palette colors to show their geometric relationship (e.g., a triangle for triadic)

#### Sample Menu Preview

- A mock restaurant menu card rendered with the current palette applied:
  - Background color = one palette color
  - Heading text = another
  - Body text = another
  - Accent/highlight = another
  - Border or decorative element = another
- Updates live as the palette changes
- Demonstrates real-world application of the palette

#### Randomize Button

- A "Surprise Me!" button styled as a dice or a "spin the wheel" kitchen timer
- Generates a random base color and random harmony type
- Triggers a shuffling animation (colors rapidly cycling) before landing on the result

#### Color Naming System

Built-in lookup table or algorithm. Names are food-themed:
- Pure Red → "Chili Pepper"
- Light Pink → "Strawberry Cream"
- Dark Blue → "Midnight Espresso"
- Bright Yellow → "Lemon Zest"
- Teal → "Ocean Bisque"
- Orange → "Tangerine Marmalade"
- Etc. (50-100 named entries with interpolation for in-between colors)

### Section 3: Contrast Checker (Health Inspector's Clipboard)

Styled as a health inspection form on a clipboard.

#### Interface

- **Foreground color picker:** Select or enter any color (links to the petal wheel or manual hex input)
- **Background color picker:** Same
- **Live preview panel:** Shows sample text rendered in the foreground color on the background color
  - Sample includes: large heading text, normal body text, small fine print
- **Contrast ratio display:** Large number showing the ratio (e.g., "4.72:1")

#### WCAG Results

Displayed as pass/fail badges (styled as health inspection stamps):

| Standard | Threshold | Badge |
|----------|-----------|-------|
| AA Normal Text | 4.5:1 | ✅ PASS or ❌ FAIL |
| AA Large Text | 3:1 | ✅ PASS or ❌ FAIL |
| AAA Normal Text | 7:1 | ✅ PASS or ❌ FAIL |
| AAA Large Text | 4.5:1 | ✅ PASS or ❌ FAIL |

#### Technical Implementation

- Convert RGB to linear RGB: for each channel, if sRGB ≤ 0.03928 then linear = sRGB/12.92, else linear = ((sRGB + 0.055)/1.055)^2.4
- Relative luminance: L = 0.2126 * R_linear + 0.7152 * G_linear + 0.0722 * B_linear
- Contrast ratio: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color's luminance

#### Suggestions

- If contrast fails, display a suggestion: "Increase contrast by darkening the background or lightening the text"
- Optionally auto-suggest the nearest color that would pass the standard

### Section 4: Color Blindness Simulator (Customer Perspective)

Styled as a pair of special glasses you can "put on" to see the world differently.

#### CVD Types Supported

1. **Protanopia** (red-blind, ~1% of males)
2. **Deuteranopia** (green-blind, ~1% of males)
3. **Tritanopia** (blue-blind, ~0.003% of population)

#### Interface

- Toggle buttons for each CVD type + "Normal Vision" (default)
- When a CVD type is selected:
  - The petal color wheel re-renders through the CVD simulation matrix in real-time
  - Any selected colors show a side-by-side: "What you see" | "What they see"
  - All palette swatches in the palette generator also show their CVD-simulated versions

#### CVD Simulation Matrices

Use standard Brettel/Vienot color blindness simulation matrices applied to linearized RGB values.

**Protanopia matrix (approximate):**
```
[0.567, 0.433, 0.000]
[0.558, 0.442, 0.000]
[0.000, 0.242, 0.758]
```

**Deuteranopia matrix (approximate):**
```
[0.625, 0.375, 0.000]
[0.700, 0.300, 0.000]
[0.000, 0.300, 0.700]
```

**Tritanopia matrix (approximate):**
```
[0.950, 0.050, 0.000]
[0.000, 0.433, 0.567]
[0.000, 0.475, 0.525]
```

(Use the most accurate available source — Brettel 1997 or Machado 2009 matrices preferred.)

#### Educational Context

- Brief explanation for each CVD type: what it is, how common, what colors are affected
- "Approximately 8% of men and 0.5% of women have some form of color blindness"
- Practical tip: "Designs that work for color-blind users work better for everyone"

### Section 5: Accessible Palette Mode (Banquet Planner)

Styled as an event planning worksheet.

#### Interface

- **Background color picker** ("tablecloth color"): Select the background all palette colors will be tested against
- **Palette generator** (same as Section 2, but with accessibility enforcement)
- **Enforce accessibility toggle:** When ON, palette generation automatically ensures all colors pass WCAG AA contrast against the chosen background
- **Contrast matrix:** A grid showing the contrast ratio between every pair of colors in the palette AND against the background
  - Cells colored green (pass) or red (fail)
  - Hover a cell to see the exact ratio

#### Behavior When Enforced

- If a generated harmony color would fail contrast, it's automatically adjusted (lightened or darkened) to the nearest passing variant
- A note shows: "Adjusted from #XX to #YY to meet AA contrast"
- User can toggle enforcement off to see the "pure" harmony colors vs. the adjusted accessible versions

---

## Technical Architecture

### Technology Stack

- **Framework:** Single-page React application (JSX)
- **Rendering:** HTML5 Canvas for the game kitchen, pot animations, and particle effects. CSS for UI overlays, menus, recipe book.
- **Animation:** requestAnimationFrame game loop for the Cooking Competition. CSS transitions and keyframe animations for Recipe Learn UI.
- **State Management:** React useState/useReducer for game state (player position, pot contents, score, current level, customer state)
- **Color Math:** All done in JavaScript — RGB↔HSL conversion, Lab color space conversion, ΔE calculation, CVD matrix transformations, WCAG luminance/contrast
- **No external APIs required** — color naming uses a built-in lookup table
- **No backend** — fully client-side, deployable to GitHub Pages as static files

### Key Technical Components

#### Game Loop (Cooking Competition)
- 60fps requestAnimationFrame loop
- Handles: player movement, animation frames, particle systems, customer AI/timers, collision detection
- Game state updates per frame; React re-renders only for UI overlay changes (score, menus)

#### Particle System
- Lightweight particle emitter for: steam, bubbles, pour liquid, sparkles, celebration effects
- Each particle: position, velocity, color, opacity, lifetime
- Rendered on canvas overlay

#### Sprite System
- Character sprites: either hand-drawn pixel art (inline SVG or base64 encoded) or CSS-drawn characters
- Animation frames managed by a sprite sheet or array of SVG states
- Direction + action state machine per character

#### Color Utilities Module
```
rgbToHsl(r, g, b) → {h, s, l}
hslToRgb(h, s, l) → {r, g, b}
rgbToLab(r, g, b) → {L, a, b}
deltaE(color1, color2) → number
relativeLuminance(r, g, b) → number
contrastRatio(color1, color2) → number
simulateCVD(r, g, b, type) → {r, g, b}
getHarmony(baseColor, type) → color[]
getColorName(r, g, b) → string
```

### File Structure
```
index.html          — Entry point
/src
  App.jsx           — Root component, mode routing
  /game
    GameEngine.js   — Main game loop, canvas rendering
    Kitchen.js      — Kitchen layout, station positions, collision map
    Player.js       — Chef character: movement, state, sprites
    Customer.js     — NPC customer: AI, patience, reactions, sprites
    Pot.js          — Pot state, pour mechanics, animations
    Particles.js    — Particle system (steam, bubbles, sparkles)
    Scoring.js      — ΔE calculation, star rating, points
    Levels.js       — Level definitions, acts, progression
    AmbientNPCs.js  — Background characters (cat, sous chef, diners)
  /learn
    RecipeBook.jsx  — Cookbook container, opening animation, page navigation
    PetalWheel.jsx  — Petal color wheel (canvas-rendered)
    PaletteGen.jsx  — Palette generator with harmony calculations
    ContrastCheck.jsx — WCAG contrast checker
    CVDSimulator.jsx — Color blindness simulator
    AccessiblePalette.jsx — Accessible palette mode
  /shared
    ColorUtils.js   — All color math functions
    ColorNames.js   — Food-themed color name lookup table
    SpriteSheet.js  — Character sprite definitions
    Constants.js    — Game constants, thresholds, configs
  /assets
    (sprites, textures, fonts — inline or imported)
  styles.css        — Global styles, CSS variables, animations
```

### Performance Considerations

- Canvas rendering for game elements (high-frequency updates)
- React for UI overlays only (menus, recipe book, score displays)
- Particle count capped per emitter (max ~100 particles active)
- Color calculations cached where possible (palette harmonies recalculated only on base color change)
- Sprite animations use requestAnimationFrame, not setInterval
- Recipe Learn mode: petal wheel rendered once on canvas, updated only when sliders change

---

## Complete Feature Checklist

### From Assignment Requirements

| Requirement | Implementation | Mode |
|---|---|---|
| Animated Color Explorer | Bubbling pot with particles, steam, color transitions, pulse effect | Competition |
| RGB sliders/controls | Ingredient bottles + pour mechanic + precision stir slider | Competition |
| Smooth animated transitions | Liquid color morphing in pot (~300ms) | Competition |
| Pulse/breathing effect | Pot glow pulses continuously | Competition |
| Hex code + RGB display | Floating above pot like steam | Competition |
| Palette Generator (complementary) | Recipe Book — complementary page | Learn |
| Palette Generator (analogous) | Recipe Book — analogous page | Learn |
| Palette Generator (triadic) | Recipe Book — triadic page | Learn |
| Palette Generator (split-complementary) | Recipe Book — split-comp page | Learn |
| Palette Generator (tetradic) | Recipe Book — tetradic page | Learn |
| Click-to-copy hex codes | Click any swatch hex code → clipboard + toast | Learn |
| Sample UI preview of palette | Mock restaurant menu rendered with palette | Learn |
| Randomize button | "Surprise Me!" button with shuffle animation | Learn |
| Color naming | Food-themed names on all swatches | Both |
| Explorer → Palette integration | Mix in pot → auto-generates palette suggestions at recipe stand | Both |
| Animated swatch appearance | Palette swatches flip in one-by-one | Learn |
| Color wheel showing palette positions | Mini petal wheel with dots + geometry lines | Learn |
| Petal color wheel (from screenshot) | Full interactive petal wheel in Recipe Learn | Learn |
| Two-primary selection (constrained) | R/G/B selection, third locked to min of other two | Learn |
| Color recipe card (mental model) | Dynamic text explaining which primaries drive hue/lightness | Learn |
| Contrast Checker (WCAG) | Health inspector clipboard with AA/AAA badges | Learn + Act 4 |
| Color Blindness Simulator | CVD toggle with protanopia, deuteranopia, tritanopia | Learn + Act 4 |
| Accessible Palette Mode | Banquet planner with contrast matrix + enforcement | Learn + Act 4 |

### Game-Specific Features

| Feature | Details |
|---|---|
| Playable chef character | WASD movement, carry/pour/interact, expressions |
| Customer NPCs | Enter, order, wait, react, exit — 10-15 unique designs |
| Special customers | Color blind, health inspector, event planner |
| Background NPCs | Dining area patrons, sous chef, kitchen cat |
| 5-Act level progression | Tutorial → Precision → Palettes → Accessibility → Championship |
| Star scoring system | ΔE-based 0-3 stars, points, lives, progression |
| Patience timer | Customer patience drains, visible meter |
| Controls screen | Animated pre-game overlay with all controls explained |
| Pause menu | ESC to pause, resume, view controls, quit |
| Kitchen spatial gameplay | Physical movement between stations, collision, carrying items |
| Cookbook opening animation | 3D page-flip animation entering Recipe Learn mode |
| Pour mechanics | Hold to pour, stir to fine-tune, visual stream animation |
| Speed/memory/mystery rounds | Act 5 challenge variations |

---

## Visual Reference Summary

- **Kitchen:** Dark, moody, professional restaurant. RGB bottles as primary light sources.
- **Characters:** Chibi / pixel-art style, expressive, animated walk cycles.
- **Pot:** Center stage, constantly alive with bubbles, steam, glow, swirl.
- **Recipe Book:** Leather-bound, parchment pages, handwritten-style text, bookmark tabs.
- **Petal Wheel:** Faithful to the reference screenshot — 36 petals, white center, black background.
- **Palettes:** Recipe cards with swatches, hex codes, food names, geometry visualization.
- **Contrast Checker:** Clipboard / inspection form aesthetic.
- **CVD Simulator:** "Special glasses" metaphor, side-by-side comparison.
- **Typography:** Chalk-style for kitchen UI, monospace for hex codes, friendly rounded sans-serif for speech bubbles, handwritten serif for recipe book pages.
