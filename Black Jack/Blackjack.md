# Rise — Blackjack Game Specification

## Overview

**Rise** is a single-player Blackjack game built as a single HTML file. It combines correct Blackjack mechanics with a narrative story-mode progression, a physics-driven "living table," and procedurally generated audio that evolves with the player's journey. The player starts in a seedy underground backroom and rises through increasingly prestigious venues as their bankroll grows — or falls back down when fortune turns.

---

## Game Name & Title Screen

- **Title:** RISE
- **Title screen:** Bold, sharp typeface displaying "RISE" with a single card or chip silhouette
- **Start button:** Labeled "Sit Down" (not "Play" or "Start")
- **Audio starts immediately** on game load (browser permitting — use a click-to-start if autoplay is blocked)
- **Volume/mute toggle** always visible in the top corner of the screen

---

## Visual Design Philosophy

The aesthetic is **atmospheric and immersive** — not a flat card game UI, but a world you inhabit. Every visual element reflects the player's current level. The game should feel like it was designed by a luxury brand, not a template.

### Typography
- Title/headers: A distinctive display font — bold, high-contrast, cinematic feel (e.g., a condensed serif or sharp geometric sans)
- Body/UI text: Clean, refined secondary font for readability
- Avoid generic fonts (Inter, Roboto, Arial). Choose something with character.

### Color System
Each level has its own palette (detailed below in Level Design). Use CSS variables for easy theming:
```css
--felt-color
--accent-color
--text-color
--chip-primary
--chip-secondary
--ambient-glow
--card-back-color
```

---

## Level Design (Narrative Progression)

Levels are determined **entirely by bankroll**. Crossing a threshold up triggers a rise. Dropping below triggers a fall. Transitions are never silent — they are narrative moments.

### Level 1: The Backroom
- **Bankroll range:** $100 (starting) – $499
- **Minimum bet:** $5
- **Maximum bet:** $50
- **Visual:**
  - Scratched, worn wooden table surface
  - Dim, flickering overhead light (subtle CSS animation — slight opacity/color oscillation)
  - Dark, cramped atmosphere
  - Muted, desaturated color palette (browns, dark grays, sickly yellow light)
  - Card backs: worn, rough-edged design
  - Chips: plain, flat clay look
- **Audio (Web Audio API):**
  - Background: low basement hum, muffled distant sound, occasional pipe drip, faint creak
  - Cards: rough slap on wood
  - Chips: dull clay clack
  - Win: muffled grunt/approval sound
  - Lose: silence — just the ambient hum

### Level 2: The Downtown Floor
- **Bankroll range:** $500 – $1,999
- **Minimum bet:** $25
- **Maximum bet:** $200
- **Visual:**
  - Classic green felt table
  - Steady, even lighting — clean and bright
  - Standard casino atmosphere
  - Color palette: greens, whites, warm neutrals
  - Card backs: clean, standard casino design
  - Chips: colored ceramic with denomination markings
- **Audio (Web Audio API):**
  - Background: casino buzz — crowd murmur, distant slot machine chimes, ambient energy
  - Cards: clean snap on felt
  - Chips: crisp ceramic click
  - Win: bright chime, light crowd reaction
  - Lose: subtle low tone

### Level 3: The High Roller Suite
- **Bankroll range:** $2,000 – $9,999
- **Minimum bet:** $100
- **Maximum bet:** $1,000
- **Visual:**
  - Dark navy/charcoal premium felt
  - Warm, focused accent lighting — pools of light on the table, dimmer surrounds
  - Gold accents and trim
  - Color palette: navy, charcoal, gold, warm amber
  - Card backs: elegant, gold-foil-style design
  - Chips: heavy, gold-rimmed
  - Subtle ambient glow behind active cards
- **Audio (Web Audio API):**
  - Background: smooth jazz — warm, low, sophisticated (synthesized with oscillators + filters)
  - Table: soft, precise glide sound
  - Chips: heavy, satisfying thud
  - Win: elegant tone, crystal glass clink
  - Lose: tasteful minor chord

