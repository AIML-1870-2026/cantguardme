# Julia Set Rollercoaster Explorer - Technical Specification

## Project Overview
An innovative web-based application that combines fractal mathematics with interactive 3D gameplay. Users explore Julia Sets through two modes: a creative **Builder Mode** where they design rollercoaster tracks using fractal boundaries, and an immersive **Ride Mode** where they experience their creations in first-person and third-person views with full audio feedback.

## Core Concept
Julia Sets generate infinitely complex boundary curves that make perfect rollercoaster tracks. By manipulating the `c` parameter, users create different fractal patterns, trace paths along the boundaries, and then ride their mathematical creations with realistic physics and sound.

---

## Application Modes

### Mode 1: Builder Mode (Fractal Editor)
The creative workspace where users explore Julia Sets and design their rollercoaster tracks.

### Mode 2: Ride Mode (Gameplay)
The immersive experience where users ride their created rollercoasters with controls, camera modes, and audio.

---

## Feature Specifications

## 1. Julia Set Renderer (Core)

### Canvas & Rendering
- **Primary canvas**: 1200x800px default, scalable/responsive
- **Rendering engine**: WebGL for performance (fallback to Canvas 2D if needed)
- **Real-time rendering**: Update fractal when parameters change
- **Progressive rendering**: Show low-res preview, then refine to high quality
- **Iteration range**: 50-500 iterations (slider control)
- **Escape radius**: Standard radius 2.0

### Parameter Controls
- **c parameter inputs**:
  - Real component: slider (-2.0 to 2.0) + number input field
  - Imaginary component: slider (-2.0 to 2.0) + number input field
  - Visual feedback: show current c value prominently
  
- **Parameter Morphing Animation**:
  - "Animate" button that morphs c parameter along a path
  - Predefined paths: circular, spiral, linear sweep
  - Custom path option: click to add waypoints
  - Speed control: 1-10 (slow to fast)
  - Loop/ping-pong options
  - Pause/play/reset controls
  - Real-time fractal updates during animation

### Preset Julia Sets
Quick-access buttons for famous fractals:
1. **Dendrite**: c = i (0 + 1i)
2. **Spiral**: c = -0.75 + 0.11i
3. **Douady Rabbit**: c = -0.123 + 0.745i
4. **San Marco**: c = -0.75 + 0.0i
5. **Dragons**: c = -0.8 + 0.156i
6. **Siegel Disk**: c = -0.391 - 0.587i
7. **Airplane**: c = -0.75 + 0.2i
8. **Cauliflower**: c = 0.25 + 0.0i

Each preset button instantly loads the fractal and displays its name.

---

## 2. Custom Color Gradient Editor

### Interface
- **Gradient bar**: Visual representation with color stops
- **Color stops**: Click to add (max 10 stops), drag to reposition
- **Color picker**: Click any stop to change its color
- **Delete stop**: Right-click or delete button
- **Gradient presets**:
  - Classic Blue-Yellow-Red
  - Fire (Red-Orange-Yellow)
  - Ocean (Deep Blue-Cyan-White)
  - Psychedelic (Rainbow spectrum)
  - Monochrome (Black-White)
  - Neon (Bright saturated colors)
  - Earth Tones (Browns-Greens)
  - Custom (user creates from scratch)

### Mapping Options
- **Linear**: Direct iteration count to color
- **Logarithmic**: Emphasizes detail in low iteration areas
- **Smooth coloring**: Eliminates banding using continuous potential
- **Reverse gradient**: Flip color direction checkbox

### Save/Load
- Save custom gradients to browser localStorage
- Export gradient as JSON
- Import gradient from JSON

---

## 3. Educational Mode

### Iteration Visualizer
- **Point tracker**: Click anywhere on the Julia Set
- **Iteration path display**: 
  - Show the trajectory of z₀ → z₁ → z₂ → ... → zₙ
  - Animated line showing path evolution
  - Color-coded by iteration number
  - Display coordinates at each step
  
