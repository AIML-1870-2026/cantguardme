# Science Experiment Generator — spec.md

## Project Overview

A single-page, LLM-powered web application that generates grade-appropriate science experiments based on user-selected grade level and available supplies. Built for GitHub Pages deployment as a single `index.html` file. Uses OpenAI's chat completions API exclusively (no Anthropic — browser CORS restriction).

**Audience:** Universal — K-12 students, teachers, parents. Must feel accessible to younger users while not being childish for older ones.

---

## Reference Implementation

The `temp/` folder contains the complete LLM Switchboard project (HTML, CSS, and JS files). This is **NOT** part of the current project — do not include it in the final build or deployment.

Use it as a reference for:
- How to parse a `.env` file for API keys (in-memory only)
- The `fetch()` call structure for OpenAI's chat completions API
- Error handling patterns for failed API requests
- How the code is organized across separate files
- The general approach to building a single-page LLM tool

**Ignore these Switchboard features (not needed here):**
- Anthropic integration (this project is OpenAI-only)
- The model selection dropdown / provider switching
- Structured output mode and JSON schema handling

This project uses **unstructured (free-form) responses only**. Render the model's markdown output as formatted HTML.

---

## Design & Aesthetic Direction

### Theme: Science Lab — Maximalist

Go hard on the science lab aesthetic. This should feel like stepping into a high-tech laboratory crossed with a neon-lit research station.

