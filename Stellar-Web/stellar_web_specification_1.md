# Stellar Web Visualization - Technical Specification

## Project Overview

**Project Name:** Stellar Web Explorer  
**Version:** 1.0  
**Created:** January 2026  
**Purpose:** An interactive particle system visualization that demonstrates emergent network structures through proximity-based connections.

---

## Concept

Stellar Web is an interactive visualization that transforms individual particles into a dynamic network through a simple rule: "connect nodes that are close enough." This demonstrates how complex structures emerge from simple proximity rules applied across many elements.

### Key Learning Objectives

- Understanding emergent networks and how complex structures arise from simple rules
- Exploring the relationship between connectivity radius and network topology
- Observing real-time network metrics and their meaning
- Applying network concepts across multiple disciplines (neuroscience, epidemiology, ecology, etc.)

---

## Technical Architecture

### Core Technologies

- **HTML5 Canvas** - For high-performance 2D rendering
- **Vanilla JavaScript** - No external dependencies for maximum portability
- **CSS3** - For UI panels and transitions

### System Components

#### 1. Node System
Each node is a particle moving through true 3D space with the following properties:

- **Position:** (x, y, z) coordinates in 3D space
  - All coordinates range from -250 to 250 (centered at origin)
  - True 3D space with toroidal topology (wrap-around)
- **Velocity:** (vx, vy, vz) movement vectors
- **Rendering:** Projected to 2D using perspective transformation
  - Size and opacity scaled by distance from camera
  - Nodes behind camera are not rendered

#### 2. 3D Projection System
Converts 3D coordinates to 2D canvas coordinates:

- **Rotation:** Applies X and Y axis rotations for camera angles
- **Perspective:** Uses configurable perspective distance
- **Depth Sorting:** Handles occlusion and scaling based on depth
- **Scale Factor:** Objects further from camera appear smaller

#### 3. Edge System
#### 3. Edge System
Connections between nodes based on true 3D proximity:

- **Connection Rule:** 3D distance < connectivity radius
- **Visual Properties:**
  - Opacity decreases with 3D distance
  - Perspective-based scaling
  - Configurable thickness scaled by depth
- **Dynamic:** Edges appear and disappear as nodes move in 3D space
- **Culling:** Edges to nodes behind camera are not rendered

#### 4. Statistics Engine
Real-time calculation of network metrics:

- **Total Nodes:** Current particle count
- **Total Edges:** Active connections
- **Average Connections:** Mean edges per node
- **Network Density:** Percentage of possible connections (edges / max_possible_edges)
- **Max Connections:** Highest connected node

---

## User Interface

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [≡]  Stellar Web Explorer                    [≡]  │
│                                                      │
│  ┌──────────┐                      ┌──────────┐    │
│  │ Controls │  Canvas Animation    │   Stats  │    │
│  │  Panel   │      Area            │   Panel  │    │
│  │(Hidden)  │                      │ (Hidden) │    │
│  └──────────┘                      └──────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Control Panel (Left Side)

**Features:**
- Collapsible slide-out panel
- Toggle button with icon indicator
- Smooth 0.3s transition animation
- Dark semi-transparent background (rgba(20, 20, 30, 0.95))

**Controls:**

1. **Node Properties**
   - Node Speed: 0.1 - 3.0 (step: 0.1)
   - Node Count: 20 - 150 (step: 5)
   - Node Size: 2 - 10 (step: 0.5)

2. **Connection Properties**
   - Connectivity Radius: 50 - 400 (step: 10)
   - Edge Thickness: 0.5 - 3.0 (step: 0.1)

3. **3D Camera**
   - Rotation X: -180° to 180° (step: 5°)
   - Rotation Y: -180° to 180° (step: 5°)
   - Perspective: 400 - 2000 (step: 50)

### Statistics Panel (Right Side)

**Features:**
- Collapsible slide-out panel
- Independent toggle button
- Real-time metric updates
- Formatted numerical displays

**Metrics Displayed:**
- Total Nodes
- Total Edges
- Average Connections (1 decimal)
- Network Density (percentage with 1 decimal)
- Max Connections

---

## Animation System

### Rendering Pipeline

1. **Clear Frame** - Semi-transparent black (0.1 alpha) for motion blur effect
2. **Update Nodes** - Apply velocity to position
3. **Wrap Boundaries** - Toroidal topology (edges wrap around)
4. **Calculate Edges** - Check all node pairs for proximity
5. **Draw Edges** - Render connections with distance-based opacity
6. **Draw Nodes** - Render particles with depth-based scaling
7. **Update Statistics** - Calculate and display network metrics