### Level 4: The Penthouse
- **Bankroll range:** $10,000+
- **Minimum bet:** $500
- **Maximum bet:** $5,000
- **Visual:**
  - Black felt with subtle shimmer/sheen effect
  - Near-dark ambient lighting with dramatic focused light on table
  - Platinum/silver accents
  - Color palette: black, platinum, deep midnight blue, white highlights
  - Card backs: minimalist, premium — dark with subtle metallic pattern
  - Chips: platinum/metallic finish
  - Subtle particle effects floating in the background
  - Particle burst on blackjack
- **Audio (Web Audio API):**
  - Background: near silence with deep ambient drone, faint orchestral hum, sense of altitude/isolation
  - Table: barely audible soft noise (whisper)
  - Chips: deep resonant ping (sine wave with long decay, low frequency)
  - Win: cinematic swell — sine wave with slow attack, rising pitch, harmonic layers, then fade
  - Lose: near-silence — single very quiet tone that fades quickly

### Level Transitions

**Rising transition:**
- Screen fades or wipes
- Text crawl appears with narrative (white text on black, cinematic style)
- Ascending audio tone/swell
- Environment transforms to new level

**Falling transition:**
- Screen fades darker
- Text crawl with demotion narrative
- Descending audio tone
- Environment degrades to lower level

**Sample narratives:**

*Backroom → Downtown:*
> "You push back from the table, pockets heavier than when you sat down. A man in a suit catches your eye from across the room and nods toward a door you hadn't noticed before..."

*Downtown → High Roller:*
> "The floor manager appears at your elbow. 'We have a private room upstairs,' she says. 'Complimentary, of course.' The elevator doors open without a sound."

*High Roller → Penthouse:*
> "A black card slides across the felt. No name. Just a floor number. The dealer doesn't look up — they already know you won't be coming back down here."

*Falling (any level):*
> "The pit boss taps your shoulder. Your credit's no good here anymore."

*Falling to Backroom:*
> "The chips are gone before you feel them leave. Security doesn't say a word — they don't have to. The elevator only goes down."

---

## Living Table — Animation & Physics System

The table is alive. Cards move, chips have weight, and the quality of animation reflects the current level.

### Card Animations

| Action | Backroom | Downtown | High Roller | Penthouse |
|---|---|---|---|---|
| Deal from shoe | Tossed with wobble/rotation | Clean slide | Smooth glide with drop shadow | Float into position with soft glow |
| Card flip (hole card reveal) | Quick rough snap | Smooth 2D rotation | 3D perspective flip | 3D flip with light reflection/shine |
| Hit (new card) | Slapped onto table | Slid into position | Glides in with easing | Drifts in, almost weightless |

- Cards visually originate from a **shoe** on the right side of the screen
- Cards land with slight rotation variation (not perfectly aligned — feels organic)
- Dealer's hole card sits face-down with a visible shadow until revealed
- On reveal: 3D Y-axis rotation flip animation

### Chip Animations

| Action | Backroom | Downtown | High Roller | Penthouse |
|---|---|---|---|---|
| Place bet | Chips slide flat onto table | Stack with a click | Physics stack with slight bounce | Magnetic drift into perfect stack |
| Win payout | Chips pushed across roughly | Slid toward player | Smooth sweep with stacking | Celebratory scatter then magnetic collect |
| Lose | Dragged away unceremoniously | Swept to dealer | Collected with precision | Dissolve/fade with particle effect |
| Push (tie) | Chips nudged back | Slid back | Gently returned | Float back to player |

### Betting Interface (Chip-Based)

- **No text input for bets.** Players interact with chips directly.
- Chip denominations displayed at bottom of screen (values scale with level)
- **Click a chip** → it animates onto the betting circle and stacks
- **Click the bet stack** → removes the top chip (undo)
- Chips physically stack in the betting circle with slight offset for realism
- Current bet total displayed clearly near the stack
- "Clear Bet" button available to reset

**Chip denominations per level:**
- Backroom: $5, $10, $25
- Downtown: $25, $50, $100
- High Roller: $100, $250, $500
- Penthouse: $500, $1,000, $2,500

---

## Card Rendering — Inline SVGs

All cards rendered as **inline SVGs** embedded in the HTML file. No external image files.