- **Information panel**:
  - Current point z value (real + imaginary components)
  - Current |z| (magnitude)
  - Iteration count
  - Status: "Escaping" or "Bounded" or "In set"
  - Escape velocity (how fast it escaped)

### Step Controls
- **Step-by-step mode**: Advance one iteration at a time
- **Play/Pause**: Animate the iteration process
- **Speed control**: Adjustable animation speed
- **Reset**: Return to z₀

### Educational Overlays
- **Formula display**: Show z = z² + c with current values
- **Info tooltips**: Hover over controls for explanations
- **Mandelbrot connection**: Optional small Mandelbrot set view showing current c location
- **Legend**: Explain color meaning (iterations to escape)

---

## 4. Rollercoaster Builder

### Track Creation from Fractal Boundaries
- **Boundary extraction**: Algorithm to detect Julia Set boundary
  - Sample points along the fractal edge
  - Connect points to form continuous curve
  - Smooth the curve for rideable geometry
  
- **Path selection**:
  - User clicks "Trace Track" button
  - Option 1: Auto-trace longest connected boundary
  - Option 2: User clicks start point → end point, algorithm finds path
  - Option 3: Manual placement mode (click to add waypoints following boundary)

- **Track editing**:
  - Drag control points to adjust path
  - Add/remove segments
  - Height adjustment: extrude the 2D fractal into 3D space
  - Banking/tilt controls for turns
  - Loop detection and completion

### 3D Track Visualization
- **Preview window**: Small 3D view showing track geometry
- **Track properties**:
  - Length display
  - Max/min height
  - Number of curves/loops
  - Estimated ride time
- **Visual styling**: Track appears as tubular rail with supports

### Track Validation
- Check for discontinuities
- Ensure safe speeds on curves (G-force limits)
- Mark problem areas in red
- "Test" button to do physics simulation preview

---

## 5. Ride Mode (Gameplay)

### Camera Perspectives
- **First Person (FPV)**:
  - Camera positioned at rider's eye level
  - Realistic head bobbing/motion
  - FOV: 90 degrees
  - Slight motion blur effects on fast sections
  
- **Third Person**:
  - Camera follows behind/above the cart
  - Smooth camera tracking with lag
  - Distance: 5-10 units behind cart
  - Height: 3-5 units above cart
  - Auto-rotates around cart on sharp turns

- **Switch camera**: Press 'C' key to toggle views

### Controls
- **W key**: Move forward (accelerate)
- **S key**: Move backward (brake/reverse)
- **SPACEBAR**: Boost (temporary speed increase)
  - Boost meter: depletes when used, regenerates over time
  - Visual effect: speed lines, glow
  - Audio effect: whoosh/engine rev
- **A/D keys**: Lean left/right (affects camera tilt, minor steering)
- **R key**: Reset to start position
- **ESC**: Exit ride mode, return to builder

### Physics Simulation
- **Realistic motion**:
  - Gravity effects (speed up downhill, slow up uphill)
  - Momentum conservation
  - Friction/drag
  - Centripetal force on curves
  
- **Speed limits**:
  - Base speed: 20 units/second
  - Boost speed: 40 units/second
  - Max speed from gravity: 60 units/second
  - Min speed: -10 units/second (slight reverse)

### HUD (Heads-Up Display)
- **Speed indicator**: MPH or units/sec
- **Boost meter**: Visual bar showing boost availability
- **Distance/progress**: How far along track
- **Timer**: Elapsed ride time
- **G-force meter**: Shows current forces (educational)
- **Current c value**: Remind user which Julia Set they're riding
- **Mini-map**: Top-down view of track with current position

---

## 6. Audio System

### Music
- **Background tracks**:
  - Ambient electronic music for Builder Mode
  - Energetic/exciting music for Ride Mode
  - Music intensity scales with speed
  
- **Adaptive audio**: Music tempo/pitch shifts based on speed
- **Volume controls**: Master, Music, SFX sliders
- **Mute button**: Quick silence toggle

