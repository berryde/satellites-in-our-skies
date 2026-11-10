---
name: The Satellites in Our Skies
description: Every payload in Earth orbit since 1957, on a 3D globe you can scrub through time.
colors:
  space: "#02030a"
  leo: "#5eead4"
  meo: "#fbbf24"
  geo: "#f472b6"
  elliptical: "#a78bfa"
  atmosphere: "#4f8cff"
  marker: "#ffffff"
  text: "#e5e7eb"
  text-muted: "oklch(70.7% 0.022 261.325)"
  text-faint: "oklch(55.1% 0.027 264.364)"
  live: "oklch(80.8% 0.114 19.571)"
  live-on: "oklch(70.4% 0.191 22.216)"
  slider-accent: "oklch(85.5% 0.138 181.071)"
  menu-surface: "oklch(21% 0.034 264.665)"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "tnum"
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "-0.025em"
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.429
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.333
  caption:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "4px"
  panel: "12px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
components:
  panel-timeline:
    backgroundColor: "rgb(0 0 0 / 0.6)"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "12px"
    width: "min(40rem, calc(100% - 2rem))"
  panel-details:
    backgroundColor: "rgb(0 0 0 / 0.7)"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "16px"
    width: "min(20rem, calc(100% - 2rem))"
  button-control:
    backgroundColor: "rgb(255 255 255 / 0.1)"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  button-control-hover:
    backgroundColor: "rgb(255 255 255 / 0.2)"
  button-live:
    textColor: "{colors.live}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  button-live-hover:
    backgroundColor: "rgb(255 255 255 / 0.1)"
  button-live-on:
    textColor: "{colors.live-on}"
  select-speed:
    backgroundColor: "rgb(255 255 255 / 0.1)"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  legend-row:
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "2px 4px"
    width: "11rem"
  legend-row-hover:
    backgroundColor: "rgb(255 255 255 / 0.1)"
  hover-label:
    backgroundColor: "rgb(0 0 0 / 0.75)"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
---

# Design System: The Satellites in Our Skies

## Overview

**Creative North Star: "The Night Observatory"**

You are looking out at the sky in the dark. The globe fills the whole window, and the satellites moving around it are the view. Everything else is a handful of dim instrument readouts set at the edges of the glass: a title and a count in the top-left, a timeline along the bottom, and a details card that appears top-right only when a satellite is picked. Nothing sits over the middle of the view.

The mood is awe-inducing and approachable at once. The awe comes from the data, from tens of thousands of real points in motion and a number that climbs as the timeline plays, and never from decoration added on top. The approachability comes from plain language and familiar controls: a Play button that says "Play", a native slider, a native dropdown, words where an expert tool would use symbols. A visitor who has never heard of an orbital element should feel invited in.

The system is small and unbranded on purpose. It uses the device's own sans-serif, one near-black ground, four colours that each mean one orbit class, and a few translucent panels. The panel treatment in particular (flat translucent black with a background blur) is the current state, not a commitment; later work may change it.

**Key Characteristics:**
- The globe is full-bleed and always visible; the interface occupies the corners and the bottom edge.
- Colour carries meaning: the four orbit-class colours are the only saturated colours that belong to the data.
- System sans-serif throughout, with tabular figures on every number that changes.
- Dark only. There is no light theme.
- Native form controls (range slider, select), lightly tinted.
- Plain words on every control and label.

## Colors

A near-black ground and cool grey text, so that four bright orbit colours and the Earth's own city lights are the only things that glow.

### Primary
- **Low Orbit Teal** (`leo`): the first orbit class, low Earth orbit, and by far the most numerous points on screen. A close tint of it (`slider-accent`) colours the date slider, the only place a data colour is borrowed by a control.

### Secondary
- **Medium Orbit Amber** (`meo`): the second orbit class.
- **Geostationary Pink** (`geo`): the third orbit class, the distant ring far out from the globe.
- **Elliptical Violet** (`elliptical`): the fourth orbit class.