### Requirements:
- Full 52-card deck × 6 (6-deck shoe) — but only 52 unique SVG templates needed
- Each card face shows: rank (top-left, bottom-right), suit symbol, and center pip layout matching real playing cards
- Suits: ♠ ♣ in black/dark, ♥ ♦ in red
- Face cards (J, Q, K): stylized but clean illustrations or geometric representations
- **Card back design changes per level** (4 unique back designs)
- Cards should be crisp at any viewport size
- Card dimensions: standard poker ratio (~2.5:3.5)

---

## 6-Deck Shoe & Shuffle Mechanics

### Implementation:
- **6 standard 52-card decks** combined into a single shoe (312 cards total)
- Shoe is **shuffled using Fisher-Yates algorithm** at the start and when the cut card is reached
- **Cut card** placed at approximately 75% depth (after ~234 cards)
- When the cut card is reached during play, finish the current hand, then reshuffle and display a brief "Shuffling..." animation
- Shuffle animation: cards visually ripple/cascade in the shoe area

### Fairness:
- Use `Math.random()` or `crypto.getRandomValues()` for randomness
- Deck must be verifiably complete (all 312 cards present before shuffle)
- No card should appear more times than it exists in the shoe (6 copies per card)

---

## Blackjack Rules — Complete Specification

### Core Rules:
1. **Objective:** Get a hand value closer to 21 than the dealer without exceeding 21
2. **Card values:**
   - Number cards (2–10): face value
   - Face cards (J, Q, K): 10
   - Ace: 11 if it won't cause a bust, otherwise 1
3. **Initial deal:** Player gets 2 cards face-up, dealer gets 1 face-up and 1 face-down (hole card)
4. **Dealer rules:** Dealer must hit on 16 or below, stand on 17 or above (dealer stands on soft 17)

### Player Actions:

**Hit**
- Player receives one additional card
- Available whenever player's hand is below 21 and the round is active
- If hand exceeds 21 → bust → player loses immediately

**Stand**
- Player keeps current hand
- Dealer reveals hole card and plays according to dealer rules

**Double Down**
- Available only on the player's first two cards
- Player's bet is doubled
- Player receives exactly one more card, then automatically stands
- Only available if player has sufficient bankroll to double
- Available on any two-card hand (not restricted to specific totals)
- Available on each hand after a split

**Split**
- Available when player's first two cards have the **same value** (e.g., two 8s, or a K and a 10)
- Player's original bet is matched on the second hand (requires sufficient bankroll)
- Each hand is played independently — hit, stand, or double on each
- **Re-splitting:** allowed up to 3 times (maximum 4 hands total)
- **Split Aces special rule:** each Ace hand receives exactly one card, no further hits allowed
- A 21 achieved after splitting is **not** a natural blackjack (pays 1:1, not 3:2)
- UI must clearly separate and label split hands, indicating which is active

**Insurance**
- Offered when dealer's face-up card is an Ace
- Insurance bet is up to half the original bet
- If dealer has blackjack → insurance pays 2:1
- If dealer does not have blackjack → insurance bet is lost, hand continues normally
- Insurance prompt appears before any player actions
- Clear UI indication of insurance option with accept/decline buttons

### Payouts:
| Outcome | Payout |
|---|---|
| Player wins (normal) | 1:1 (bet returned + equal winnings) |
| Player blackjack (natural 21 on first 2 cards) | 3:2 (bet returned + 1.5× winnings) |
| Push (tie) | Bet returned, no winnings |
| Player busts | Bet lost |
| Dealer busts | Player wins 1:1 |
| Insurance (dealer has blackjack) | 2:1 on insurance bet |
| Both player and dealer have blackjack | Push (bet returned) |