### Sound Effects

**Builder Mode:**
- UI click/hover sounds
- Parameter change swoosh
- Fractal render complete chime
- Track placement clicks
- Success/error feedback tones

**Ride Mode:**
- Cart rolling sound (speed-dependent pitch)
- Wind rushing (volume/pitch based on speed)
- Whoosh on curves (panned left/right)
- Boost activation sound (rocket/engine)
- Descent woosh (pitch drops going downhill)
- Ascent strain (pitch rises going uphill)
- Click-clack on track segments (rhythmic)
- Screaming/cheering (optional, arcade-style)
- Landing thump after jumps/drops
- Brake screech when slowing

### Spatial Audio
- 3D positional audio for track elements
- Doppler effect on passing objects
- Reverb in enclosed sections
- Echo in valleys

---

## 7. High-Resolution Export

### Image Export
- **Resolution options**:
  - Standard: 1920x1080
  - High: 3840x2160 (4K)
  - Ultra: 7680x4320 (8K)
  - Custom: User-defined width/height
  
- **Format options**:
  - PNG (lossless, recommended)
  - JPEG (compressed, smaller file)
  - WebP (modern, efficient)

- **Export process**:
  - "Export Image" button
  - Resolution selector dialog
  - Progress bar during rendering
  - Off-screen canvas for high-res rendering
  - Automatic download when complete

### Track/Project Export
- **Save track data**: JSON file containing:
  - c parameter
  - Color gradient settings
  - Track path coordinates
  - Camera settings
  - Custom name/description
  
- **Import track**: Load .json file to recreate track
- **Share link**: Generate URL with encoded parameters

### Gameplay Recording (Stretch)
- **Record ride**: Capture video of gameplay
  - Uses MediaRecorder API
  - Records canvas + audio
  - 60 FPS capture
  - WebM format
  - Download at end of ride

---

## 8. User Interface Layout

### Builder Mode Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  JULIA SET ROLLERCOASTER EXPLORER              [Mode: Builder]  │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  CONTROLS    │                                                   │
│  PANEL       │          MAIN FRACTAL CANVAS                      │
│              │          (1200 x 800)                             │
│  - c Params  │                                                   │
│  - Presets   │                                                   │
│  - Colors    │                                                   │
│  - Iterations│                                                   │
│  - Animation │                                                   │
│  - Education │                                                   │
│              │                                                   │
│  TRACK       │                                                   │
│  BUILDER     │                                                   │
│  - Trace     │                                                   │
│  - Edit      │                                                   │
│  - Preview   │                                                   │
│              │                                                   │
│  [RIDE IT!]  │                                                   │
│              │                                                   │
│  EXPORT      │          STATUS BAR: Rendering... / Ready        │
│  - Save Img  │          c = -0.75 + 0.11i  |  Iterations: 256   │
│  - Save Track│                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