### Performance Optimization

- **Edge Calculation:** O(n²) complexity - efficient for n < 150
- **Partial Clearing:** Motion blur effect instead of full clear
- **Request Animation Frame:** Browser-optimized rendering loop

### True 3D Space Implementation

Nodes exist and move in genuine 3D space with perspective projection:

- **3D Coordinates:** All nodes have real (x, y, z) positions centered at origin
- **Rotation Matrices:** Camera can rotate around X and Y axes
- **Perspective Projection:** Distant objects appear smaller using perspective division
- **Scale Factor:** `scale = perspective / (perspective + z)`
- **Depth Culling:** Nodes behind camera (z < -perspective) are not rendered
- **Distance Calculation:** True 3D Euclidean distance for connectivity
- **Toroidal Topology:** 3D wrap-around at boundaries (-250 to 250)

---

## Mathematical Formulas

### 3D Rotation Transformations

**Rotation around X-axis:**
```
y' = y × cos(rotX) - z × sin(rotX)
z' = y × sin(rotX) + z × cos(rotX)
```

**Rotation around Y-axis:**
```
x' = x × cos(rotY) + z' × sin(rotY)
z'' = -x × sin(rotY) + z' × cos(rotY)
```

### Perspective Projection
```
scale = perspective / (perspective + z'')
screenX = x' × scale + centerX
screenY = y' × scale + centerY
```

### 3D Distance Calculation
```
distance = √(dx² + dy² + dz²)
```
Note: True 3D Euclidean distance between node positions

### Network Density
```
density = (actual_edges / max_possible_edges) × 100
max_possible_edges = n(n-1) / 2
```

### Average Connections
```
avg_connections = total_connection_count / node_count
where total_connection_count = Σ(connections_per_node)
```

### Edge Opacity
```
opacity = (1 - distance/radius) × 0.4
avgScale = (scale1 + scale2) / 2
finalOpacity = opacity × avgScale
```

---

## Parameter Effects

### Node Speed
- **Low (0.1-0.5):** Slow drift, stable networks
- **Medium (0.5-1.5):** Dynamic balance
- **High (1.5-3.0):** Rapid changes, fleeting connections

### Node Count
- **Low (20-50):** Sparse, visible individual paths
- **Medium (50-100):** Balanced complexity
- **High (100-150):** Dense, complex webs

### Connectivity Radius
- **Small (50-100):** Isolated clusters, low density
- **Medium (100-200):** Delicate web structures
- **Large (200-400):** Dense meshes, high connectivity

### Node Size
- **Visual impact only:** Does not affect network connectivity
- Larger sizes improve visibility but may clutter at high counts

### Edge Thickness
- **Visual impact only:** Affects visibility of connections
- Thicker edges emphasize network structure

### Rotation X & Y
- **Camera orientation:** Rotates the 3D view around X and Y axes
- **X Rotation:** Tilts view up/down
- **Y Rotation:** Rotates view left/right
- Combine both for complex viewing angles

### Perspective
- **Low (400-800):** Strong perspective, dramatic depth
- **Medium (800-1200):** Balanced 3D effect
- **High (1200-2000):** Subtle perspective, flatter appearance

---

## Color Scheme