### Edge Cases — Must Handle:
1. **Natural blackjack vs. dealer blackjack** → Push
2. **Player blackjack vs. dealer non-blackjack** → 3:2 payout
3. **Dealer blackjack vs. player non-blackjack** → Player loses
4. **All Ace+10 combinations** are natural blackjack: [A♠,K♠], [A♥,10♦], [A♣,J♠], [A♦,Q♥], etc.
5. **Ace revaluation:** If a hand has A(11)+5 = 16, then draws a 9, Ace becomes 1 → total = 15 (not bust)
6. **Multiple Aces:** A+A = 12 (one counts as 11, one as 1). A+A+9 = 21.
7. **Push on any equal score** (not just 21) → bet returned
8. **Player cannot modify bet** after cards are dealt (soundness requirement)
9. **Bust on split hand** → that hand loses, other hand(s) continue
10. **Bankroll reaches $0** → Game over screen with option to "Start Over" (reset to $100, Backroom)

---

## Game States & UI Flow

### State Machine:
```
TITLE_SCREEN → BETTING → INSURANCE_PROMPT (conditional) → PLAYING → DEALER_TURN → ROUND_COMPLETE → BETTING
                                                              ↓
                                                        SPLIT_PLAYING (if split)
                                                              ↓
                                                        DEALER_TURN → ROUND_COMPLETE
```

### State: TITLE_SCREEN
- Display "RISE" title
- "Sit Down" button
- Background audio begins on interaction
- Brief atmospheric intro

### State: BETTING
- Chip selection active
- Betting circle accepts chips
- "Deal" button visible but disabled until bet > $0
- Hit/Stand/Double/Split buttons hidden or fully disabled (grayed out)
- Current bankroll prominently displayed
- Current level name and minimum bet shown
- Keyboard: D = Deal (when bet placed)

### State: INSURANCE_PROMPT
- Only entered if dealer's up card is an Ace
- Overlay or inline prompt: "Insurance? (up to $X)"
- Accept/Decline buttons
- Chip selection for insurance amount
- All other actions disabled

### State: PLAYING
- Hit and Stand buttons active and prominent
- Double Down button active only if first two cards and sufficient bankroll
- Split button active only if first two cards are same value and sufficient bankroll
- Bet is locked — chip area disabled, no modifications allowed
- Current hand value displayed near player's cards
- Keyboard: H = Hit, S = Stand, D = Double Down

### State: SPLIT_PLAYING
- Active hand clearly highlighted/indicated
- Inactive hand(s) dimmed or visually secondary
- Each hand shows its own value
- Actions apply to active hand only
- After all split hands are played → DEALER_TURN

### State: DEALER_TURN
- All player buttons disabled
- Dealer's hole card flips with animation
- Dealer draws cards according to rules (hit ≤16, stand ≥17)
- Each dealer card drawn with timed animation delay (not instant)

### State: ROUND_COMPLETE
- Clear result message: "You Win!", "Dealer Wins", "Push", "Blackjack!", "Bust!"
- Payout animation (chips moving)
- Updated bankroll displayed with change highlighted (+$50 in green, -$25 in red)
- **Level transition triggers here** if bankroll crossed a threshold
- "New Hand" button prominently displayed (or auto-transition to BETTING after a delay)
- Keyboard: D = Deal next hand

### Button State Rules (Critical UX):
| Button | BETTING | PLAYING | SPLIT | DEALER_TURN | ROUND_COMPLETE |
|---|---|---|---|---|---|
| Deal | Enabled (if bet > 0) | Hidden | Hidden | Hidden | Enabled ("New Hand") |
| Hit | Hidden | Enabled | Enabled (active hand) | Disabled | Hidden |
| Stand | Hidden | Enabled | Enabled (active hand) | Disabled | Hidden |
| Double | Hidden | Conditional | Conditional | Disabled | Hidden |
| Split | Hidden | Conditional | Hidden | Disabled | Hidden |
| Chip area | Enabled | Disabled | Disabled | Disabled | Disabled |

---

## Layout & Responsive Design

### Desktop Layout (primary):
```
┌──────────────────────────────────────────────┐
│ [RISE logo]          Bankroll: $1,250  [🔊]  │
│                    Level: Downtown Floor      │
│                                               │
│                 DEALER AREA                    │
│              [card] [card-back]               │
│              Dealer: 10                       │
│                                               │
│              ─── Result Area ───              │
│                                               │
│                 PLAYER AREA                    │
│              [card] [card] [card]             │
│              Player: 18                       │
│                                               │
│         [Hit] [Stand] [Double] [Split]        │
│                                               │
│              ◉ Betting Circle ◉               │
│              Current Bet: $50                 │
│                                               │
│         [$5] [$10] [$25]  [Clear] [Deal]     │
│                                               │
│  Stats: W:12 L:8 | Streak: 3W | Shoe: 68%   │
└──────────────────────────────────────────────┘
```

