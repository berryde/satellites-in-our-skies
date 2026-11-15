---
name: The Satellites in Our Skies
description: Every satellite put into Earth orbit since 1957, on a 3D globe you can play through time.
colors:
  space: "#02030a"
  leo: "#5eead4"
  meo: "#fbbf24"
  geo: "#f472b6"
  elliptical: "#a78bfa"
  atmosphere: "#4f8cff"
  ember: "#ff8a3d"
  marker: "#ffffff"
  text: "#e5e7eb"
  text-muted: "oklch(70.7% 0.022 261.325)"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
    fontVariation: "wdth 80"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.06em"
    fontVariation: "wdth 125"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    fontVariation: "wdth 112.5"
  statement:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 300
    lineHeight: 1.375
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.429
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.333
  caption:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.1em"
    fontFeature: "tnum"
rounded:
  control: "3px"
  panel: "6px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  plate:
    backgroundColor: "rgb(2 3 10 / 0.55)"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "16px"
  plate-popover:
    backgroundColor: "rgb(2 3 10 / 0.9)"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "12px"
    width: "min(24rem, calc(100% - 2rem))"
  details-card:
    backgroundColor: "rgb(2 3 10 / 0.55)"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "16px"
    width: "min(20rem, calc(100% - 2rem))"
  button-start:
    backgroundColor: "{colors.marker}"
    textColor: "{colors.space}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "0 24px"
    height: "48px"
  button-start-hover:
    backgroundColor: "rgb(255 255 255 / 0.85)"
  button-capsule:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  button-capsule-hover:
    backgroundColor: "rgb(255 255 255 / 0.1)"
  button-capsule-on:
    backgroundColor: "rgb(255 255 255 / 0.1)"
  button-transport:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    size: "44px"
  button-control:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  button-control-hover:
    backgroundColor: "rgb(255 255 255 / 0.1)"
  button-quiet:
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "rgb(255 255 255 / 0.1)"
  button-quiet-disabled:
    textColor: "{colors.text-muted}"
  speed-capsule:
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    height: "44px"
  input-search:
    backgroundColor: "rgb(255 255 255 / 0.05)"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 44px 0 12px"
    height: "44px"
  legend-row:
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "2px 4px"
    width: "14rem"
  legend-row-hover:
    backgroundColor: "rgb(255 255 255 / 0.1)"
  timeline-playhead:
    backgroundColor: "{colors.marker}"
    rounded: "{rounded.full}"
    width: "3px"
  timeline-moment:
    backgroundColor: "{colors.space}"
    rounded: "{rounded.full}"
    size: "10px"
  timeline-moment-passed:
    backgroundColor: "{colors.marker}"
    rounded: "{rounded.full}"
    size: "10px"
  hover-label:
    backgroundColor: "rgb(2 3 10 / 0.55)"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
---

# Design System: The Satellites in Our Skies

## Overview

**Creative North Star: "The Night Observatory"**

You are looking out at the sky in the dark. The globe fills the whole window, and the satellites moving around it are the view. Everything else is a handful of dim instrument readouts set at the edges of the glass: a title, a count and a legend in the top-left, two tools in the top-right, a timeline along the bottom, and a details card that appears only when a satellite is picked. Words are kept to a minimum; the visualisation does the talking. Nothing sits over the middle of the view.

The mood is awe-inducing and approachable at once. The awe comes from the data, from tens of thousands of real points in motion and a number that climbs as the timeline plays, and never from decoration added on top. The approachability comes from plain language and familiar controls: a Play button that says "Play", orbit classes called "Low orbit" and "High orbit". A visitor who has never heard of an orbital element should feel invited in.

The instruments are few and plainly made: smoked-glass plates, hairline capsules, a ruled timeline told like a broadcast's telemetry, and one typeface, Archivo, whose width does the work of hierarchy: the title engraved in wide capitals, the counts and the date narrow light readouts, the timeline's labels small spaced capitals. The timeline is the one authored instrument, because the whole history, playable, is what this product has that nothing else does. It draws seventy years of satellites in orbit as a single shape in the four orbit colours. The page opens on today's sky and one number, then plays that history from Sputnik when the visitor asks. Everything else stays quiet: the same face at its normal width for every control, one near-black ground, and four colours that each mean one orbit class.

