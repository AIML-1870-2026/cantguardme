# Turing Patterns Explorer — Full Product Specification

## Overview

The **Turing Patterns Explorer** is a web-based, real-time, interactive reaction–diffusion simulation environment designed for exploration, experimentation, learning, and generative art. The application prioritizes visual immediacy, direct manipulation, and intuitive discovery over mathematical formalism.

The system supports multiple reaction–diffusion models, rich interactivity (including drawing directly into the simulation), animated traversal of parameter space, side-by-side comparisons, and an experimental adaptive mode where the simulation subtly responds to user behavior.

This document is intended to be **implementation-ready** and can be used directly by an AI coding agent (e.g., Claude Code).

---

## Core Goals

1. Enable users to explore emergent Turing patterns through real-time interaction
2. Make parameter space intuitive and visually navigable
3. Support both scientific understanding and artistic creation
4. Maintain high performance (target: 60 FPS)
5. Be deterministic and reproducible when desired

---

## Non-Goals

- No server-side computation required
- No heavy mathematical derivations in UI
- No user authentication or accounts

---

## Technology Constraints

- **Rendering:** GPU-based (WebGL fragment shader preferred)
- **Simulation:** Reaction–diffusion computed fully on GPU
- **Architecture:** Modular model abstraction (support multiple equations)
- **Performance:** Frame-rate adaptive timestep
- **Threading:** No blocking of main UI thread

---

## Simulation Models

### Supported Models

Each model must conform to a shared interface:

```
Model {
  name: string
  parameters: ParameterDefinition[]
  initialize(state): void
  step(state, dt): void
}
```

#### 1. Gray–Scott (Default)
Parameters:
- Feed rate (F)
- Kill rate (k)
- Diffusion A (Da)
- Diffusion B (Db)

#### 2. Schnakenberg
Parameters:
- a
- b
- Diffusion A
- Diffusion B

#### 3. Brusselator
Parameters:
- A
- B
- Diffusion A
- Diffusion B

Switching models resets simulation state unless explicitly overridden.

---

## Main Features

### 1. Real-Time Simulation Canvas

- Primary visual focus of the app
- Fullscreen-capable
- Supports zoom and pan
- Click-drag interaction enabled

Controls:
- Scroll: zoom
- Drag: pan
- Double-click: recenter

---

### 2. Parameter Controls

#### Sliders

- All parameters adjustable in real time
- Log-scaled sliders for sensitive parameters
- Display:
  - Parameter name
  - Current value
  - Recommended range

#### Grouping

- Reaction parameters
- Diffusion parameters
- Simulation parameters

---

### 3. Simulation Controls

- Play / Pause
- Step (single iteration)
- Speed control: 0.25×, 0.5×, 1×, 2×, 4×
- Reset (return to last preset)
- Clear (uniform initial condition)
- Hard Reset (clear + reseed + reset parameters)

---

### 4. Pattern Presets

Curated presets that define:
- Model
- Parameter values
- Initial condition

Examples:
- Spots
- Stripes
- Maze
- Worms
- Spirals
- Chaos

Each preset includes:
- Name
- Short description
- Visual thumbnail

Preset transitions must animate parameter changes smoothly over time.

---

### 5. Color & Visualization

#### Color Schemes

- Grayscale
- Heatmap
- Blue–Yellow
- Neon / High-contrast
- Scientific (perceptually uniform)

#### Visualization Modes

- Chemical A
- Chemical B
- Difference (A − B)

Optional:
- Invert colors
- Contrast adjustment

---

### 6. Interactive Brush Tools

Users can directly modify the simulation by painting on the canvas.

Brush Modes:
- Add Chemical A
- Add Chemical B
- Erase / Reset region

Brush Controls:
- Size
- Intensity

Painting occurs in real time without pausing the simulation.

---

### 7. Parameter Space Diagram (F–k Explorer)

- 2D interactive diagram
- X-axis: Feed rate (F)
- Y-axis: Kill rate (k)

Features:
- Click to jump to parameters
- Drag to scrub continuously
- Live marker showing current position
- Tooltip labels for known regimes

---

### 8. Parameter Space Journey (Animated Path)

Allows animated traversal through parameter space.

User Inputs:
- Start point (F₁, k₁)
- End point (F₂, k₂)
- Duration

Behavior:
- Parameters interpolate smoothly per frame
- Simulation evolves continuously (no reset)
- Marker animates along the F–k diagram

Includes curated journeys (e.g., Spots → Stripes → Chaos).

---

### 9. Side-by-Side Comparison Mode

Two simulations run simultaneously.

Features:
- Independent or linked parameters
- Shared or independent initial conditions
- Synchronized play/pause

Use cases:
- Compare models
- Compare nearby parameter values
- Observe divergence from identical seeds

---

### 10. Information Panel

Context-sensitive explanatory panel.

Modes:
- Beginner: plain-language explanations
- Advanced: equations and parameter meaning

Content updates dynamically based on:
- Current model
- Parameter region
- User interactions

Panel must be collapsible.

---

### 11. Export & Output

#### Image Export

- Export PNG
- Screen resolution or 2× / 4× resolution
- Optional metadata embedding:
  - Model
  - Parameters
  - Timestamp

Future extension:
- GIF / MP4 recording
- Parameter JSON export

---

## Experimental Feature: Adaptive Drift Mode (Human-in-the-Loop)

### Concept

When enabled, the system subtly adapts parameter exploration based on user behavior.

### Signals Tracked

- Time spent viewing patterns
- Zoom and pan frequency
- Brush interaction density
- Preset revisits
- Export actions

### Behavior

- Gradual parameter drift toward preferred regions
- Exploration of nearby unseen regimes
- No explicit user input required

### Output

After sufficient interaction, generate a:

**Pattern Fingerprint** containing:
- Preferred parameter region
- Dominant pattern characteristics
- Signature color palette
- Shareable identifier

This mode must be opt-in.

---

## Determinism & Reproducibility

- Seeded random initialization supported
- Deterministic stepping when adaptive mode disabled
- Exported metadata allows exact reproduction

---

## Performance Requirements

- Target: 60 FPS on modern laptops
- Adaptive timestep under load
- Visual indicator if performance degrades

---

## Accessibility & UX

- Keyboard shortcuts for core controls
- Mobile-friendly sliders
- Clear visual hierarchy
- No hidden destructive actions

---

## Phased Implementation Plan

### Phase 1 — Core Explorer
- Gray–Scott model
- Real-time simulation
- Sliders + presets
- Color schemes
- Image export

### Phase 2 — Interaction & Insight
- Brush tools
- Parameter space diagram
- Parameter journey animation
- Info panel

### Phase 3 — Advanced & Experimental
- Multiple models
- Side-by-side comparison
- Adaptive Drift Mode
- Pattern fingerprint

---

## Acceptance Criteria

- Simulation remains stable across parameter ranges
- UI remains responsive under heavy interaction
- All controls have clear labels and tooltips
- Exported images accurately reflect on-screen state

---

## End of Specification