### Mobile Responsive:
- Stack layout vertically
- Chips become smaller but remain tappable (minimum 44px touch targets)
- Action buttons become full-width
- Card sizes scale down proportionally
- Shoe indicator moves to top bar

### Shoe Indicator:
- Visual bar or arc showing remaining cards in shoe
- Percentage or card count displayed
- Refill animation when reshuffled

---

## Audio System — Web Audio API

All audio is **generated programmatically** using the Web Audio API. No external audio files.

### Architecture:
- `AudioContext` created on first user interaction
- Oscillators + filters for tonal sounds (chimes, jazz, drones)
- Noise generators (white/pink/brown noise) for ambient textures (hum, crowd, drip)
- Gain nodes for volume control per layer
- Master volume controlled by UI toggle

### Audio Layers:
1. **Ambient background** — continuous loop, crossfades on level change
2. **Table sounds** — triggered by game actions (deal, flip, chip place)
3. **Feedback sounds** — win/lose/push result tones
4. **Transition sounds** — ascending/descending tones on level change

### Level Audio Specifications:

**Backroom:**
- Ambient: Brown noise (low hum) + slow LFO on gain (throb) + random high-frequency plinks (drips) at irregular intervals + low creak (filtered noise bursts)
- Table: Short noise burst with low-pass filter (slap on wood)
- Chips: Brief mid-frequency click, dry
- Win: Low-pitched short tone
- Lose: Silence (just ambient)

**Downtown:**
- Ambient: Pink noise (crowd murmur) + high-frequency filtered chimes at random intervals (slot machines) + subtle low-end warmth
- Table: Short filtered click (snap on felt)
- Chips: Higher-pitched ceramic click (short sine wave burst)
- Win: Major chord arpeggio (quick, bright)
- Lose: Single low note, short decay

**High Roller:**
- Ambient: Smooth oscillator-based jazz simulation — sine wave melody fragments + triangle wave bass + subtle swing rhythm via gain modulation
- Table: Very short, soft noise burst with band-pass filter (felt glide)
- Chips: Low-frequency thud (short sine wave, fast decay)
- Win: Crystal tone — high sine + harmonics, gentle reverb (via delay nodes)
- Lose: Minor third interval, soft

**Penthouse:**
- Ambient: Deep drone — very low sine wave + subtle detuned second oscillator for beating effect + faint high harmonic shimmer
- Table: Barely audible soft noise (whisper)
- Chips: Deep resonant ping (sine wave with long decay, low frequency)
- Win: Cinematic swell — sine wave with slow attack, rising pitch, harmonic layers, then fade
- Lose: Near-silence — single very quiet tone that fades quickly

### Transition Sounds:
- **Rising:** Ascending arpeggio — series of sine tones stepping up in pitch over 1-2 seconds
- **Falling:** Descending arpeggio — tones stepping down, slightly longer decay, more somber timbre

---

## Statistics & Tracking

### Displayed Stats (always visible, bottom of screen or collapsible panel):
- Hands won / hands lost / hands pushed
- Win percentage
- Current streak (e.g., "3W" or "2L")
- Biggest single win
- Current bankroll
- Peak bankroll (all-time high)
- Shoe remaining (percentage or card count)

### Internal Tracking (for narrative triggers):
- Total hands played
- Times reached each level
- Times demoted
- Largest bankroll achieved

---

## Keyboard Shortcuts

| Key | Action | When Available |
|---|---|---|
| H | Hit | PLAYING state |
| S | Stand | PLAYING state |
| D | Double Down / Deal | PLAYING (double) or BETTING (deal) |
| 1-3 | Select chip denomination (left to right) | BETTING state |
| C | Clear bet | BETTING state |
| M | Toggle mute | Always |
| Escape | Decline insurance | INSURANCE_PROMPT |
| Enter | Accept/Confirm | Various prompts |

