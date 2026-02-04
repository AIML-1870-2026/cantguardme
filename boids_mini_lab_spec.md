# 🧪 Boids Interactive Mini‑Lab — Full Specification (v1.1)

This specification is designed to be **plug‑and‑play for AI code generation tools** (VS Code AI, Cursor, Copilot Chat).
All requirements are explicit, deterministic, and implementation‑ready.

---

## 0. Core Goal

Build a **high‑performance, visually expressive Boids simulation** that functions as an **interactive scientific mini‑lab**.

The system must:
- run smoothly at **60 FPS**
- expose flocking rules clearly
- visualize emergent *patterns and designs*
- remain lag‑free even at high boid counts
- support structured experimentation

---

## 1. Hard Performance Requirements (Non‑Negotiable)

### Frame Rate
- Target: **60 FPS**
- Minimum acceptable: **55 FPS**
- FPS must be shown on screen at all times

### Lag Prevention Rules
- Use `requestAnimationFrame`
- No blocking operations in render loop
- Physics update and rendering must be decoupled
- Neighbor search must be optimized via spatial partitioning (see §9)

### Scaling Target
- Stable performance at:
  - 300 boids (baseline)
  - 1,000 boids (with spatial grid enabled)

---

## 2. Rendering & Visual Design

### Canvas
- HTML Canvas (2D)
- Full‑screen or fixed large viewport
- DevicePixelRatio aware rendering

### Boid Appearance
- Shape: triangle or arrow (clearly shows heading)
- Size scales subtly with speed (optional but encouraged)

---

## 3. Emergent Visual Design System (NEW)

### Design‑Forming Modes
Add a **Design Mode selector** that influences initial conditions and visual interpretation,
NOT the core flocking rules.

Modes may include:
- **Rings / Mills** — circular flow patterns
- **Braids** — interwoven streams
- **Waves** — oscillatory alignment gradients
- **Vortices** — rotating sub‑groups
- **Fracture / Fusion** — groups splitting and rejoining

These emerge from:
- parameter presets
- initial velocity distributions
- subtle noise injection (bounded, deterministic)

⚠️ Do NOT hard‑code paths or patterns.

---

## 4. Color System (NEW)

### Color Modes (toggleable)

#### Mode A: Direction‑Based
- Hue maps to velocity angle

#### Mode B: Speed‑Based
- Color intensity maps to speed magnitude

#### Mode C: Density‑Based
- Boids in high‑density regions brighten or shift hue

#### Mode D: Group Emergence
- Temporary color similarity emerges from local alignment (no fixed IDs)

### Requirements
- Smooth color interpolation
- No per‑frame object allocations
- Colors must update without FPS drops

---

## 5. Simulation Model

Each boid has:
- position (x, y)
- velocity (vx, vy)
- acceleration (ax, ay)

### Core Forces
- Separation
- Alignment
- Cohesion

Forces are combined, weighted, and clamped.

---

## 6. Controls (UI) — REQUIRED

### Sliders / Inputs
Each control includes:
- Label
- Live numeric value
- Plain‑English tooltip

Required controls:
1. Separation weight
2. Alignment weight
3. Cohesion weight
4. Neighbor radius
5. Max speed

Tooltips must describe **behavioral outcome**, not math.

---

## 7. Presets — REQUIRED

### Preset Buttons
- Schooling
- Chaotic Swarm
- Tight Cluster

Clicking a preset:
- Updates all sliders
- Updates simulation instantly

Presets must be editable after selection.

---

## 8. Instrumentation — REQUIRED

Always‑visible metrics:
- FPS
- Boid count
- Average speed
- Average neighbor count

Optional derived metric:
- Flock compactness (average pairwise distance)

---

## 9. Simulation Controls — REQUIRED

### Buttons
- Pause / Resume
- Reset

Pause:
- Freezes motion
- UI remains active

Reset:
- Re‑seed boids using current parameters

---

## 10. Boundary Rules — REQUIRED

### Modes
- Wrap
- Bounce

### UI
- Visible boundary
- Toggle with tooltip explaining difference

---

## 11. Stretch Challenge #1 — Perception Cone

### Feature
Compare:
- Omnidirectional sensing
- Forward field‑of‑view sensing

### Controls
- Toggle: Omni / Cone
- Slider: FOV angle (degrees)

### Visualization
- Faint cone overlay for selected boid

---

## 12. Stretch Challenge #2 — Spatial Partitioning

### Modes
- Naive O(n²)
- Uniform grid (~O(n))

### Requirements
- Identical flock behavior in both modes
- FPS visibly improves when grid enabled
- Grid size adapts to neighbor radius

---

## 13. Stretch Challenge #3 — Interaction Toys

### Tools
- Mouse Attract
- Mouse Repel
- Click‑to‑Spawn Boids

### Behavior
- Distance‑based force falloff
- Visual feedback for interaction field

---

## 14. UX & Instruction Layer

Every control must include:
- Tooltip (1 sentence)
- Behavioral expectation

Group controls into:
- Flocking Rules
- Environment
- Visualization
- Performance / Advanced

---

## 15. Non‑Goals

- No backend
- No persistence
- No audio
- No machine learning
- No hard‑coded motion paths

---

## 16. Acceptance Checklist

- [ ] All required sliders exist
- [ ] Presets snap sliders
- [ ] FPS ≥ 55 under normal load
- [ ] Spatial grid improves FPS at scale
- [ ] Color modes do not cause lag
- [ ] Interaction toys are responsive
- [ ] Boundary toggle works instantly

---

## 17. Developer Notes (For AI Codegen)

- Use object pools where possible
- Avoid array reallocation inside loops
- Separate update() and draw()
- Clamp all forces and velocities
- Prefer math operations over conditionals in hot paths

---

## Deliverable

A **60 FPS, visually rich, insight‑driven Boids mini‑lab** that:
- forms beautiful emergent designs
- teaches complexity through interaction
- remains performant under stress
- feels deliberate, not gimmicky