**Key Characteristics:**
- The globe is full-bleed and always visible; the interface occupies the corners and the bottom edge. Quantity lives top-left (the count and legend); time lives bottom-centre (the moment, the date, the timeline).
- The timeline is the signature: a custom track showing the history as a stacked curve, with a playhead and named moments.
- Colour carries meaning: the four orbit-class colours are the only saturated colours in the interface.
- One family, Archivo (self-hosted, variable in weight and width): wide engraved capitals for the title, narrow light figures for the readouts, normal width for everything else, with steady figures on every number that changes.
- Light adds up: satellite points are drawn additively, so a crowded shell glows and a lone satellite is a spark.
- Dark only. There is no light theme.
- Plain words on every control and label, and a plain statement of what is real and what is illustrative.

## Colors

A near-black ground and cool grey text, so that four bright orbit colours and the Earth's own city lights are the only things that glow.

### Primary
- **Low Orbit Teal** (`leo`): the first orbit class, low orbit, and by far the most numerous points on screen.

### Secondary
- **Medium Orbit Amber** (`meo`): the second orbit class.
- **High Orbit Pink** (`geo`): the third orbit class, the distant ring far out from the globe. The token keeps the data's name for the class.
- **Elliptical Violet** (`elliptical`): the fourth orbit class.

Each appears in exactly five places: the points on the globe, the dot beside the class name in the legend, the dot under a selected satellite's name, the dot beside a search result, and that class's band in the timeline curve.

### Tertiary
- **Atmosphere Blue** (`atmosphere`): the glow around the Earth's limb, drawn by the globe at 0.18 of the globe's radius. It exists only in the 3D scene.
- **Ember Orange** (`ember`): a satellite burning up on re-entry, for under a second. It exists only in the 3D scene and means nothing else.

### Neutral
- **Deep Space** (`space`): the page and scene background, the browser theme colour, the fill of a timeline moment still to come, the text on the white start button, and the night that deepens behind the words along the top-left and the bottom edge.
- **Starlight Grey** (`text`): all primary text.
- **Dim Grey** (`text-muted`): the second line of the title card, legend counts, short names, the "where" line in the details card, labels in the details list, the time of day beside the date, timeline year labels, the data credit and the author line in About, the honesty note, "Reset view" at rest, and a disabled control.
- **Marker White** (`marker`): the rings around a hovered (80% opacity) or selected (100%) satellite, the selected satellite's orbit line (30% opacity), its trail, the timeline playhead, the timeline moments (filled once passed), the finale's lit dots, keyboard focus outlines (80% opacity), and the one filled button on the page, "Watch them arrive".

Panels and controls are not separate colours. Plates are Deep Space at 55% over a blur (90% for popovers) with a white 12% hairline; controls are a white hairline (24% on the tools, 20 to 30% on capsules) that fills white 10% on hover; the dimmed backdrop behind a popover is black at 50%.

### Named Rules
**The Four Orbits Rule.** Teal, amber, pink, and violet each mean one orbit class. They are not available as general accents, and a fifth saturated colour needs a fifth thing to mean. No control borrows one: the playhead is white.

**The Mirror Rule.** The orbit colours are defined twice: as `--color-*` theme tokens in `src/index.css` and as the `ORBIT_COLORS` array in `src/App.tsx` that feeds the shader, the legend, the search results and the timeline curve. Change both together.

**The White Is Here Rule.** White marks where you are: the satellite you picked, the moment the playhead is on, the control that has keyboard focus. It is not used for decoration.

## Typography

**Font:** Archivo Variable (`--font-sans`), self-hosted from `@fontsource-variable/archivo` with its weight (100 to 900) and width (62% to 125%) axes. Every piece of text is set in it.
**Label/Mono Font:** none; numbers use Archivo's tabular figures

**Character:** An instrument, not an editorial page. Archivo is a grotesk drawn for both display and text, and its width axis lets one family carry the whole hierarchy: the title is set wide in spaced capitals like the engraving on an instrument's plate, the count narrow and light like a readout, and everything else at normal width.