---

## Testing & Validation Scenarios

### Required Tests (from assignment):
1. ✅ Player blackjack (no dealer blackjack) → payout is exactly 1.5× the bet
2. ✅ Both player and dealer blackjack → push (bet returned, no winnings)

### Additional Test Cases:

**Blackjack combinations (all must work):**
- [A♠, K♠] = 21 (blackjack)
- [A♥, Q♦] = 21 (blackjack)
- [A♣, J♣] = 21 (blackjack)
- [A♦, 10♠] = 21 (blackjack)
- [K♠, Q♥] = 20 (NOT blackjack)
- [A♠, 5♣, 5♦] = 21 (NOT natural blackjack — 3 cards)

**Ace handling:**
- [A, 6] = 17 (soft 17)
- [A, 6, 8] = 15 (Ace flips to 1: 1+6+8=15)
- [A, A] = 12 (one 11, one 1)
- [A, A, 9] = 21
- [A, 5, A] = 17 (first A=11, second A=1)

**Bust scenarios:**
- [10, 6, 8] = 24 → bust
- [A, 5, 10, 8] = 24 → bust (A was 11 → became 1, still busts: 1+5+10+8=24)

**Push scenarios:**
- Player 20 vs. Dealer 20 → push
- Player 18 vs. Dealer 18 → push
- Player blackjack vs. Dealer blackjack → push

**Split scenarios:**
- [8, 8] → split, play each hand independently
- [A, A] → split, each receives one card only
- [10, K] → split allowed (same value)
- 21 after split → pays 1:1, NOT 3:2

**Double down:**
- Player doubles on [5, 6] with $50 bet → bet becomes $100, receives one card, stands automatically
- Cannot double after hitting

**Insurance:**
- Dealer shows A → insurance offered
- Dealer has blackjack → insurance pays 2:1
- Dealer doesn't have blackjack → insurance lost, hand continues

**Soundness:**
- Bet cannot be changed after deal
- Cannot hit after standing
- Cannot split after hitting
- Bankroll cannot go negative
- Buttons disabled when actions are unavailable

**6-deck shoe:**
- Verify 312 cards in shoe after shuffle
- No card appears more than 6 times
- Reshuffle triggers at ~75% depletion
- Shoe indicator accurately reflects remaining cards

**Level transitions:**
- Bankroll hits $500 → transition to Downtown
- Bankroll drops from $600 to $400 → transition back to Backroom
- Bankroll hits $0 → game over screen, restart option

**Edge cases:**
- Player tries to bet more than bankroll → prevented
- Player tries to bet below minimum → prevented
- Player tries to split/double without sufficient funds → button disabled
- Rapid clicking doesn't break game state
- Window resize doesn't break layout

---

## Game Over

When bankroll reaches $0:
- Dramatic fade to black
- Text: "The table is empty. The house always wins... unless you try again."
- "Start Over" button → resets to $100, Backroom, fresh statistics
- Maintain a "Best Run" record showing peak bankroll from previous attempts

---

## Technical Constraints

- **Single HTML file** — all CSS, JavaScript, and SVGs inline
- **No external dependencies** — no CDNs, no image files, no audio files
- **Web Audio API** for all sound generation
- **Inline SVGs** for all card rendering
- **CSS custom properties** for level theming
- **requestAnimationFrame** for smooth animations
- **Mobile responsive** — works on phones and tablets
- **Modern browsers** — Chrome, Firefox, Safari, Edge (latest versions)

---

## Implementation Priority Order

1. Core game engine (deck, shuffle, hand evaluation, dealer logic)
2. Basic UI layout with game state management
3. Card SVG rendering (all 52 cards + 4 back designs)
4. Betting system with chip interaction
5. Full rule implementation (split, double, insurance)
6. Animation system (card deal, flip, chip movement)
7. Level system with visual theming
8. Audio system (ambient + sound effects)
9. Narrative text crawls and transitions
10. Statistics tracking
11. Keyboard shortcuts
12. Responsive design polish
13. Edge case testing and hardening