### Ride Mode Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ╔════════════════════════════════════════════════════════════╗ │
│  ║                                                            ║ │
│  ║                    3D RENDER VIEWPORT                      ║ │
│  ║                (Full-screen immersive view)                ║ │
│  ║                                                            ║ │
│  ║  [HUD Overlay]                                             ║ │
│  ║  Speed: 45 mph          Boost: ████████░░ 80%              ║ │
│  ║  Distance: 234/890 m    Time: 0:23                         ║ │
│  ║  G-Force: 2.1g          [Mini-map]                         ║ │
│  ║                                                            ║ │
│  ║                                                            ║ │
│  ╚════════════════════════════════════════════════════════════╝ │
│                                                                 │
│  [ESC - Exit]  [C - Camera]  [W/S - Speed]  [SPACE - Boost]    │
└─────────────────────────────────────────────────────────────────┘
```

### Responsive Design
- **Desktop**: Full layout as shown
- **Tablet**: Controls become collapsible sidebar
- **Mobile**: Not primary target, but basic fractal viewer works

---

## 9. Technical Requirements

### Technologies
- **HTML5**: Structure
- **CSS3**: Styling, animations, flexbox/grid layout
- **JavaScript (ES6+)**: Core logic
- **WebGL/Three.js**: 3D graphics rendering
- **Web Audio API**: Sound generation and spatial audio
- **Canvas API**: 2D fractal rendering (or WebGL for performance)

### Libraries (Recommended)
- **Three.js**: 3D scene, camera, rendering
- **Howler.js**: Simplified audio management
- **dat.GUI** or custom: Parameter controls
- **FileSaver.js**: Download exports

### Performance Considerations
- **Web Workers**: Offload fractal calculations to background thread
- **RequestAnimationFrame**: Smooth 60 FPS rendering
- **Throttling**: Debounce parameter changes
- **LOD (Level of Detail)**: Lower quality fractals at high zoom/animation
- **Caching**: Store rendered fractals for quick parameter switching
- **Memory management**: Clean up unused canvases/textures

### Browser Compatibility
- **Target**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **WebGL required**: Fallback message if not supported
- **LocalStorage**: For saving gradients and tracks
- **Web Audio**: Graceful degradation if blocked

---

## 10. File Structure

```
julia-rollercoaster/
├── index.html              # Main entry point
├── styles/
│   ├── main.css           # Global styles
│   ├── builder.css        # Builder mode styles
│   └── ride.css           # Ride mode styles
├── scripts/
│   ├── main.js            # App initialization
│   ├── julia-renderer.js  # Fractal calculation & rendering
│   ├── color-gradient.js  # Color gradient editor
│   ├── parameter-morph.js # Animation system
│   ├── education-mode.js  # Iteration visualizer
│   ├── track-builder.js   # Track creation & editing
│   ├── ride-engine.js     # 3D gameplay & physics
│   ├── audio-system.js    # Sound management
│   ├── export-handler.js  # High-res export
│   └── utils.js           # Helper functions
├── assets/
│   ├── sounds/
│   │   ├── music/         # Background tracks
│   │   └── sfx/           # Sound effects
│   ├── textures/          # 3D textures for track
│   └── icons/             # UI icons
├── lib/
│   ├── three.min.js       # Three.js library
│   └── howler.min.js      # Howler.js library
└── README.md              # Documentation
```

---

## 11. Implementation Priority

### Phase 1: Core Fractal Engine (Foundation)
1. Basic Julia Set renderer with c parameter controls
2. Real-time canvas updates
3. Preset Julia Sets buttons
4. Simple color scheme (single gradient)
5. Iteration slider

### Phase 2: Visual Enhancements
6. Custom color gradient editor
7. Multiple color scheme presets
8. Smooth coloring algorithm
9. High-resolution image export
10. Parameter morphing animation

### Phase 3: Educational Features
11. Iteration visualizer with point tracking
12. Step-by-step iteration mode
13. Educational overlays and tooltips
14. Mandelbrot set mini-view (optional)

### Phase 4: Track Builder
15. Boundary detection algorithm
16. Track tracing system
17. 3D preview window
18. Track editing tools
19. Path validation

### Phase 5: Ride Mode (3D Gameplay)
20. Three.js scene setup
21. Track geometry generation
22. Basic physics simulation
23. First-person camera
24. Third-person camera
25. W/S/D/SPACE controls
26. HUD elements

### Phase 6: Audio & Polish
27. Background music integration
28. Sound effects library
29. Spatial audio implementation
30. Adaptive audio based on speed
31. UI polish and animations
32. Comprehensive testing

---

## 12. User Experience Flow

### New User Journey
1. **Landing**: Sees a beautiful preset Julia Set (Spiral) rendering
2. **Tutorial prompt**: "Welcome! Create rollercoasters from fractals."
3. **Guided tour**: Highlights key controls (c parameter, presets)
4. **First interaction**: User clicks a preset button → sees immediate change
5. **Build prompt**: "Try tracing a track along the fractal edge"
6. **First ride**: User clicks "Trace Track" → auto-generates → "Ride It!" button appears
7. **Gameplay**: Enters Ride Mode, experiences first-person view
8. **Victory**: Completes track, sees stats, invited to try another Julia Set

### Power User Features
- Keyboard shortcuts for all major functions
- Save/load custom presets
- Advanced parameter animation with waypoints
- Fine-tuned track editing
- Custom gradient creation
- High-res exports for wallpapers/prints

---

## 13. Accessibility Considerations

- **Keyboard navigation**: All controls accessible via keyboard
- **Screen reader support**: ARIA labels on interactive elements
- **Color contrast**: Text readable on all backgrounds
- **Motion sensitivity**: Option to reduce animations
- **Audio warnings**: Visual indicators if sound is critical
- **Seizure warning**: Flashing/rapid animation toggle

---

## 14. Future Enhancements (Post-MVP)

- **Multiplayer**: Race against friends on same track
- **Leaderboards**: Fastest times on community tracks
- **Track sharing**: Upload/download tracks from community
- **VR support**: WebXR for immersive VR experience
- **Mandelbrot explorer**: Separate mode for Mandelbrot set
- **Other fractals**: Burning Ship, Newton fractals, etc.
- **Track editor**: Node-based track design tool
- **Physics modes**: Realistic vs. arcade physics toggle
- **Weather effects**: Rain, snow, fog on tracks
- **Track themes**: Underground, space, underwater environments
- **Power-ups**: Speed boosts, time slowdown pickups
- **Achievements**: Unlock new Julia Sets by completing challenges

---

## 15. Success Metrics

**Builder Mode:**
- User can generate Julia Set in < 2 seconds
- Parameter changes feel responsive (< 100ms)
- Custom gradients saved successfully
- High-res exports complete without errors

**Ride Mode:**
- Maintains 60 FPS during gameplay
- Track physics feel natural and fun
- Audio is synchronized with visuals
- Camera transitions are smooth
- Controls are intuitive (< 30 seconds to learn)

**Overall:**
- Users spend 10+ minutes exploring
- Users create and ride multiple tracks
- Application works across browsers
- No critical bugs or crashes
- Positive user feedback on uniqueness

---

## 16. Development Notes

### Known Challenges
- **Boundary extraction**: Julia Set boundaries are fractal → complex to trace
  - Solution: Use marching squares or contour following algorithm
  - Simplify/smooth the path for performance
  
- **3D track generation**: Converting 2D fractal to 3D rideable track
  - Solution: Extrude 2D path, add height variation, bank curves
  
- **Performance**: High-res fractals + 3D rendering + audio = heavy load
  - Solution: Web Workers, LOD, GPU acceleration, caching
  
- **Audio sync**: Keeping sound effects perfectly timed with visuals
  - Solution: Use Web Audio API scheduling, timestamp-based triggering

### Testing Strategy
- Unit tests for Julia Set calculations
- Visual regression tests for fractal accuracy
- Performance profiling (frame rate, memory)
- Cross-browser testing
- User testing for control intuitiveness
- Audio playback testing on different devices

---

## Conclusion

This specification defines a comprehensive, innovative web application that transforms mathematical fractals into playable rollercoaster experiences. By combining education, artistry, and gameplay, the Julia Set Rollercoaster Explorer offers a unique way to explore complex mathematics while having fun.

The modular design allows for iterative development, starting with core fractal rendering and building up to the full 3D gameplay experience. Each feature is designed to be engaging, educational, and technically impressive.

**Target Completion**: Fully functional MVP with all specified features
**Estimated Complexity**: Advanced (suitable for experienced developers or extended development time)
**Innovation Factor**: High (unique concept combining fractals + 3D gaming)

---

**Document Version**: 1.0  
**Created**: February 2026  
**License**: MIT (or specify your preferred license)  
**Contact**: [Your contact information]

---

Ready to build something extraordinary! 🎢✨