### Hierarchy
- **Readout** (`readout` utility, the `display` token: weight 300, width 80%, tabular figures, -0.02em tracking, line-height 1): the running count of satellites in orbit (3rem on compact screens, 3.75rem on a phone, 4.5rem above 640px), the title card's count (6.5rem on a phone, 9rem from tablet, 4.5rem on a short screen), the finale's figure (3rem; 3.75rem from tablet) and the date in the time controls (2rem on a phone, 2.5rem above). There is no separate year readout: the date carries the year. The largest text on screen is always a number, never the title.
- **Engraved** (`engraved` utility, the `headline` token: weight 600, width 125%, capitals, 0.06em tracking; 0.75rem on a phone so it holds one line beside the tools, 1.125rem above): the page title, and nothing else.
- **Name** (the `title` token: 600, width 112.5%, 1.25rem; 1.125rem on a phone): the selected satellite's name in the details card.
- **Statement** (300, 1.25rem on a phone, 1.5rem from tablet): the title card's line beneath its count. The finale's sentence sits beside its figure in Body (1rem from tablet).
- The search box types at 1rem (weight 400) so phones do not zoom into it; the moment the sweep has reached is named at 1.125rem (1.25rem from tablet).
- **Body** (400, 0.875rem): everything else: legend rows, the speed, capsules and tools, details list, popover text. Secondary text at this size is set in Dim Grey. Panel headings ("Find a satellite", "About") are Body at weight 600.
- **Label** (400, 0.75rem): the honesty note in the details card, the "Faint points" note, search status text, the "Suggestions" line, and the name that follows the pointer over a satellite.
- **Caption** (`caps` utility, the `caption` token: 500, 0.625rem, capitals at normal width, 0.1em tracking, tabular figures): telemetry labels, as a broadcast labels its readouts: the moment flags, the caption above the timeline, the year labels under it, the UTC time under the date, and the readout labels in the phone's details summary.

