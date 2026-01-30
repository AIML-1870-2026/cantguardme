# Enhanced Snake Game - Complete Specification

## Overview
A modern, feature-rich Snake game with a progressive unlock system, tutorials, multiplayer modes, AI opponent, and level editor. The game starts simple and gradually introduces features as players level up.

---

## Core Philosophy
- **Start Simple**: New players see only basic Snake mechanics
- **Progressive Complexity**: Features unlock gradually through gameplay
- **Tutorial-Driven**: Each new feature comes with a clear, concise tutorial
- **Multiple Play Styles**: Solo, competitive, creative modes available from start

---

## Game Modes (All Available Immediately)

### 1. Classic Mode
Standard Snake gameplay with progressive feature unlocks.

### 2. Two-Player Mode
- Split keyboard controls (Player 1: Arrow keys, Player 2: WASD)
- Compete on same board
- First to 200 points wins or last one standing
- Can steal each other's food
- Collision with other player = death

### 3. AI Opponent Mode
- Three difficulty levels: Easy, Medium, Hard
- AI competes for food on same board
- First to 200 points wins
- Shows tutorial on first launch

### 4. Level Editor
- Click/drag to place walls
- Right-click to erase
- Test your level
- Save/load levels with shareable codes
- Shows tutorial on first launch

---

## Progression System

### Experience & Leveling
- **Earn XP**: Score ÷ 5 = XP gained per game
- **Earn Coins**: Score ÷ 10 = Coins gained per game
- **Level Up**: Unlock new features and cosmetics
- **Persistent Progress**: Saved in browser localStorage

### Level Requirements & Unlocks

**Level 1** (0 XP)
- Basic snake movement
- Red food (+10 points, +1 length)
- Wall collision = game over
- Self collision = game over
- **Tutorial**: Basic controls and rules

**Level 2** (100 XP)
- **Unlock**: Speed Boost Power-Up ⚡
- **Tutorial**: Collect yellow lightning for temporary speed (5 sec duration)

**Level 3** (250 XP)
- **Unlock**: Shield Power-Up 🛡️
- **Tutorial**: Protects from ONE collision

**Level 4** (450 XP)
- **Unlock**: Golden Apples 🌟
- **Tutorial**: Worth 3x points, disappears after 5 seconds

**Level 5** (700 XP)
- **Unlock**: Basic Obstacles 🧱
- **Tutorial**: Static walls appear on board, navigate around them
- Obstacle count increases with score

**Level 6** (1000 XP)
- **Unlock**: Score Multiplier Power-Up ✖️
- **Tutorial**: Double all points for 8 seconds

**Level 7** (1400 XP)
- **Unlock**: Combo System 🔥
- **Tutorial**: Eat same food type consecutively for multiplier (max 5x)
- Visual combo counter appears

**Level 8** (1900 XP)
- **Unlock**: Ghost Mode Power-Up 👻
- **Tutorial**: Pass through walls and self for 4 seconds

**Level 9** (2500 XP)
- **Unlock**: Magnet Power-Up 🧲
- **Tutorial**: Attracts nearby food for 6 seconds

**Level 10** (3200 XP)
- **Unlock**: Basic Portals 🌀
- **Tutorial**: Orange/blue portal pairs teleport you across the map
- 2 portal pairs appear on board

**Level 11** (4000 XP)
- **Unlock**: Dash Ability ⚡
- **Tutorial**: Press SPACE to dash 3 tiles forward (5 sec cooldown)

**Level 12** (4900 XP)
- **Unlock**: Poison Apples ☠️
- **Tutorial**: Purple apples shrink snake by 1 but award +50 points

**Level 13** (5900 XP)
- **Unlock**: Time Attack Mode ⏱️
- **Tutorial**: 60 seconds to maximize score

**Level 14** (7000 XP)
- **Unlock**: Moving Obstacles 🎯
- **Tutorial**: Some obstacles now patrol the board

**Level 15** (8500 XP)
- **Unlock**: Dimension Portals 🌌
- **Tutorial**: Purple portals transport to new dimensions
- **Unlock**: Crystal Cavern Dimension

**Level 16** (10200 XP)
- **Unlock**: Lava Core Dimension 🔥
- Hazard tiles that damage you

**Level 17** (12100 XP)
- **Unlock**: Survival Mode 💀
- **Tutorial**: Arena shrinks over time, survive as long as possible

