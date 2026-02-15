# Decision Neuron Quest — spec.md

## Project Overview

A sci-fi themed, chatbot-driven interactive neural network decision tool. The app starts as a clean, minimal interface. Users describe a decision to a Claude-powered chatbot, and a neural network visualization builds and adjusts in real-time based on the conversation. No manual sliders or forms — the chat IS the interface.

---

## Architecture

### Two Modes (tab/toggle at top)

1. **"Decide" Mode** — Main experience. Chat + live neural network visualization.
2. **"Learn" Mode** — Training sandbox. Place labeled points, watch the neuron learn step-by-step.

---

## "Decide" Mode

### Layout (~75% / ~25% split)

- **Left/Center (~75%):** Neural network visualization — the star of the show.
- **Right (~25%):** Compact chatbot panel, visually integrated into the sci-fi aesthetic.

### Chatbot Panel (Right ~25%)

**Powered by:** Anthropic API (Claude-in-Claude, model: `claude-sonnet-4-20250514`)

**Behavior:**
- User describes a decision they're facing in natural language
- Claude extracts factors (inputs), assigns initial weights and bias, determines yes/no labels
- Claude responds with **minimal text** — short confirmations or clarifying nudges
- The **real output** is adjusting the neural network visualization on the left
- If the user adds a factor, it appears as a new input node
- If the user says a factor matters less, its weight decreases
- If the user removes a factor, the node fades out
- Claude sends structured JSON alongside brief chat text to drive the visualization

**Claude System Prompt should instruct it to:**
- Extract decision factors from natural language
- Output a JSON object with: `title`, `emoji`, `inputs[]` (each with `name`, `weight`, `range`, `description`), `bias` (value + label), `yesLabel`, `noLabel`, `celebrationText`
- Keep chat responses to 1-2 short sentences max
- Ask brief clarifying questions if the decision is too vague
- Update the JSON when the user modifies their decision

**Chatbot Sci-Fi Design:**
- Dark glass/translucent panel with subtle glowing border (cyan/magenta palette)
- Messages appear with a typing/decode animation (slight glitch effect as text renders)
- User messages: cyan glow accent
- Bot messages: magenta/soft white glow accent
- Input field: pulsing border like a terminal awaiting input
- Thinking state: pulsing neural waveform animation (not generic dots)
- When bot triggers a network change: energy pulse ripple from chat panel → visualization
- Thin, glowing, minimal scrollbar
- Bot avatar: small animated neuron icon that pulses when responding
- Monospace/tech font for timestamps and labels (low opacity)

---

### Neural Network Visualization (Left ~75%)

**What renders:**
- **Input nodes** — one per factor, labeled, with glow intensity proportional to current value
- **Connection edges** — lines from inputs to the central neuron, thickness/color representing weight magnitude/sign (positive = cyan, negative = magenta)
- **Weight labels** — displayed on edges, update with smooth animation
- **Central neuron** — the decision unit, glows based on output probability
- **Output** — "Yes" / "No" label (customized to domain) with probability percentage
- **Sigmoid curve** — small inset showing current activation point
- **Decision boundary heatmap** — 2D plot using the two most important inputs as axes (cool blue → white → magenta gradient), gold contour line at threshold
- **Bias indicator** — visual representation of the bias/tendency value

**Animations:**
- New input nodes fade/grow in with a glow burst
- Removed nodes fade out with particle dissolve
- Weight changes: edges animate thickness/color smoothly
- Decision boundary shifts with fluid motion
- Energy pulses travel along edges when values change
- Particle effects along the decision boundary line
- Central neuron pulses when output changes significantly

**Stretch Challenge Features (integrated as expandable panels/overlays):**

#### Feature 1: Multi-Scenario (Core — driven by chatbot)
- The chatbot naturally enables this — each new conversation creates a new scenario
- Preset quick-start scenarios available: 🎓 Choose a College, 🐕 Adopt a Pet, 🚗 Road Trip?, 💻 Tech Upgrade
- Selecting a preset populates the chat with a starter message and builds the network

#### Feature 2: Decision Boundary Visualizer
- 2D heatmap using two inputs as X/Y axes
- Gold contour line at decision threshold
- Crosshair dot tracks current input position
- Dropdown to choose which two inputs map to axes
- Moving bias shifts the entire boundary

#### Feature 3: Activation Function Showdown
- Toggle between: Sigmoid (classic), Step Function (1958 perceptron), ReLU (modern)
- Output, neuron color, and math display update live
- Function curve plot with moving marker at current z value
- Optional comparison mode overlaying all three curves

#### Feature 4: Two-Neuron Chain
- When the decision is complex, the chatbot can suggest or the user can enable a second neuron
- Neuron 1 output feeds into Neuron 2
- Neuron 2 can have additional inputs (e.g., "Budget Available", "Partner Approval")
- Animated chain synapse with adjustable weight connects the two
- Math display expands: z₁ → a₁ → z₂ → output

#### Feature 5: Sensitivity Analysis
- Line chart sweeping each input 0→1 while holding others fixed
- Steep curves = influential inputs
- Negative weight inputs slope downward
- Vertical markers show current slider values
- Optional bar chart ranking inputs by influence

---

## "Learn" Mode

### Full-screen training sandbox

**Components:**
- **2D scatter plot** — X and Y axes represent two chosen inputs
- **Click to add points** — each point is a data example
- **Label toggle** — two-button system to label points as "Yes" (cyan) or "No" (magenta)
- **"Step" button** — advances one training iteration with animation (decision line moves)
- **"Train" button** — runs multiple steps automatically with visible animation
- **"Reset" button** — clears all points and resets weights to random
- **Speed slider** — controls auto-training speed
- **Stats display** — current weights, bias, step counter, accuracy percentage
- **Decision line** — visible on the plot, animates as it moves during training
- **Weight update animation** — show numerical weight values ticking up/down during steps
- **Preset datasets** — loadable example point sets (e.g., "Linearly separable", "Clustered", "Noisy")