**Visual Language:**
- **Dark background** — deep navy/dark teal base (#0a1628 range)
- **Glowing neon accents** — electric cyan (#00f0ff), neon green (#39ff14), amber/warning orange (#ff9f1c) for highlights, borders, glows
- **Grid paper texture** — subtle graph-paper grid overlay on backgrounds
- **Formula doodles** — decorative chemistry formulas, molecular structures, or atom icons scattered as background elements (CSS/SVG)
- **Animated bubbling beakers** — CSS-animated beaker/flask SVGs with rising bubbles in the header or sidebar
- **Floating molecules** — slow-drifting particle/molecule animations in the background (CSS keyframes, keep performant)
- **Glassmorphism cards** — frosted glass panels with subtle backdrop-blur for content areas
- **Neon glow effects** — box-shadow glows on active/hover states, glowing borders on selected items

**Typography:**
- Display/headings: A bold, distinctive science-y font — something like Orbitron, Rajdhani, or Exo 2 (Google Fonts)
- Body text: Clean and readable — something like Source Sans 3 or IBM Plex Sans
- Monospace accents for labels/tags: JetBrains Mono or Fira Code

**Color Palette (CSS Variables):**
```css
--bg-primary: #0a1628;
--bg-secondary: #0f2035;
--bg-card: rgba(15, 32, 53, 0.85);
--accent-cyan: #00f0ff;
--accent-green: #39ff14;
--accent-orange: #ff9f1c;
--accent-purple: #b388ff;
--text-primary: #e8edf3;
--text-secondary: #8899aa;
--glass-border: rgba(0, 240, 255, 0.15);
--glow-cyan: 0 0 20px rgba(0, 240, 255, 0.3);
--glow-green: 0 0 20px rgba(57, 255, 20, 0.3);
```

**Motion & Animations:**
- Wizard step transitions: smooth slide + fade between cards (300-400ms ease)
- Bubbling beaker: looping CSS animation with rising circles
- Floating molecules: slow translateY + rotate drift (15-20s loop)
- Chip selection: scale bounce + glow pulse on tap
- Experiment result: typewriter-style reveal or fade-in sections
- Tab switches: crossfade between tab content
- Loading state: animated beaker filling / bubbling while waiting for API response

---

## Layout & Navigation

### Top-Level Navigation: Tabs
Three tabs across the top of the page:

1. **🧪 Generator** — the main wizard flow
2. **📚 Library** — saved experiments
3. **📝 Worksheets** — printable observation sheets

Tabs styled as lab-themed toggles with neon underline indicator on active tab. Smooth crossfade on switch.

### Generator Tab: Card-Based Wizard

A 3-step wizard with animated card transitions. Each step is a distinct card that slides/fades in. Progress indicator at the top (step dots or a beaker fill-level metaphor).

**Step 1 — Select Grade Level**
- Large, visually distinct clickable cards for each grade band:
  - **K-2** (icon: building blocks / crayons)
  - **3-5** (icon: magnifying glass)
  - **6-8** (icon: microscope)
  - **9-12** (icon: atom / DNA helix)
- Selecting a card highlights it with a neon glow and auto-advances to step 2 after a brief delay (~500ms)

**Step 2 — Select Supplies**
- **Predefined supply grid:** Draggable chips/tags organized by category. Each chip shows:
  - A real photo (from Google Custom Search or hardcoded URL for preset items)
  - The supply name
  - A small icon or thumbnail
  - Glow/highlight state when selected
- **Categories for preset supplies:**
  - 🧴 Liquids: water, vinegar, cooking oil, milk, dish soap, rubbing alcohol, lemon juice, food coloring
  - 🧂 Powders & Solids: baking soda, salt, sugar, flour, cornstarch, ice cubes, sand
  - 📦 Containers: plastic cups, glass jars, bowls, plastic bottles, zip-lock bags, aluminum foil, plastic wrap
  - 📏 Tools: ruler, measuring spoons, thermometer, magnifying glass, stopwatch, scissors, tape, string
  - 📄 Paper & Craft: paper towels, coffee filters, construction paper, balloons, rubber bands, straws, pipe cleaners, markers
  - 🔌 Misc: flashlight, batteries, magnets, candles, pennies, cotton balls, sponges
- **Custom supply input:** A text field at the bottom where users can type in additional supplies not in the preset list. Typed supplies get added as new chips with images fetched from Google Custom Search API.
- **Selected supplies tray:** A horizontal scrollable bar at the bottom of step 2 showing all currently selected chips. Chips can be removed by clicking X.
- "Next" button to proceed to step 3.

**Step 3 — Generate**
- Summary card showing selected grade level + selected supplies (as mini chips)
- Large "🧪 Generate Experiment" button with glow animation
- On click: animated loading state (bubbling beaker animation) while API call runs
- Result area: rendered markdown experiment with:
  - Experiment title
  - Difficulty rating badge (Easy / Medium / Hard — color coded green/orange/red)
  - Materials list (with substitution suggestions inline)
  - Step-by-step procedure
  - Scientific explanation (age-appropriate)
  - Expected results
  - Safety notes (if applicable)
  - Substitution section: "Don't have X? Try Y instead."
- Action buttons below the result:
  - **💾 Save to Library** — saves to localStorage
  - **🖨️ Print Worksheet** — opens printable version
  - **🔄 Generate Another** — re-runs with same inputs
  - **↩️ Start Over** — returns to step 1

---

## Feature Specifications

### 1. Supply Images (Google Custom Search)

**Implementation:**
- **Preset supplies:** Hardcode reliable image URLs for all ~40 preset supply items. These are curated for accuracy — no API call needed. Source images at build time, use permanent URLs or small base64 thumbnails.
- **Custom supplies:** When a user types a custom supply, query Google Custom Search JSON API to fetch a relevant image.
- **Search query format:** `"{supply name}" household supply photo` — append context to improve accuracy.
- **Fallback:** If the API call fails or returns no results, show a generic beaker/supply icon placeholder.
- **Image display:** Small square thumbnails (~60x60px) on each chip, with `object-fit: cover` and rounded corners.
- **Caching:** Cache fetched image URLs in a session-level object to avoid redundant API calls for the same supply.

**API Setup:**
- Requires `GOOGLE_API_KEY` and `GOOGLE_CX` (Custom Search Engine ID) in `.env`
- Endpoint: `https://www.googleapis.com/customsearch/v1?q={query}&searchType=image&num=1&key={key}&cx={cx}`
- Free tier: 100 queries/day (sufficient for class project)

### 2. Saved Experiments Library

**Storage:** `localStorage` under key `sciExpGenLibrary`

**Data structure per saved experiment:**
```json
{
  "id": "uuid-timestamp",
  "title": "Experiment Title",
  "gradeLevel": "3-5",
  "difficulty": "Medium",
  "supplies": ["water", "baking soda", "vinegar"],
  "markdownContent": "...",
  "htmlContent": "...",
  "timestamp": 1713100000000,
  "favorite": false
}
```

**Library Tab UI:**
- Grid of experiment cards, each showing: title, grade level badge, difficulty badge, date saved, first ~100 chars preview
- Click a card to expand and view the full experiment
- Favorite toggle (star icon) for pinning experiments
- Delete button with confirmation
- Sort options: newest first, favorites first, by grade level
- Search/filter bar
- "Clear All" with confirmation modal
- Empty state: friendly message encouraging the user to generate their first experiment

### 3. Difficulty Ratings

**Implementation:** The system prompt instructs the LLM to include a difficulty rating in a parseable format at the top of its response.

**Prompt instruction:** Include `[DIFFICULTY: Easy|Medium|Hard]` as the first line.

**Display:**
- Parsed from the response before rendering
- Shown as a color-coded badge:
  - 🟢 Easy — green glow
  - 🟡 Medium — amber/orange glow
  - 🔴 Hard — red glow
- Badge appears next to the experiment title

### 4. Supply Substitution

**Implementation:** Handled within the LLM prompt — the system message instructs the model to include a "Substitutions" section at the end of every experiment, suggesting alternatives for each supply used.

**Prompt instruction:** "At the end of the experiment, include a 'Substitutions' section. For each material used, suggest 1-2 common household alternatives that could work."

**Display:** Rendered as part of the markdown output, styled with a distinct background card or callout box so it visually separates from the main procedure.

### 5. Printable Worksheets

**Worksheets Tab UI:**
- Select a saved experiment from a dropdown or generate fresh
- "Print Worksheet" button

**Printed worksheet layout (triggered via `window.print()` with `@media print` styles):**
- Clean white background, black text, no neon effects
- Experiment title + date + grade level
- Materials checklist (checkboxes)
- Step-by-step procedure (numbered)
- Blank sections with lines for student to fill in:
  - **Hypothesis:** "I think ______ will happen because ______"
  - **Observations:** (lined space)
  - **Data Table:** (empty grid, 4 columns x 6 rows)
  - **Results:** (lined space)
  - **Conclusion:** "My hypothesis was (supported / not supported) because ______"
  - **Further Questions:** (lined space)
- Footer: "Generated by Science Experiment Generator"

### 6. Predefined Common Supplies

Full preset list organized by category (see Step 2 above). Approximately 40-50 items covering the most common household supplies used in K-12 science experiments. Each has:
- Display name
- Category
- Hardcoded image URL (curated for accuracy)
- Optional emoji icon fallback

---

## API Integration

### OpenAI Chat Completions

**Endpoint:** `https://api.openai.com/v1/chat/completions`

**Model:** `gpt-4o-mini` (fast, cheap, good enough for experiment generation). Allow fallback to `gpt-4o` if desired — can be a hidden config or hardcoded.

**Request structure:**
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.8,
    max_tokens: 2000
  })
});
```

**System Prompt:**
```
You are a K-12 science experiment designer. You create safe, educational, hands-on science experiments using common household materials.