**Level 18** (14200 XP)
- **Unlock**: Void Space Dimension 🌌
- Zero gravity, wrap-around edges

**Level 19** (16500 XP)
- **Unlock**: Snake Customization 🎨
- Choose snake color and pattern

**Level 20** (19000 XP)
- **Unlock**: Particle Trails ✨
- **Unlock**: All Dimensions
- **Unlock**: Prestige Option (reset for permanent bonuses)

---

## Food Types

### Normal Food (Red Apple)
- **Points**: 10
- **Growth**: +1 segment
- **Spawn Rate**: Common

### Golden Apple (Unlocks Level 4)
- **Points**: 30
- **Growth**: +1 segment
- **Duration**: 5 seconds before disappearing
- **Spawn Rate**: Rare (15% chance)
- **Visual**: Gold with sparkle effect

### Poison Apple (Unlocks Level 12)
- **Points**: 50
- **Growth**: -1 segment (shrinks snake)
- **Spawn Rate**: Uncommon (10% chance)
- **Visual**: Purple with skull icon
- **Requirement**: Snake must be at least 4 segments long

---

## Power-Ups

### Speed Boost ⚡ (Level 2)
- **Effect**: 2x movement speed
- **Duration**: 5 seconds
- **Visual**: Yellow lightning icon
- **Color**: #ffff00

### Shield 🛡️ (Level 3)
- **Effect**: Absorb one collision (wall or self)
- **Duration**: Until used
- **Visual**: Blue shield icon, glowing aura on snake
- **Color**: #00ccff

### Score Multiplier ✖️ (Level 6)
- **Effect**: 2x points for all food
- **Duration**: 8 seconds
- **Visual**: Orange multiplier icon
- **Color**: #ff8800
- **Stacks**: With combo system

### Ghost Mode 👻 (Level 8)
- **Effect**: Pass through walls and yourself
- **Duration**: 4 seconds
- **Visual**: Purple ghost icon, semi-transparent snake
- **Color**: #9b59b6

### Magnet 🧲 (Level 9)
- **Effect**: Food within 5 tiles moves toward you
- **Duration**: 6 seconds
- **Visual**: Red magnet icon
- **Color**: #ff6b6b

**Power-Up Spawn Rate**: 1-2% per frame, max 2 on board at once

---

## Portal System

### Basic Portals 🌀 (Level 10)
- **Type**: Paired teleportation
- **Colors**: Orange (entrance) and Blue (exit)
- **Behavior**: Maintains direction and momentum
- **Count**: 2 pairs on board
- **Visual**: Swirling vortex effect

### Dimension Portals 🌌 (Level 15)
- **Type**: Inter-dimensional travel
- **Color**: Purple with cosmic effect
- **Behavior**: Teleports to different dimension
- **Transition**: 1.5 second animation with dimension name
- **Count**: 1-2 per dimension

---

## Dimensions

### Classic Dimension (Default)
- **Theme**: Green snake, black background
- **Gravity**: Normal
- **Hazards**: None
- **Special**: Original Snake experience

### Crystal Cavern (Level 15)
- **Theme**: Ice blue, crystalline
- **Gravity**: Slippery (momentum continues slightly)
- **Hazards**: Ice patches
- **Visual**: Sparkling crystals, blue gradient background
- **Portal Color**: Light blue

### Lava Core (Level 16)
- **Theme**: Red/orange fire theme
- **Gravity**: Normal
- **Hazards**: Random lava tiles (3-5 on board)
- **Special**: Default speed boost (+20%)
- **Visual**: Flowing lava, orange glow
- **Portal Color**: Orange-red

### Void Space (Level 18)
- **Theme**: Dark space, stars
- **Gravity**: Zero gravity (wrap all edges)
- **Hazards**: Drifting asteroids (2-3)
- **Visual**: Starfield background, floating debris
- **Portal Color**: Deep purple

---

## Combo System (Level 7)

### Mechanics
- Eat same food type consecutively
- Each consecutive match increases multiplier
- Breaking streak resets to 1x
- Visual indicator shows current combo

### Multipliers
- 1 match: 1x (base)
- 2 matches: 2x
- 3 matches: 3x
- 4 matches: 4x
- 5+ matches: 5x (max)