Each appears in exactly three places: the points on the globe, the dot beside the class name in the legend, and the dot under a selected satellite's name.

### Tertiary
- **Live Signal Red** (`live`, and the stronger `live-on` while live): the "Go live" control and its "● Live" state, and the data-loading error message. It marks the present moment and nothing else.
- **Atmosphere Blue** (`atmosphere`): the glow around the Earth's limb, drawn by the globe at 0.18 of the globe's radius. It exists only in the 3D scene.

### Neutral
- **Deep Space** (`space`): the page and scene background, and the browser theme colour.
- **Starlight Grey** (`text`): all primary text.
- **Dim Grey** (`text-muted`): subtitles, legend counts, and the labels in the details list.
- **Faint Grey** (`text-faint`): the attribution footer only.
- **Marker White** (`marker`): the rings around a hovered (80% opacity) or selected (100%) satellite, and the selected satellite's orbit line (45% opacity).
- **Menu Slate** (`menu-surface`): the background of the speed dropdown's option list.

Panels and controls are not separate colours. Panels are black at 60 to 75% opacity over the scene; control fills and hover states are white at 10% and 20%.

### Named Rules
**The Four Orbits Rule.** Teal, amber, pink, and violet each mean one orbit class. They are not available as general accents, and a fifth saturated colour needs a fifth thing to mean.

**The Mirror Rule.** The orbit colours are defined twice: as `--color-*` theme tokens in `src/index.css` and as the `ORBIT_COLORS` array in `src/App.tsx` that feeds the shader. Change both together.

## Typography

**Display Font:** the system sans-serif (`ui-sans-serif, system-ui, sans-serif`)
**Body Font:** the same
**Label/Mono Font:** none; numbers use tabular figures in the same face

**Character:** No typeface is loaded. The text takes on whatever the visitor's device already uses, which keeps it familiar, costs nothing to load, and leaves the personality to the globe.

### Hierarchy
- **Display** (600, 1.875rem, tabular figures): the live count of satellites in orbit. The largest text on screen is a number, not the title.
- **Headline** (600, 1.25rem below 640px and 1.5rem above, -0.025em tracking): the page title.
- **Title** (600, 1rem): the selected satellite's name in the details card.
- **Body** (400, 0.875rem): everything else: subtitle, legend rows, timeline controls, details list. Secondary text at this size is set in Dim Grey.
- **Label** (400, 0.75rem): the name that follows the pointer over a satellite.
- **Caption** (400, 10px, Faint Grey): the data attribution footer.

### Named Rules
**The Steady Numbers Rule.** Any figure that updates while time plays (the count, the per-class counts, the date and time, the details values) uses tabular figures so it does not jitter.

**The Two Weights Rule.** Only 400 and 600 are used. Emphasis comes from size and from the grey steps, not from more weights.

## Layout

One full-viewport stage with no page scroll. The globe is an absolutely positioned layer filling the window, and each interface group is pinned to an edge on top of it:

- **Top-left:** title and subtitle, with the count and legend stacked directly beneath (offset 5rem from the top, 6rem above 640px).
- **Bottom-centre:** the timeline panel, centred, `min(40rem, 100% - 2rem)` wide, 24px from the bottom (32px above 640px).
- **Top-right:** the details card, `min(20rem, 100% - 2rem)` wide, present only while a satellite is selected.
- **Bottom-right:** the attribution footer, 8px from the corner.

The edge inset is 16px, growing to 24px at the single breakpoint (640px). Inside panels the rhythm is tight: 8px gaps between controls, 4px between list rows, 12 to 16px panel padding. The timeline's controls wrap onto a second line when the panel is narrow. The header does not capture pointer events, so the globe can be dragged through it.

The opening view looks at 25°N, 30°W from 2.6 globe radii. The camera can pull back far enough to take in the geostationary ring.

## Elevation & Depth