When given a grade level and a list of available supplies, generate ONE complete experiment.

Format your response in markdown as follows:

[DIFFICULTY: Easy|Medium|Hard]

# {Experiment Title}

## Overview
A 2-3 sentence description of what this experiment demonstrates.

## Materials Needed
- List each material with quantity

## Safety Notes
- List any safety precautions (if none, say "No special safety precautions needed for this experiment.")

## Procedure
1. Numbered step-by-step instructions
2. Be specific and clear
3. Appropriate for the grade level

## What's Happening? (The Science)
Explain the scientific principles in age-appropriate language for the specified grade level.

## Expected Results
Describe what the student should observe.

## Substitutions
For each material used, suggest 1-2 common household alternatives:
- {Material}: Can substitute with {Alternative 1} or {Alternative 2}

Tailor vocabulary, complexity, and explanation depth to the grade level:
- K-2: Simple words, 5-8 steps max, focus on observation and wonder
- 3-5: Introduce basic scientific terms, 6-10 steps, simple cause-and-effect
- 6-8: Use proper scientific terminology, can include measurement and data collection, explain underlying mechanisms
- 9-12: Advanced concepts, precise measurements, hypothesis-driven, connect to broader scientific principles
```

**User Prompt Construction:**
```
Grade Level: {selectedGrade}
Available Supplies: {comma-separated list of selected supplies}

Generate a fun, engaging science experiment using ONLY the supplies listed above (plus common items like water or basic utensils that any household would have). Make it hands-on and exciting!
```

### Google Custom Search (Images)

**Endpoint:** `https://www.googleapis.com/customsearch/v1`

**Parameters:**
- `q`: `"{supply name}" household supply` 
- `searchType`: `image`
- `num`: `1`
- `imgSize`: `small`
- `safe`: `active`
- `key`: from `.env`
- `cx`: from `.env`