### Combo Breaks On
- Eating different food type
- Collecting power-up
- Taking damage
- Using dimension portal

### Visual Feedback
- Combo counter in UI
- Large combo text on screen for 3x+
- Particle effects increase with combo

---

## Dash Ability (Level 11)

### Mechanics
- **Activation**: SPACE key or mobile dash button
- **Effect**: Instantly move 3 tiles in current direction
- **Cooldown**: 5 seconds
- **Visual**: Yellow trail particles
- **Uses**: Escape tight spots, reach food quickly

### Edge Behavior
- Wraps around edges instead of collision
- Cannot dash through obstacles (unless ghost mode active)
- Can dash through portals

---

## Game Modes (Unlockable)

### Time Attack (Level 13)
- **Duration**: 60 seconds
- **Goal**: Maximize score
- **Changes**: Food spawns 2x faster
- **UI**: Large countdown timer
- **End**: Shows final score and rank

### Survival Mode (Level 17)
- **Mechanic**: Arena shrinks every 10 seconds
- **Start**: Full 30x30 grid
- **Shrink Rate**: 1 row/column per side every 10 seconds
- **Goal**: Survive as long as possible
- **End**: When board becomes 10x10 or death

---

## Tutorial System

### Tutorial Display
- **Trigger**: First encounter with feature
- **Format**: Full-screen overlay with dark backdrop
- **Components**:
  - Large emoji icon
  - Feature name
  - 2-3 sentence description
  - Controls/usage info (if applicable)
  - "Got it!" button
  - "Skip all tutorials" checkbox

### Tutorial Timing
- **Immediate Features**: Show on menu selection (2-Player, AI, Editor)
- **Unlockable Features**: Show when unlocked via level-up
- **Power-Ups**: Pause game on first collection, show tutorial
- **Replay Option**: All tutorials accessible from help menu

### Example Tutorial Flow

**Welcome Tutorial (First Launch)**
```
👋 WELCOME TO SNAKE ULTIMATE!

Use arrow keys or WASD to control your snake.
Eat red apples to grow and score points.
Avoid walls and your own body!

[Got it!] [Skip All Tutorials]
```

**Speed Boost Tutorial (Level 2 Unlock)**
```
⚡ SPEED BOOST UNLOCKED!

Collect the yellow lightning icon for a temporary speed boost!
Move faster to reach food quickly, but be careful—
higher speed means less reaction time.

Duration: 5 seconds

[Got it!] [Skip All Tutorials]
```

**Portal Tutorial (Level 10 Unlock)**
```
🌀 PORTALS UNLOCKED!

Paired portals teleport you across the map!
Enter an orange portal, exit from the blue one.
Your direction is maintained through portals.

Look for swirling vortex effects!

[Got it!] [Skip All Tutorials]
```

---

## UI Layout

### Main Menu
- Game title with animated gradient
- Player stats (Level, XP bar, Coins)
- Play buttons:
  - Classic Mode
  - Two-Player Mode
  - AI Opponent
  - Level Editor
- Unlockable modes section (locked until achieved)
- Settings button
- Stats & Achievements button

### Game Screen Layout

**Left Panel - Game Canvas**
- Dimension name (top)
- 600x600px canvas (30x30 grid, 20px cells)
- Particle overlay canvas
- Mobile controls (bottom, if mobile)

**Center Panel - Game Info**
- Score (large)
- High Score
- Snake Length
- Current Speed
- Combo Counter (when active)
- Active Power-Ups list with timers
- Pause button
- Quit button

**Right Panel - Progress**
- Next unlock preview
- Recent achievements (scrollable)
- Session stats:
  - Games played
  - Food eaten
  - Best score this session

### Overlay Screens
- Tutorial Modal
- Pause Menu
- Game Over Screen
- Level Up Screen
- Portal Transition
- Notification Toasts

---

## Visual Design

### Color Scheme
- **Primary**: #00ff88 (Neon green)
- **Secondary**: #00ccff (Cyan blue)
- **Background**: Linear gradient #1e3c72 to #2a5298
- **Danger**: #ff4444 (Red)
- **Warning**: #ff8800 (Orange)
- **Success**: #00ff88 (Green)