There are no shadows and no borders. Depth has two sources. The first is real: the 3D scene itself, where the Earth hides the satellites behind it and the atmosphere glows at its edge. The second is translucency: panels are black at 60 to 75% opacity with a background blur, so the globe stays faintly visible through them and they read as glass in front of the view.

Title, count, legend, and footer have no panel at all; they sit directly on the scene.

This panel treatment is provisional. It records what is built today and may be replaced.

## Shapes

Two corner sizes and a circle. Panels have gently rounded corners (12px). Controls, legend rows, and the hover label have slight ones (4px). Circles are reserved for the data: satellite points are soft-edged discs, the legend dots are circles, and the hover and selection markers are thin rings (18px and 24px across).

## Components

No transitions are defined; hover and state changes are immediate. The only motion is the scene itself. No custom focus styles are defined either, so keyboard focus uses the browser's default ring.

### Buttons
- **Shape:** slight corners (4px), 4px by 8px padding, body text.
- **Control (Play / Pause):** white at 10% fill, fixed 4rem width so the label change does not shift the row. Hover raises the fill to 20%.
- **Go live:** no fill, Live Signal Red text at medium weight (500); hover adds a white 10% fill. Once live it is disabled, reads "● Live" in the stronger red, and has no hover.
- **Close (details card):** a bare "×" in Dim Grey; hover turns it white on a white 10% fill.

### Legend rows
- **Style:** each row is a toggle button, 11rem wide: a 10px colour dot, the class name, and its current count right-aligned in Dim Grey with tabular figures.
- **State:** hover adds a white 10% fill. Switched off (`aria-pressed="false"`), the whole row drops to 40% opacity and that class disappears from the globe.

### Cards / Containers
- **Timeline panel:** black at 60% with background blur, 12px corners, 12px padding. One row of controls (Play/Pause, the current date and time in UTC, speed, Go live) above a full-width date slider.
- **Details card:** black at 70% with background blur, 12px corners, 16px padding. Name, then an orbit-class line with an 8px colour dot, then a two-column list: Dim Grey label on the left, value on the right.
- **Hover label:** black at 75%, 4px corners, 4px by 8px padding, label text, one line. It follows the pointer at a 14px offset and ignores pointer events.
- **Shadow / Border:** none (see Elevation & Depth).

### Inputs / Fields
- **Date slider:** a native range input spanning 4 October 1957 to now in one-day steps, full panel width, tinted with the slider accent.
- **Speed select:** a native select with the same fill, corners, and padding as a control button. Its option list uses Menu Slate.

### Globe markers
- **Satellite point:** a disc 2.5px across (scaled by device pixel ratio, capped at 2x) with a soft edge, in its orbit-class colour. Points never hide each other; the Earth hides those behind it.
- **Hover ring:** a white ring 18px across at 80% opacity; the cursor becomes a pointer.
- **Selection:** a white ring 24px across at full opacity, plus the satellite's orbit drawn as a white line at 45% opacity.

## Do's and Don'ts

### Do:
- **Do** keep the centre of the viewport clear. Interface belongs at the edges and corners, on top of a globe that always fills the window.
- **Do** use the four orbit colours only for their orbit class, and pair each with its name wherever it appears outside the globe.
- **Do** set every changing number in tabular figures.
- **Do** label controls with plain words ("Play", "Go live", "satellites in orbit") and show times in UTC.
- **Do** keep panels narrow enough to fit a phone: `min(width, 100% - 2rem)`.
- **Do** update `src/index.css` and `ORBIT_COLORS` in `src/App.tsx` together when an orbit colour changes.

### Don't:
- **Don't** add a saturated colour that does not stand for something in the data. Red already means "now".
- **Don't** treat the translucent blurred panel as fixed. It is the current treatment and is open to change.
- **Don't** add interface motion that competes with the scene; the satellites are the animation.
- **Don't** add a light theme. The night-side Earth and the point colours depend on the dark ground.