- **Background:** Pure black (#000000)
- **Primary Accent:** Light blue (#64a0ff / rgba(100, 160, 255))
- **Nodes:** Blue with depth-based opacity
- **Edges:** Blue with distance-based opacity
- **UI Panels:** Dark blue-gray (rgba(20, 20, 30, 0.95))
- **Text - Headers:** Light blue (#64a0ff)
- **Text - Labels:** Light gray (#aaa)

---

## Browser Compatibility

### Requirements
- **HTML5 Canvas** support
- **ES6 JavaScript** features
- **CSS3 Transitions** and transforms
- **RequestAnimationFrame** API

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- Responsive canvas sizing
- Touch-friendly toggle buttons
- Performance may vary with particle count

---

## File Structure

```
stellar_web.html
├── HTML Structure
│   ├── Canvas element
│   ├── Title
│   ├── Control panel
│   ├── Statistics panel
│   └── Toggle buttons
├── CSS Styling
│   ├── Layout and positioning
│   ├── Panel animations
│   ├── Control styling
│   └── Responsive design
└── JavaScript
    ├── Canvas setup
    ├── Node class
    ├── Edge rendering
    ├── Statistics calculation
    ├── Event listeners
    └── Animation loop
```

---

## Usage Instructions

### Getting Started
1. Open `stellar_web.html` in a modern web browser
2. The animation begins automatically with default parameters
3. Click the left toggle button (≡) to open controls
4. Click the right toggle button (≡) to view statistics

### Exploring Networks
1. **Adjust Connectivity Radius** to see how connection thresholds affect network structure
2. **Increase Node Count** to observe emergent complexity
3. **Modify Node Speed** to see temporal dynamics
4. **Watch Statistics** to understand network properties quantitatively

### Educational Applications
- **Computer Science:** Graph theory, network algorithms
- **Biology:** Neural networks, ecological webs
- **Physics:** Particle interactions, force networks
- **Social Science:** Social network analysis
- **Data Science:** Network visualization techniques

---

## Extension Ideas

### Potential Enhancements

1. **Network Algorithms**
   - Shortest path highlighting
   - Community detection
   - Centrality measures

2. **Interaction Features**
   - Click to add nodes
   - Drag to influence movement
   - Pin nodes in place

3. **Visual Enhancements**
   - Color coding by connectivity
   - Node size by degree
   - Particle effects

4. **Data Integration**
   - Import network data (JSON, CSV)
   - Export network snapshots
   - Save/load configurations

5. **Advanced Metrics**
   - Clustering coefficient
   - Betweenness centrality
   - Network diameter
   - Connected components

6. **Physical Simulation**
   - Force-directed layout
   - Gravity wells
   - Collision detection

---

## Performance Considerations

### Optimal Settings
- **Node Count:** 50-80 for smooth animation on most devices
- **Connectivity Radius:** 100-200 for interesting structures without excessive edges
- **Update Rate:** 60 FPS target with RequestAnimationFrame

### Performance Bottlenecks
- **Edge Calculation:** O(n²) - primary bottleneck at high node counts
- **Canvas Clearing:** Partial clear reduces overhead
- **Statistical Calculations:** Computed per frame

### Optimization Strategies
- Use spatial partitioning (quadtree/octree) for large node counts
- Implement Level-of-Detail (LOD) for distant nodes
- Consider Web Workers for statistics calculation
- Use OffscreenCanvas for parallel rendering

---

## Educational Context

### Network Science Concepts

**Emergent Behavior:** Complex global patterns arising from simple local rules - nodes don't "know" they're forming a network, they simply follow proximity rules.

**Connectivity Threshold:** The critical radius where isolated clusters suddenly connect into a giant component (percolation theory).

**Network Topology:** The shape and structure of connections, which determines information flow, resilience, and behavior.

**Scale Invariance:** Many real networks show similar structural patterns at different scales.

### Real-World Applications

1. **Neuroscience:** Brain connectivity maps show similar proximity-based connection patterns
2. **Epidemiology:** Contact tracing networks help predict disease spread
3. **Ecology:** Food webs reveal species interaction patterns
4. **Technology:** Internet and mesh network topologies
5. **Social Systems:** How social connections form and evolve

---

## Troubleshooting

### Common Issues

**Animation not starting:**
- Check browser console for errors
- Ensure JavaScript is enabled
- Verify canvas element is properly sized

**Poor performance:**
- Reduce node count
- Lower connectivity radius
- Close other browser tabs

**Controls not responding:**
- Check that panel is open
- Verify event listeners are attached
- Try refreshing the page

**Statistics not updating:**
- Ensure nodes are initialized
- Check that animation loop is running
- Verify DOM elements exist

---

## Credits & License

**Created for:** Educational purposes demonstrating particle systems and network emergence

**Inspiration:** Network science, graph theory, and emergent behavior in complex systems

**License:** Open for educational and personal use

---

## Version History

**v1.1 (January 2026)**
- Added true 3D space implementation with perspective projection
- Added rotation controls (X and Y axes)
- Added adjustable perspective distance
- Implemented depth culling for nodes behind camera
- Updated distance calculations to use true 3D Euclidean distance
- Enhanced visual depth with perspective-based scaling

**v1.0 (January 2026)**
- Initial release
- Collapsible control panel
- Collapsible statistics panel
- Simulated 3D depth effect
- Real-time network metrics
- Five configurable parameters

---

## Contact & Support

For questions, suggestions, or bug reports related to this visualization, please refer to the documentation or contribute improvements to the codebase.

**Remember:** The beauty of Stellar Web lies not in its complexity, but in how complex behavior emerges from simple rules. Every connection is a local decision, yet together they create global structure - a fundamental principle found throughout nature, technology, and society.