### Snake Appearance
- **Color**: Adjusts per dimension theme
- **Head**: Slightly larger, rounded
- **Body**: Gradient fade from head to tail (30% opacity decrease)
- **Glow**: When shield active (cyan glow)
- **Transparency**: When ghost mode active (50% opacity)

### Grid
- **Background**: Black (#000)
- **Grid Lines**: Dark gray (#111)
- **Border**: 3px solid neon green (#00ff88)
- **Glow**: Subtle box-shadow on border

### Particles
- **Food Collection**: 10 particles, matches food color
- **Power-Up Collection**: 15 particles, cyan
- **Combo Hits**: 20 particles, gold
- **Dash**: 20 yellow trail particles
- **Physics**: Gravity + velocity, fade out over 1 second

---

## Controls

### Keyboard (Player 1)
- **Arrow Keys**: Up, Down, Left, Right
- **WASD**: Alternative movement
- **SPACE**: Dash (when unlocked)
- **P or ESC**: Pause

### Keyboard (Player 2 - Two-Player Mode)
- **IJKL**: Up, Left, Down, Right

### Mobile/Touch
- **Swipe Gestures**: Swipe in direction to move
- **Virtual D-Pad**: On-screen buttons
- **Dash Button**: Tap ⚡ button

### Mouse (Level Editor Only)
- **Left Click + Drag**: Place walls
- **Right Click**: Erase walls

---

## Level Editor Specification

### Editor Interface
- Full-screen mode
- Control bar at top with buttons
- 30x30 grid canvas below
- Same visual style as game

### Tools
1. **Place Wall**: Click/drag to add walls
2. **Erase**: Right-click or erase mode to remove
3. **Clear All**: Reset entire level
4. **Test**: Play your level in classic mode
5. **Save**: Generate shareable code
6. **Load**: Import level from code

### Save/Load System
- **Format**: Base64 encoded JSON
- **Data**: Array of {x, y} wall positions
- **Code Length**: ~100-500 characters
- **Share**: Copy/paste code to share levels

---

## Two-Player Mode Specification

### Setup
- Same board, two snakes
- Player 1: Starts left side, green
- Player 2: Starts right side, magenta
- Both start at length 3

### Win Conditions
1. **Score Target**: First to 200 points
2. **Elimination**: Opponent dies, you survive

---

## AI Opponent Specification

### Difficulty Levels

**Easy**
- Slow reaction time
- Direct pathfinding only
- Doesn't avoid obstacles well

**Medium**
- Normal reaction time
- Smart pathfinding with basic obstacle avoidance
- Competes actively for food

**Hard**
- Fast reaction time
- Advanced pathfinding
- Aggressive food competition
- Near-perfect obstacle navigation

---

## Save System

### Data Stored (localStorage)
```javascript
{
  playerLevel: number,
  xp: number,
  coins: number,
  highScore: number,
  unlockedFeatures: string[],
  tutorialsShown: string[],
  skipTutorials: boolean
}
```

---

## Implementation Priorities

### Phase 1: Core Game (Essential)
1. Basic snake movement and controls
2. Food spawning and collection
3. Collision detection (walls, self)
4. Score system
5. Game over handling
6. Main menu and game screen
7. Basic UI (score, length display)

### Phase 2: Progression & Tutorials (High Priority)
1. XP and level system
2. Tutorial overlay system
3. Progressive unlocks (Levels 1-10)
4. Power-ups (Speed, Shield, Multiplier)
5. Golden apples
6. Notification toasts
7. Save/load system

### Phase 3: Core Features (High Priority)
1. Obstacles
2. Combo system
3. Particle effects
4. Basic portals
5. Ghost mode and Magnet
6. Dash ability
7. Poison apples

### Phase 4: Multiplayer & Modes (Medium Priority)
1. Two-player mode
2. AI opponent (3 difficulties)
3. Level editor
4. Time Attack mode
5. Survival mode

### Phase 5: Advanced Features (Medium Priority)
1. Dimension portals
2. Multiple dimensions (3-4)
3. Portal transitions
4. Progressive unlocks (Levels 11-20)

---

## Estimated Scope

### Lines of Code
- **HTML**: ~500 lines
- **CSS**: ~800 lines
- **JavaScript**: ~2500 lines
- **Total**: ~3800 lines in single file

---

This specification defines a complete, progressively complex Snake game that balances depth with approachability, ensuring players are never overwhelmed but always have something new to discover.
