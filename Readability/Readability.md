# Operation Readable — Spy Decoder Spec

## Overview

**Operation Readable** is an interactive web-based tool themed as a spy intelligence terminal. The user plays the role of an intelligence analyst decoding intercepted transmissions by calibrating text contrast, color, and size. Under the hood, it's a **WCAG contrast ratio explorer** that teaches accessibility principles through a compelling espionage narrative.

Built as a single-page HTML/CSS/JS application (no frameworks). Deployable to GitHub Pages.

---

## Narrative Frame

You are **Agent Lux**, an analyst at the **Visibility Intelligence Agency (V.I.A.)**. Enemy operatives are transmitting coded messages using low-contrast color combinations designed to evade detection. Your mission: calibrate your **Decryption Terminal** to make each intercepted message readable.

The agency follows a strict **Field Readability Protocol** (WCAG standards). Messages must pass protocol clearance before being forwarded to command.

---

## Visual Design Direction

### Aesthetic: Retro-Futuristic Command Center

- **Dark UI shell** — charcoal (#1a1a2e) and deep navy (#16213e) background
- **Accent color** — amber/phosphor green terminal glow (#00ff41 or #ffb800)
- **Typography**:
  - Headings/labels: A monospace or military stencil-style display font (e.g., `Share Tech Mono`, `VT323`, or `Courier Prime` from Google Fonts)
  - Readouts/numbers: Monospace with a digital LED feel (e.g., `Orbitron`, `Digital-7`)
  - Body/explanatory text: Clean sans-serif (e.g., `IBM Plex Sans`, `Source Sans 3`)
- **Textures & atmosphere**:
  - Subtle scanline overlay on the terminal preview area (CSS repeating-linear-gradient)
  - Faint grid/topographic lines in the background
  - CRT screen curvature effect on the preview (CSS border-radius + box-shadow)
  - Subtle vignette around the terminal display
- **Decorative elements**:
  - "CLASSIFIED" / "TOP SECRET" stamp watermarks
  - Mission ID and agent codename in a header bar
  - Redaction-bar styling on section dividers
  - Blinking status indicators (small CSS-animated dots)

### Layout

Two-column layout on desktop, stacked on mobile:

```
┌──────────────────────────────────────────────────────────┐
│  OPERATION READABLE — V.I.A. DECRYPTION TERMINAL         │
│  Agent: LUX  |  Mission ID: #RCQ-2026  |  CLASSIFIED    │
├────────────────────────────┬─────────────────────────────┤
│                            │                             │
│   ┌────────────────────┐   │   DECRYPTION CONTROLS       │
│   │                    │   │                             │
│   │   THE TERMINAL     │   │   ▸ Background Frequency    │
│   │   (Preview Area)   │   │     [R] [G] [B] sliders    │
│   │                    │   │                             │
│   │   Intercepted      │   │   ▸ Text Signal Amplifier   │
│   │   message text     │   │     [R] [G] [B] sliders    │
│   │   renders here     │   │                             │
│   │                    │   │   ▸ Magnification Level     │
│   └────────────────────┘   │     [Font size slider]      │
│                            │                             │
│   VISIBILITY METER         │   ▸ Enemy Cipher Filters    │
│   ┌────────────────────┐   │     (○) Cleartext           │
│   │ Contrast: 4.52:1   │   │     (○) Red Phoenix         │
│   │ ████████░░ gauge    │   │     (○) Green Viper         │
│   └────────────────────┘   │     (○) Blue Phantom         │
│                            │     (○) Total Blackout       │
│   LUMINANCE INTEL          │                             │
│   BG Signal: 0.2125       │   ▸ Known Transmissions      │
│   TX Signal: 0.8714       │     [Preset dropdown]        │
│                            │                             │
│   FIELD READABILITY        │                             │
│   PROTOCOL CHECK           │                             │
│   Standard: ✓ CLEARED     │                             │
│   Priority: ✓ CLEARED     │                             │
│                            │                             │
├────────────────────────────┴─────────────────────────────┤
│  V.I.A. — Visibility Intelligence Agency                 │
└──────────────────────────────────────────────────────────┘
```

---

## Core Features (Required)

### 1. The Terminal — Text Display Area

- A styled region resembling a CRT monitor or classified document viewer
- Displays sample intercepted message text, e.g.:
  > "The asset will arrive at checkpoint BRAVO at 0300 hours. Confirm receipt of package ECHO-7. Do not reply on unsecured channels."
- Text renders with the currently selected background color, text color, and font size
- **Atmosphere effects**:
  - Scanline overlay (semi-transparent repeating gradient)
  - When contrast ratio < 3:1, add a "static/glitch" CSS effect (noise, blur, or opacity flicker) suggesting the signal is too weak to decode
  - When contrast ratio ≥ 4.5:1, effects clear — message is "decoded"

### 2. Background Frequency Tuner — Background Color Controls

- Three range sliders (R, G, B) each 0–255
- Each slider has a synchronized numeric input field beside it
- Styled as frequency dials: slider tracks could have tick marks, amber/green colored fills
- **Label**: "BACKGROUND FREQUENCY" or "BG SIGNAL"
- Slider thumb styled as a dial knob or triangular marker
- Updating either the slider or input updates the other instantly + updates the terminal preview

### 3. Text Signal Amplifier — Text Color Controls

- Same structure as background controls: three R/G/B sliders with synced numeric inputs
- **Label**: "TEXT SIGNAL" or "TX AMPLIFIER"
- Distinct visual grouping from background controls (maybe different accent border color)
- Same sync behavior: slider ↔ input ↔ live preview

### 4. Magnification Level — Text Size Control

- Single range slider (suggested range: 8–72px, default 16px)
- Synced numeric input showing current value in px
- **Label**: "MAGNIFICATION" or "INTERCEPT ZOOM"
- Updates font size of the terminal preview text in real-time

### 5. Visibility Meter — Contrast Ratio Display

- Prominently displayed contrast ratio value in format `X.XX:1`
- Styled as a gauge, meter, or signal-strength bar
- Visual bar/gauge that fills proportionally (e.g., 1:1 = empty, 21:1 = full)
- Amber/green glow when ratio is good, red when poor

### 6. Luminance Intel — Luminosity Displays

- Two clearly labeled readouts:
  - **"BG Signal Luminance"**: relative luminance of the background color (0.0000–1.0000)
  - **"TX Signal Luminance"**: relative luminance of the text color (0.0000–1.0000)
- Displayed to 4 decimal places
- Styled as digital readout panels
- Helps the user understand that the contrast ratio is derived from these two values

### 7. Synchronization Behavior

- Slider → input field: immediate update
- Input field → slider: immediate update
- Any color/size change → preview updates in real-time
- Any color change → contrast ratio, luminance values, and WCAG compliance all recalculate immediately

### 8. Contrast Ratio Calculation (WCAG Formula)

```
Step 1: Convert each RGB channel (0-255) to sRGB (0-1):
  sR = R / 255, sG = G / 255, sB = B / 255

Step 2: Linearize each channel:
  if channel <= 0.04045: linear = channel / 12.92
  else: linear = ((channel + 0.055) / 1.055) ^ 2.4

Step 3: Calculate relative luminance:
  L = 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB

Step 4: Contrast ratio:
  ratio = (L_lighter + 0.05) / (L_darker + 0.05)
  where L_lighter = max(L_bg, L_text), L_darker = min(L_bg, L_text)

Step 5: Display as X.XX:1
```

---

## Stretch Features (All Three Included)

### A. Enemy Cipher Filters — Vision Type Simulation

A set of radio buttons styled as classified cipher protocols:

| Radio Label             | Vision Type   | Description                        |
| ----------------------- | ------------- | ---------------------------------- |
| Cleartext (Normal)      | Normal vision | No transformation applied          |
| Red Phoenix Cipher      | Protanopia    | Red-blind simulation               |
| Green Viper Cipher      | Deuteranopia  | Green-blind simulation             |
| Blue Phantom Cipher     | Tritanopia    | Blue-blind simulation              |
| Total Blackout Protocol | Monochromacy  | Complete color blindness simulation |

**Behavior**:
- When a cipher other than "Cleartext" is selected:
  - The terminal preview colors are transformed using the appropriate color vision simulation matrix
  - The RGB sliders and numeric inputs become **disabled/locked** (grayed out, cursor: not-allowed) with a label like "CONTROLS LOCKED — CIPHER ACTIVE"
  - The contrast ratio and luminance values update to reflect the *simulated* colors
- When "Cleartext" is re-selected, sliders unlock and original colors are restored
- Each cipher option has a small tooltip/info icon that reveals a brief explanation (e.g., "Simulates protanopia — red cone cells are non-functional")

**Color transformation matrices** (applied to linearized RGB, then converted back):

- **Protanopia**: Brettel 1997 or Viénot 1999 simulation matrix
- **Deuteranopia**: Corresponding deuteranopia matrix
- **Tritanopia**: Corresponding tritanopia matrix
- **Monochromacy**: Convert to grayscale using luminance weights (0.2126, 0.7152, 0.0722)

### B. Field Readability Protocol — WCAG Compliance Indicator

A status panel styled as a mission clearance badge / security check:

**Two indicators**:

1. **"Standard Transmission"** (normal text ≤ 18pt)
   - Threshold: contrast ratio ≥ 4.5:1
   - Pass: green glow + "✓ CLEARED" text
   - Fail: red glow + "✗ BLOCKED" text

2. **"Priority Broadcast"** (large text ≥ 18pt)
   - Threshold: contrast ratio ≥ 3:1
   - Pass: green glow + "✓ CLEARED" text
   - Fail: red glow + "✗ BLOCKED" text

**Styling**:
- Each indicator is a small card/badge with colored border (green/red)
- Blinking dot animation for the active status
- Always includes text labels alongside color (accessible to color-blind users — practicing what we preach)
- When both pass, an optional "TRANSMISSION APPROVED — FORWARD TO COMMAND" banner appears briefly

### C. Known Transmission Profiles — Preset Color Schemes

A dropdown or row of buttons styled as classified dossier tabs:

| Preset Name            | Background   | Text         | Purpose                      |
| ---------------------- | ------------ | ------------ | ---------------------------- |
| High Security          | #FFFFFF      | #000000      | Maximum contrast (21:1)      |
| Foggy Intercept        | #777777      | #999999      | Low contrast, fails WCAG     |
| Agency Standard        | #1a1a2e      | #e0e0e0      | Dark theme, good contrast    |
| Compromised Channel    | #FFFDE7      | #FFF9C4      | Yellow-on-yellow, fails WCAG |
| Dark Ops               | #0d0d0d      | #00ff41      | Hacker terminal green        |
| Embassy Cable          | #F5F5DC      | #333333      | Warm document style          |

**Behavior**:
- Selecting a preset immediately updates all 6 RGB sliders + numeric inputs, the preview, contrast ratio, luminance, and compliance indicators
- Resets cipher filter to "Cleartext" when a preset is loaded
- Each preset could show a tiny color swatch preview in the dropdown

---

## Interactions & Polish

### Micro-interactions
- Slider thumbs glow on hover/drag
- Numeric inputs flash briefly when updated by slider
- Contrast gauge animates smoothly (CSS transition) when value changes
- Compliance badges transition between green/red with a brief flash
- Terminal scanlines subtly animate (slow vertical scroll)

### Responsive Design
- Desktop: two-column layout as diagrammed above
- Tablet: controls stack below the terminal
- Mobile: fully stacked, sliders go full-width, terminal area remains prominent at top

### Accessibility (practicing what we preach)
- All controls have proper `<label>` elements
- Sliders have `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Compliance indicators use text labels, never color alone
- Keyboard navigable — tab order follows logical flow
- Focus styles visible on all interactive elements

---

## Sample Intercepted Messages

Rotate or randomize from a set:

1. "The asset will arrive at checkpoint BRAVO at 0300 hours. Confirm receipt of package ECHO-7. Do not reply on unsecured channels."
2. "PRIORITY — Operative FALCON has secured the documents. Extraction window closes at dawn. Ensure visibility protocol is active."
3. "All agents: verify your display terminals meet Field Readability Protocol before transmitting. Non-compliant channels will be terminated."
4. "Decoded intercept from SECTOR 9: The lighthouse signal changes at midnight. Adjust frequency to match new parameters."

---

## Tech Stack

- **Single HTML file** with embedded CSS and JS (or separate files — up to implementation preference)
- **No frameworks** — vanilla HTML, CSS, JavaScript
- **Google Fonts** loaded via CDN for typography
- **No build step** — deployable directly to GitHub Pages

---

## File Structure

```
/
├── index.html      (main page)
├── style.css       (styles, optional if inlined)
├── script.js       (logic, optional if inlined)
└── README.md       (project description)
```

---

## Definition of Done

- [ ] All 6 RGB sliders (3 bg + 3 text) work and sync with numeric inputs
- [ ] Text size slider works and syncs with numeric input
- [ ] Terminal preview updates in real-time for all controls
- [ ] Contrast ratio calculated correctly per WCAG formula and displayed as X.XX:1
- [ ] Background and text luminance values displayed
- [ ] Vision type simulation radio buttons transform preview colors and lock sliders
- [ ] WCAG compliance indicators show pass/fail for normal text (4.5:1) and large text (3:1)
- [ ] Preset color schemes load and update all controls/displays
- [ ] Responsive layout works on desktop, tablet, and mobile
- [ ] Spy theme is visually cohesive and polished
- [ ] All interactive elements are keyboard accessible with proper labels