### Named Rules
**The Steady Numbers Rule.** Any figure that updates while time plays (the count, the per-class counts, the date and time, the details values, the timeline caption, the title card's climbing count) uses tabular figures so it does not jitter.

**The Width Is Hierarchy Rule.** Rank comes from width and size, not from more faces. Wide capitals are for the title only; the narrow light readout is for the counts, the finale's figure and the date only; small spaced capitals at normal width (Caption) are for the labels on the timeline and on readouts only. Weights are 300 (readouts and the statement), 400, 500 (Captions and the start button) and 600.

## Layout

One full-viewport stage with no page scroll. The globe is an absolutely positioned layer filling the window, and each interface group is pinned to an edge on top of it:

- **Top-left:** one stacked column: title, then the count and the legend. Only the legend rows take the pointer, so the globe can be dragged through the rest. The header keeps clear of the tools on its right.
- **Top-right:** the tools, in one row level with the title: "Reset view" (quiet, once the camera has been moved), "Find a satellite" (a control button with a drawn lens; the lens alone on a phone) and About (a drawn "i" in a control button of the same height). About opens the honesty note, the data credit and the author line ("Made by Dan Berry · berryde.com", the link underlined at white 40%, white on hover, to the site's home page in the same tab) in a popover. There is no credit line along the bottom, and no byline elsewhere on the page. The tools are 36px tall on the same edge inset as the title (16px, 24px from 640px), centred on the title's line; on touch an invisible 4px margin round each makes it 44px to the finger without making it heavier to the eye.
- **Bottom-centre:** the time controls and the timeline, `min(48rem, 100% - 2rem)` wide, set straight on the scene with no panel: the night deepens along the whole bottom edge behind them (Deep Space from 95% at the edge to nothing about 5rem up), as it does behind the title.
- **Right, under the tools:** the details card, `min(20rem, 100% - 2rem)` wide, present only while a satellite is selected.

The edge inset is 16px, growing to 24px at 640px. The top-left column is spaced 24px between title, count and legend. Inside a group the rhythm is tight (8px between controls, 4px between list rows, 16px plate padding); between groups it opens out: on a phone the date row, the speed capsule and the timeline sit about 28 to 32px apart, so the UTC line hanging under the date never crowds the capsule.

There are three arrangements:

- **Wide** (at least 1152px wide and 520px tall): as above.
- **Compact** (narrower than 640px, or shorter than 520px): the details of a selected satellite take the time controls' place, and they return when the card is closed.
  - On a phone held upright, the details card is a sheet along the bottom (a summary that opens to at most 60% of the viewport, scrolling inside), the legend becomes one row of four cells (a dot and count over a short name: "Low", "Medium", "High", "Elliptical"; the full name is still what a screen reader hears) and steps aside while the sheet is open, and the "Faint points" note is dropped.
  - On a phone on its side the legend is the same cells two by two, at most 16rem wide, and the date sets its time beneath it so the controls fit one row.
  - On a phone on its side (shorter than 520px), the time controls move to the right, clear of the legend, and the sweep's moment and the finale are left out.
- **Between** the two, the wide arrangement is kept.

On touch devices every control is at least 44px tall. The timeline track itself is at least 52px tall to the touch at every size.

The opening view looks down from 38°N, 30°W, so the shells are seen at a slant. The camera starts 3.1 globe radii up, or further back on a narrow window, so that the Earth and its low-orbit shell fit across the width. It can pull back far enough to take in the whole high-orbit ring at any window shape (the limit is worked out from the narrower of the two view angles, and on a phone held upright is about 40 radii), and the finale pulls back at least that far, and come no nearer than 0.65 globe radii above the surface, where the night side would fill the window. The camera never comes within 17° of either pole: directly over a pole, longitude is undefined and a drag or a zoom would spin the globe in place. Until the visitor takes hold of the globe, the camera drifts slowly round it, during and after the opening; the turn is what shows that the shells have depth. Once the visitor has moved the camera, a quiet "Reset view" appears at the head of the tools (on compact screens in the quiet row under the legend, beside "Show all") and turns back to the opening view over 0.9s; it stands aside while the title card, the details card, the sweep or the finale is up.

## Elevation & Depth

Depth has two sources. The first is real: the 3D scene itself, where the Earth hides the satellites behind it, the atmosphere glows at its edge, and each satellite is drawn larger and brighter on the near side of its shell than on the far side (scaled by its distance from the camera against the Earth's centre's, between 0.55 and 1.9 times in size), so a shell reads as a shell and not a flat disc. The second is the plate: a pane of smoked glass. A panel is Deep Space at 55% over a 20px blur that lifts saturation by half, with a faint white sheen across its top (7% fading to nothing by mid-panel), a white 12% hairline edge, a white 10% inner highlight along its top edge, and one soft drop shadow beneath it (24px down, 48px blur, pulled in by 24px). The satellites behind it blur into coloured light, so the panel belongs to the sky while its text stays readable. Popovers (search and About) are 90%, over a 50% black backdrop, because they hold the visitor's attention for a moment.

Title, count, legend, tools, time controls, title card and finale have no plate; they sit directly on the scene. Behind the top-left column the night deepens (a soft gradient of Deep Space, fading out towards the globe) so that satellites passing under the words do not drown them.

## Shapes

Two corner sizes, a capsule and a circle. Plates have 6px corners. The tools, legend rows, search results and the hover label have 3px ones. Circles are reserved for the data: satellite points are soft-edged discs, the legend and search dots are circles, the hover and selection markers are thin rings (18px and 24px across), and a timeline moment is a small ring (10px) because it stands for one satellite. The timeline curve is the only free-form shape, and its outline is the data. Everything the visitor uses to move through time or choose what to watch is a capsule: the speed control, Follow and More in the details card, the finale's three actions, the title card's two buttons, Surprise me, and the quiet text buttons along the bottom. Play/Pause is the one round control, as a transport button.

## Components

Hover and state changes are immediate. Interface motion is kept to arrivals, each an exponential ease-out and each gone under reduced motion: the details card (0.2s, a fade and a 4px settle), the title card (0.7s, a fade and an 8px rise, with its count climbing over 1.8s), the time controls and legend fading in when the visitor starts (0.7s), each moment named in the sweep settling in (0.5s), and the finale (0.7s, its dots filling one by one). Otherwise the motion is the scene itself, the playhead moving along the timeline, the camera turning to a satellite picked from the timeline or search (0.9s, or an instant cut under reduced motion), and the points fading back in when a held sky is released (see Speeds). Every control shows keyboard focus the same way: a 2px white outline at 80% opacity, offset 2px. Text selection is white at 25%, and the page declares a dark colour scheme so the browser's own menus and scrollbars match.

### Timeline (signature)
The whole history as one track, from 4 October 1957 to the moment the page opened, linear in time.

- **Curve:** satellites in orbit over time, stacked by orbit class in the four orbit colours on a linear scale, so the flat decades and the steep rise after 2019 are shown as they are. The top of the stack carries a lit edge (white 85%, 1.25px). The part already played is at full strength and gives off light, a blurred copy of itself at 70% beneath it; the part still to come is at 20% opacity.
- **Track furniture:** a faint vertical line at each labelled year (white at 10%), a baseline (white at 25%), a ruled edge under it (a 3px tick for every year, or every month once a year has room, at white 25%; a 6px tick at each label at white 50%), year labels beneath in Dim Grey with "1957" at the left end and "Today" at the right when those ends are in view. Labels fall every 1, 2, 5, 10 or 20 years, the closest spacing that leaves each 64px.
- **Zoom:** like an editor's timeline, the track zooms from all of history down to one year. The wheel zooms around the pointer (a trackpad pinch too), a sideways swipe or Shift-wheel moves along, two fingers pinch on a touch screen, = and - zoom with the slider focused, 0 or a double-click returns to all years. The curve rescales to the busiest moment in view, so a quiet decade still has a shape. Zoomed in, an overview bar appears beneath: a white 10% rail with a white 50% window that can be dragged, the years in view, and "All years". While playing, the view turns the page when the playhead runs off its end.
- **Playhead:** a white bar 3px wide with rounded ends, slightly taller than the track, glowing (a 10px white 60% halo). Dragging anywhere on the track moves it. Arrow keys move a day, Page Up and Page Down a year, Home and End go to the ends. A screen reader hears the date in words.
- **Moments:** five rings on the baseline (Sputnik 1, the first geostationary satellite, the first GPS satellite, the Space Station's first module, the first Starlink launch), each tied to a satellite in the catalogue. A moment the playhead has passed is filled white; one still to come is an open ring at 60% on Deep Space. Crossing one while time plays forward (not a jump of more than 400 days, not a drag, not under reduced motion) sends one white ring out from it, three times its size, fading over 0.9s: the timeline's one authored moment. Where there is room (not on compact screens), each carries a flag in a Caption: a hairline up from the ring and its short name, white 60% and Starlight Grey once passed, white 25% and grey still to come, alternating between two heights so neighbours do not collide. Choosing one goes to just after its launch, pauses, selects that satellite and follows it. The ring fills white on hover.
- **Caption:** one line above the track, set as a Caption, at the position it refers to: the name of a moment being pointed at or just played past, the month and count in orbit under the pointer. At today it is silent. The year labels under the ruler are Captions too.
- **Height:** between 44px and 56px, following the viewport height.

### Title card
A plain visit (no `?t=` or `?sat=`) opens on today's sky, turning at the resting speed and drifting, with a title card along the bottom edge (bottom-left from tablet width up) over a deepening of the night. The card leads with a number: today's count of satellites in orbit as a readout at its largest (6.5rem on a phone, 9rem from tablet, 4.5rem on a short screen), climbing from 1 to today's figure over 1.8s with an exponential ease-out as the card arrives (simply there under reduced motion; space is held for it while the data loads). Beneath it, one line in light type: "satellites in orbit today." and, in Dim Grey, "In 1957 there was one." Then "Watch them arrive", the one filled button on the page (a white capsule with Deep Space text and a play glyph), and "Just look" (a hairline capsule with an eye). "Watch them arrive" starts the rewind, and the count in the corner runs back down to 1: the number is the thread through the whole opening. The title and tools stay; there is no subtitle on the page. The count, legend and time controls are held back until the visitor starts, then fade in. Focus starts on "Watch them arrive"; Escape, picking a satellite or opening search is "Just look". While the catalogue loads the button is disabled and reads "Loading satellites…". Under reduced motion the one button, "Show today's sky", goes to the finale.

### Opening sweep
"Watch them arrive" tells the history in about 35 seconds, paced by events rather than by the calendar. It opens with the rewind: over 1.6 seconds the date runs back from today to Sputnik and the satellites go out, newest first, with no flares or embers (they belong to time running forward) and no moments named. It holds on Sputnik for 2.6 seconds, then travels to each of the other moments in turn (2.6 to 3 seconds, easing out of one and into the next) and holds on each for 3 seconds. The run from the first Starlink launch to today is given 8 seconds, the longest, because most of the satellites arrive in it. The sky is held still throughout (see Speeds), so the only change is satellites appearing; the camera drifts slowly round the Earth until the visitor takes hold of the globe.

- **Where it is told:** quantity lives top-left (the count and legend); time lives bottom-centre. The moment the sweep has reached is named just above the date (body text at 1.125rem, 1.25rem from tablet), settling in as each arrives; its line keeps its height for the whole sweep so the controls never jump. The date beneath carries the year; there is no second, larger year. A moment's name stays for three years of travel past it, and none is named during the rewind.
- **Spotlight:** while the sweep holds on a moment, that moment's satellite is lit as a selection would be (the white 24px ring, its orbit line and trail, the rest of the sky falling to 45%) without selecting anything, and its short name sits beside the ring as a Caption in white, hidden when the Earth is between it and the camera. The camera turns to it, from 22° below its orbit so the orbit reads as an ellipse round the Earth and the satellite on its near side sits in the open sky above the Earth, clear of the words at the bottom; for an orbit far out (Syncom 3's geostationary ring) it pulls back until the whole orbit fits across the window. The turn eases in (a 380ms time constant), the drift pauses for it, and when the sweep moves on the light goes out and the camera eases back to the opening distance. A visitor who has taken hold of the globe keeps the camera; the light still shows.
- **Held back:** the legend rows and the speed control are hidden until the sweep arrives (the rows fade in over 0.7s). The timeline caption is silent too, so a moment is named once. "Skip to today" and Pause stay.
- **Finale:** on arrival the camera pulls back over 3.2s, from at least 28°N so the high-orbit ring reads as a ring, far enough to take in the whole of it. Just above the date, at every size (centred from tablet width), the finale appears: the figure as a readout ("8 in 10", 3rem; 3.75rem from tablet) beside the rest of the sentence ("of the satellites in orbit today went up since 2019."), ten dots with the share lit, filling one by one (70ms apart, after 300ms; at once under reduced motion), then three capsules: "Just look" first (an eye; a brighter edge and a white 10% fill, because handing the sky over is the point), "Follow the Space Station" and "Play the history again" (shortened to "Follow ISS" and "Replay" on a phone so all three fit one row). While it is up it takes the place of the transport row (play, speed, the date and "Today"), sitting directly above the timeline: the date is today and the sky is already moving, so that row waits and returns the moment the visitor starts somewhere. The finale settles in over 0.7s (a fade and an 8px rise). It goes as soon as the visitor starts somewhere: a starting point, selecting a satellite, opening search, the timeline, Escape. "Skip to today" during the sweep (just "Skip" on a phone) also ends on the finale.
- **Ending it early:** any use of the timeline or a speed, or Pause, ends the sweep where it is; Pause leaves history to play on at 1 year per second.
- **Reduced motion:** there is no sweep; the title card's one button, "Show today's sky", goes straight to the finale, with no camera move.

### Speeds
Five speeds in one list, in two regimes. Each regime moves one thing, so that motion on screen always has one meaning.

- **Watching** (Actual speed, 1 minute per second, 10 minutes per second): the satellites move along their orbits. One minute per second is the resting speed: the globe settles there on reaching today, and a low-orbit lap takes about a minute and a half.
- **Time travel** (1 day per second, 1 year per second), the opening sweep, and dragging or key-stepping the timeline: the sky is held still. Every point keeps its place and the Earth stops turning while the date runs on; satellites appear on their launch day and vanish at re-entry. At these rates a satellite would land somewhere new every frame, which reads as noise.
- **Letting go:** when a held sky is released (pausing, choosing a watching speed, ending a drag), every point belongs somewhere else. The points fade back in at their new places over 240ms, or cut instantly under reduced motion.
- **At today:** time cannot pass the present, so the two faster watching speeds replay the most recent 24 hours on a loop. The date shows the replayed moment, and "Actual speed" returns to now. Nothing names the replay: it is how the globe keeps moving at the present, and the date and "Today" already say where the visitor is. Within the last day the time-travel speeds are not offered: one would reach the present in under a second and drop straight back, so "Faster" (and L) stops at 10 minutes per second, its tooltip saying why, and a link to a moment within the last day opens at the resting speed. A time-travel speed that reaches today from further back switches to the resting speed; going back into the past switches a resting speed the visitor did not choose back to 1 year per second.

### Buttons
- **Start ("Watch them arrive"):** the one filled button on the page: a white capsule 48px tall with Deep Space text at weight 500 and a drawn play glyph; hover dims it to 85%. Disabled while the data loads, at white 25%.
- **Capsule (Just look, Follow / Following, More / Less, the finale's actions, Surprise me):** a capsule 44px tall (40px in the phone's finale), body text, a white 20 to 25% hairline and a drawn glyph before the words; hover brightens the line to 50 to 60% and adds a white 10% fill. A capsule that is on (Following) or that leads (the finale's Just look) keeps the brighter line and the fill.
- **Transport (Play / Pause):** 44px round, a white 30% hairline and a drawn glyph only; hover brightens the line to 70% and adds a white 10% fill. Its tooltip carries the words and keys.
- **Tool (Find a satellite, About):** 36px tall with 3px corners and a white 24% hairline (44px to the finger on touch); hover brightens the line to 50% and adds a white 10% fill. Find a satellite carries a drawn lens and its words (the lens alone on a phone); About is a drawn "i".
- **Quiet (Jump to today, Reset view, Show all, All years, Dismiss):** no line; hover adds a white 10% fill. "Jump to today" carries a drawn arrow-to-bar and reads "Today" on a phone; at today it is disabled, reads "Today" in Dim Grey, and has no hover; during the opening sweep it reads "Skip to today" ("Skip" on a phone).
- **Close (details card):** a drawn cross in Dim Grey, 32px square (44px on touch); hover turns it white on a white 10% fill.

### Legend rows
- **Style:** each row is a toggle button, 14rem wide on desktop: a 10px colour dot, the class name, and its current count right-aligned in Dim Grey with tabular figures. Where each orbit is ("below 2,000 km") lives in the row's tooltip and the details card, not on the row.
- **Focus:** pointing at a row, or reaching it with the keyboard, picks that class out on the globe: its points are drawn brighter and larger and every other class falls to 12%.
- **Note:** under the rows, at today only, a Label line reads "Faint points: no longer operating"
- **State:** hover adds a white 10% fill. Switched off (`aria-pressed="false"`), the dot becomes an empty ring in the class's colour, the name turns Dim Grey (still readable), and that class disappears from the globe. The row's tooltip names the class, where it is, and what pressing it will do ("Low orbit, below 2,000 km. Select to hide it on the globe.").
- **Hidden classes:** the count above still says how many are in orbit; the line beneath it adds how many are drawn ("satellites in orbit · 2,044 on the globe"), and a quiet "Show all" leads the note line.

### Cards / Containers
- **Link notice:** when the page was opened from a link it cannot follow (a date it cannot read, before 1957 or still to come; a catalogue ID it does not know), the time controls open with one line saying what the link asked for and what is showing instead, ruled off from the controls by a white 15% hairline, with a "Dismiss" control button.
- **Time controls:** no panel (see Layout). One row: on the left, Play/Pause as a 44px round button with a white 30% hairline (the one round control, as a transport button) and the speed capsule beside it; in the middle, the date as a readout (2.5rem; 2rem on a phone) with the UTC time beneath it as a Caption, held in place but hidden when it means nothing (at a time-travel speed, or at exactly midnight UTC, where a jump lands); on the right, "Jump to today" in body text with a drawn arrow-to-bar, quiet (just "Today" and the arrow on a phone). On a phone the speed capsule takes a second row, centred. The timeline follows. Keys from anywhere outside a field or open popover, as on an editor's timeline: Space plays and pauses; J one speed slower (pausing from the slowest), K pause, L play or one speed faster; comma and full stop step back and forward a minute at a watching speed or a day otherwise, and pause. The speed steps and Play carry their keys in their tooltips.
- **Details card:** a plate, 16px padding. Name (Name style), then an orbit-class line with an 8px colour dot. Then a Follow toggle (a capsule with a white 20% hairline and a drawn sight; "Following" with a brighter edge and a white 10% fill while on). Then a two-column list (Dim Grey label on the left, value on the right) that leads with the satellite's life: Launched; Re-entered with how long it lasted ("January 4, 1958, after 3 months"); On this date, how long after launch the date shown is; Today, its age and whether it still works ("36 years in orbit, operating"). Then Owner, Country, Altitude, Orbit tilt, One orbit takes, and its catalogue ID. Then, ruled off by a white 10% hairline, the honesty note in Label text: "Height, shape and tilt are real. Which way the orbit faces, and where on it the satellite sits, are illustrative." The card starts below the tools. On a phone it opens as a summary: three readouts with Captions (Altitude, One orbit, and Launched or the years in orbit), the Follow toggle and, beside it, "More" (the same capsule, with a chevron that turns over to "Less"), which opens the full list and the note. When the date shown is outside the satellite's time in orbit, a notice on a white 5% fill with a white 15% hairline says so and offers "Go to its launch".
- **Popover (search, About):** a plate at 90%, 12 to 16px padding, over a 50% black backdrop. Search opens near the top so a phone keyboard does not cover it; About opens centred.
- **Hover label:** a plate with 3px corners, 4px by 8px padding, label text, one line: the name, then its launch year in Dim Grey. It follows the pointer at a 14px offset, below and to the right, switching sides where it would run off the window, and ignores pointer events.
- **Shadow / Blur:** the plate's glass, and nothing else (see Elevation & Depth).

### Inputs / Fields
- **Speed capsule:** one piece, a 44px capsule with a white 20% hairline: "Slower" (a drawn minus in a 36px round hit area, 44px on touch), the current speed in words (body text, at least 9.5rem wide), and "Faster" (a drawn plus). A step that has nowhere to go is disabled and drawn in dark grey.
- **Search field:** white at 5% fill with a white 25% hairline, 3px corners, 44px tall, 1rem text, Dim Grey placeholder. Once something is typed, a drawn cross at the right end (the same cross as the details card's Close) clears it; the browser's own clear button is hidden. Results are rows 44px tall with a colour dot, the name, and its years in orbit in Dim Grey; the active row has a white 10% fill.
- **Surprise me:** beside the "Suggestions" label before anything is typed, a quiet capsule with a drawn shuffle picks a satellite at random from those in orbit on the date showing and flies to it, as a search result would.

### Globe markers
- **Satellite point:** a spark 4px across (scaled by device pixel ratio, capped at 2x): a bright core with a soft skirt, in its orbit-class colour, drawn additively so that overlapping points add their light. Points never hide each other; the Earth hides those behind it.
- **Brightness:** at today, a satellite that has stopped working is drawn at 30%. This applies to today only, because the catalogue records who is operating now, not who was operating then. While a satellite is selected the rest of the field falls to 45%.
- **Hover ring:** a white ring 18px across at 80% opacity, with a trail; the cursor becomes a pointer.
- **Selection:** a white ring 24px across at full opacity, the satellite's own point drawn larger and at full brightness, its orbit as a white line at 30% opacity, and a trail.
- **Launch bloom (signature):** a satellite arrives as a flare. On its launch day its point is drawn up to 7 times larger, white-hot, with a tight core and a thin ring that runs outward from it and fades as the point cools into its class colour, over 1.1 real seconds whatever the playback speed (the length in days follows the measured playback rate). Dragging the timeline forward plays them too.
- **Arrival budget:** up to 10 satellites flaring at once each get the full flare. Beyond that, each flare is scaled by the square root of 10 over the number flaring (never below a fifth), so the light of all of them together stays about the same; the scale follows the count over 0.3s so it breathes rather than flickers. The ring goes first: full until each flare is at half, gone by a quarter. At a year per second the 1960s pop one by one with rings, and the years after 2019 arrive as a fine shimmer of sparks across the shell instead of a white-out. A jump of more than 400 days in a frame (a moment picked, a link followed) blooms nothing. Under reduced motion there are no blooms.
- **Re-entry ember:** a satellite that comes down stays for 0.9 real seconds after its re-entry date as an orange (`#ff8a3d`) ember that shrinks and falls to the surface as it fades. The ember orange appears nowhere else; it means burning up.
- **Trail:** a white line behind a hovered or selected satellite, brightest at the satellite and fading to nothing, covering the last 8% of a lap. It is the path over the turning Earth, so it shows which way the satellite is going, and a satellite that keeps station over one place has none.
- **Following:** picking a satellite from search, the timeline, the finale or a link (or pressing Follow in its card) flies the camera to look straight down on it, easing in over about a second to 1.6 globe radii above it, and from then on keeps it in the middle of the view frame by frame. Zooming and pinching keep following; dragging the globe with one finger or the mouse, picking another satellite on the globe, or closing the card stops it. Under reduced motion the camera cuts instead of easing.

## Do's and Don'ts

### Do:
- **Do** keep the centre of the viewport clear. Interface belongs at the edges and corners, on top of a globe that always fills the window.
- **Do** use the four orbit colours only for their orbit class, and pair each with its name wherever it appears outside the globe and the timeline curve.
- **Do** set every changing number in tabular figures.
- **Do** label controls with plain words ("Play", "Jump to today", "Find a satellite", "satellites in orbit") and show times in UTC.
- **Do** keep words to a minimum. A line of copy earns its place by saying something the visualisation cannot.
- **Do** say what is real wherever a satellite's position is shown: orbit height, shape and tilt are real; which way an orbit faces and where the satellite sits along it are illustrative.
- **Do** keep panels narrow enough to fit a phone: `min(width, 100% - 2rem)`, and controls at least 44px tall on touch.
- **Do** draw the timeline curve on a linear scale. Its shape is a claim about the data.
- **Do** update `src/index.css` and `ORBIT_COLORS` in `src/App.tsx` together when an orbit colour changes.

### Don't:
- **Don't** add a saturated colour that does not stand for something in the data.
- **Don't** call anything "live" or "real time", or mark the present in red, until satellite positions are real.
- **Don't** use glass anywhere but a plate, or stack panes of it. One material for every panel.
- **Don't** set anything but the title in wide capitals, or anything but the counts, the finale's figure and the date as a readout.
- **Don't** bring back a serif display face or a second family. One family, its width doing the ranking.
- **Don't** dim satellites as "not working" on a past date. The catalogue only knows who is operating now.
- **Don't** add interface motion that competes with the scene; the satellites and the playhead are the animation.
- **Don't** add a light theme. The night-side Earth and the point colours depend on the dark ground.