**Sci-fi styling consistent with Decide mode:**
- Same dark theme, glow effects, color palette
- Points glow with their label color
- Decision line has a neon glow
- Training steps produce subtle particle/energy effects along the line as it moves

---

## Global Design System

### Color Palette
- **Background:** Very dark navy/black (#0a0a1a or similar)
- **Primary accent:** Cyan (#00f0ff)
- **Secondary accent:** Magenta/pink (#ff00aa)
- **Tertiary accent:** Gold (#ffd700) — used for decision boundary contour, highlights
- **Text:** White with varying opacity (100%, 70%, 40%)
- **Positive weights/yes:** Cyan
- **Negative weights/no:** Magenta
- **Panels:** Semi-transparent dark glass (rgba dark with blur backdrop)

### Typography
- **Headings/labels:** Monospace tech font (e.g., `'JetBrains Mono'`, `'Fira Code'`, or `'Space Mono'`)
- **Body/chat:** Clean sans-serif (e.g., `'Inter'`, `'Space Grotesk'`)
- **Numbers/stats:** Monospace, always

### Animations
- All transitions: smooth easing (ease-out or spring-like)
- Glow effects: CSS box-shadow with color from palette, subtle pulse keyframes
- Particle effects: lightweight canvas or CSS-based
- Energy pulses: traveling glow along SVG paths
- Hover states: slight scale + glow increase

### Responsive
- Mobile: Stack layout vertically (visualization on top, chat below)
- Tablet: Side-by-side with adjusted proportions
- Desktop: Full 75/25 split

---

## Tech Stack

- **Single-file React artifact** (.jsx)
- **Tailwind CSS** for layout utilities
- **Inline styles / CSS-in-JS** for sci-fi effects (glows, gradients, animations)
- **Canvas or SVG** for neural network visualization and heatmap
- **Anthropic API** via fetch to `/v1/messages` (Claude-in-Claude)
- **No external dependencies** beyond what's available in the artifact environment (React, recharts, d3, lodash, lucide-react, Three.js if needed)

---

## Data Flow

```
User types in chat
       ↓
Claude API call (with system prompt + conversation history)
       ↓
Claude returns: { brief chat text } + { structured JSON for network state }
       ↓
Parse JSON → Update React state for network config
       ↓
Visualization re-renders with animations
       ↓
User sees network build/adjust in real-time
```

---

## Claude API System Prompt (for in-app chatbot)

```
You are a Decision Neuron assistant. Your job is to help users model their decisions as a single-neuron neural network.

When the user describes a decision:
1. Extract 3-5 input factors
2. Assign initial weights (-1 to 1) based on how each factor influences the decision
3. Determine a bias value and a human-readable bias label
4. Create yes/no labels specific to the domain

Always respond with TWO parts:
1. A brief chat message (1-2 sentences max, conversational)
2. A JSON block wrapped in <neuron_config>...</neuron_config> tags

JSON schema:
{
  "title": "string - decision title",
  "emoji": "string - single emoji",
  "inputs": [
    {
      "name": "string",
      "weight": "number (-1 to 1)",
      "value": "number (0 to 1, default 0.5)",
      "description": "string - brief tooltip"
    }
  ],
  "bias": {
    "value": "number (-2 to 2)",
    "label": "string - human readable tendency name"
  },
  "yesLabel": "string",
  "noLabel": "string",
  "activationFunction": "sigmoid | step | relu"
}

When the user modifies their decision (adds/removes factors, changes importance), output an updated JSON.
When the user is just chatting, respond conversationally without JSON.
Keep all chat responses SHORT. Your real output is the network visualization.
```

---

## File Structure

Single `.jsx` file containing:
- Main `App` component with mode toggle
- `DecideMode` component (chat + visualization)
- `LearnMode` component (training sandbox)
- `NeuralNetworkViz` component (SVG/Canvas visualization)
- `ChatPanel` component (chatbot UI)
- `DecisionBoundary` component (2D heatmap)
- `ActivationPanel` component (function comparison)
- `SensitivityPanel` component (sensitivity analysis)
- `TwoNeuronChain` component (stretch: chained neurons)
- Helper functions: sigmoid, step, relu, forward pass, training step

---

## Interaction Examples

**Example 1: Starting a conversation**
> User: "I'm trying to decide if I should adopt a dog"
> Bot: "Let's model that decision! 🐕"
> [Network builds: inputs appear for Time Available, Living Space, Budget, Allergies, Loneliness]

**Example 2: Adjusting weights**
> User: "Actually, money isn't really an issue for me"
> Bot: "Got it — lowering the budget weight."
> [Budget edge thins, decision boundary shifts]

**Example 3: Adding a factor**
> User: "Oh, I should also consider that my landlord doesn't allow pets"
> Bot: "That's a big one — adding landlord policy as a strong negative factor."
> [New node fades in with magenta edge, boundary shifts significantly]

---

## Success Criteria

- [ ] App starts clean — just a chat interface with a subtle neural network placeholder
- [ ] Chatbot correctly extracts factors and builds a network from natural language
- [ ] Visualization animates smoothly as the network changes
- [ ] Decision boundary heatmap renders correctly
- [ ] Activation function comparison works
- [ ] Two-neuron chain is functional
- [ ] Sensitivity analysis displays correctly
- [ ] Learn mode allows placing points and training with visible animation
- [ ] Entire app maintains cohesive sci-fi aesthetic
- [ ] Mobile responsive
- [ ] All animations are smooth and performant