### .env File Format
```
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
GOOGLE_CX=a1b2c3...
```

**Parsing:** Same in-memory `.env` parsing pattern as the Switchboard. Load via fetch, parse key=value pairs, store in a JS object. Never persisted, never exposed.

---

## Technical Requirements

### Single-File Deployment
- Everything in one `index.html` — HTML structure, CSS (in `<style>`), JS (in `<script>`)
- External CDN dependencies only:
  - **marked.js** — markdown to HTML rendering (`https://cdn.jsdelivr.net/npm/marked/marked.min.js`)
  - **DOMPurify** — sanitize rendered HTML (`https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js`)
  - **Google Fonts** — Orbitron + Source Sans 3 + JetBrains Mono (or chosen alternatives)
- No build step, no Node.js server at runtime — pure client-side
- Deployable to GitHub Pages as-is

### Markdown Rendering
- Use `marked.js` to convert LLM response from markdown to HTML
- Sanitize output with DOMPurify before inserting into DOM
- Style rendered HTML to match the lab theme (headings, lists, code blocks, etc.)

### Error Handling
- Missing `.env` file: show friendly setup instructions
- Invalid/missing API keys: specific error message per key
- API call failure (network, rate limit, etc.): show error card with retry button
- Empty supplies selection: prevent advancing to step 3
- Google Image search failure: graceful fallback to placeholder icon
- localStorage full/unavailable: warn user, disable save feature gracefully

### Responsive Design
- Desktop-first but functional on tablet and mobile
- Wizard cards stack vertically on narrow screens
- Supply chips reflow into scrollable grid on mobile
- Tabs remain accessible on all screen sizes

### Accessibility
- Keyboard navigable (tab through chips, enter to select)
- ARIA labels on interactive elements
- Sufficient color contrast (neon on dark = generally good, but verify)
- Screen reader friendly tab navigation
- Focus indicators that match the neon glow theme

### Performance
- Background animations use CSS `transform` and `opacity` only (GPU composited)
- Throttle/debounce Google Image API calls on custom supply input
- Lazy-load preset supply images (intersection observer or on step 2 entry)
- Keep total page weight reasonable despite single-file approach

---

## File Organization (Development)

During development with Claude Code, use separate files for clarity:
```
project/
├── index.html          ← main HTML structure
├── style.css           ← all styles including animations, print styles
├── app.js              ← all JavaScript (wizard logic, API calls, localStorage, etc.)
├── .env                ← API keys (gitignored)
├── .gitignore          ← .env, temp/
├── spec.md             ← this file
├── README.md           ← project description, setup instructions
└── temp/               ← LLM Switchboard reference (not deployed)
    ├── index.html
    ├── style.css
    └── script.js
```

**For final deployment:** Combine into a single `index.html` with inlined `<style>` and `<script>` blocks, or keep as separate files if serving from a basic web server. GitHub Pages can serve multi-file projects just fine — single-file is a nice-to-have, not a hard requirement.

---

## Summary of All Features

| Feature | Priority | Implementation |
|---|---|---|
| Grade level selection | Core | Wizard step 1, clickable cards |
| Supply selection (preset) | Core | Wizard step 2, draggable chips with images |
| Supply selection (custom) | Core | Text input → new chip with Google Image |
| Experiment generation | Core | OpenAI API call, markdown → HTML |
| Supply images (preset) | Stretch | Hardcoded curated image URLs |
| Supply images (custom) | Stretch | Google Custom Search API |
| Saved experiments library | Stretch | localStorage, Library tab |
| Difficulty ratings | Stretch | Parsed from LLM response, color-coded badge |
| Supply substitutions | Stretch | Included in LLM prompt, styled callout |
| Printable worksheets | Stretch | @media print styles, blank fields |
| Predefined supply list | Stretch | ~40-50 common items, categorized |

---

## Development Notes for Claude Code

- Reference the `temp/` folder for patterns — especially `.env` parsing, `fetch()` structure, and error handling.
- This is OpenAI-only. No Anthropic API calls.
- Responses are unstructured markdown — no JSON schema mode.
- Use `marked.js` + `DOMPurify` for safe markdown rendering.
- The science lab theme is maximalist — go hard on animations, glows, and atmosphere. Don't hold back.
- Test the wizard flow end-to-end: grade select → supply pick → generate → view result → save → view in library → print worksheet.
- The `[DIFFICULTY: ...]` tag must be parsed and stripped from the displayed markdown.
