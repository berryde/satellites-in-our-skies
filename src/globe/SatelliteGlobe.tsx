import Globe, { type GlobeInstance } from "globe.gl";
import { useEffect, useRef } from "react";
import { type PerspectiveCamera, Vector3 } from "three";
import type { Catalog } from "../data/catalog";
import { useSelection, useView } from "../state/selection";
import { inLastDay, reducedMotion, useSim } from "../state/store";
import { createSatelliteLayer, type SatelliteLayer } from "./satelliteLayer";
import { GLOBE_RADIUS, inOrbit, satellitePosition } from "./orbitMath";
import { createSelectionLayer, pickSatellite } from "./selection";

type Props = {
	catalog: Catalog;
	colors: string[];
	classVisible: boolean[];
};

/** A press that moves less than this (CSS px) is a click, not a drag of the globe. */
const CLICK_TOLERANCE = 5;

/** How far back the camera pulls when the opening sweep arrives, in globe radii: far enough to see the high-orbit ring. */
const FINALE_ALTITUDE = 6;
/** The geostationary ring's radius, in globe radii (42,164 km from the Earth's centre). */
const RING_RADII = 42_164 / 6371;
/** How long the camera takes to fly to a satellite it has been asked to follow, in ms. */
const FLIGHT_MS = 1400;

export function SatelliteGlobe({ catalog, colors, classVisible }: Props) {
	const container = useRef<HTMLDivElement>(null);
	const layer = useRef<SatelliteLayer>(null);
	const visibleClasses = useRef(classVisible);

	useEffect(() => {
		const element = container.current!;
		const globe: GlobeInstance = new Globe(element, { animateIn: false })
			.globeImageUrl(`${import.meta.env.BASE_URL}textures/earth-night.jpg`)
			.backgroundColor("#02030a")
			.showAtmosphere(true)
			.atmosphereColor("#4f8cff")
			.atmosphereAltitude(0.18)
			.width(element.clientWidth)
			.height(element.clientHeight);

		// Closer than this the night side fills the window and there is nothing to see.
		globe.controls().minDistance = 165;
		// Keep the camera off the polar axis. Directly over a pole, longitude is
		// undefined: a drag, or the nudge toward the pointer that zooming gives,
		// would swing the camera round the axis and spin the globe in place.
		globe.controls().minPolarAngle = 0.3;
		globe.controls().maxPolarAngle = Math.PI - 0.3;
		const camera = globe.camera() as PerspectiveCamera;
		camera.far = 10_000;		camera.updateProjectionMatrix();

		// Open far enough back that the Earth and its low-orbit shell fit across a
		// narrow window: on a phone held upright the view is much tighter sideways.
		const halfHeight = (camera.fov * Math.PI) / 360;
		const halfWidth = Math.atan(Math.tan(halfHeight) * (element.clientWidth / element.clientHeight));

		// The high-orbit ring is 6.6 globe radii out. On a wide window 16 radii of
		// distance take it all in; on a phone held upright the view is so narrow
		// sideways that the ring needs twice that. So the furthest the camera may
		// pull back, and where the finale settles, follow the window's shape.
		/** Distance from the Earth's centre, in globe radii, at which an orbit of radius `radii` fits across the window. */
		const fitsAcross = (radii: number) => {
			const width = Math.atan(Math.tan(halfHeight) * (element.clientWidth / Math.max(1, element.clientHeight)));
			const narrowest = Math.min(width, halfHeight);
			return (radii * 1.12) / Math.tan(narrowest);
		};
		const ringFits = () => fitsAcross(RING_RADII);
		const fitControls = () => {
			globe.controls().maxDistance = Math.max(16, ringFits() * 1.2) * GLOBE_RADIUS;
		};
		fitControls();
		// Looking down from well north of the equator and a little further back, the
		// shells are seen at a slant: the near side of the low-orbit shell crosses
		// in front of the Earth and the far side passes behind it.
		const home = { lat: 38, lng: -30, altitude: Math.max(3.1, 1.12 / Math.sin(0.9 * halfWidth) - 1) };
		globe.pointOfView(home);
		useView.setState({ moved: false, reset: () => globe.pointOfView(home, reducedMotion ? 0 : 900) });
		// Away from home by more than a few degrees, or nearer or further by a tenth of a radius.
		const awayFromHome = () => {
			const { lat, lng, altitude } = globe.pointOfView();
			const turn = Math.abs(((lng - home.lng + 540) % 360) - 180) * Math.cos((lat * Math.PI) / 180);
			return Math.abs(lat - home.lat) > 3 || turn > 3 || Math.abs(altitude - home.altitude) > 0.1;
		};
		let lastViewCheck = 0;

		const satellites = createSatelliteLayer(catalog, colors);
		const selection = createSelectionLayer(catalog);
		layer.current = satellites;
		globe.scene().add(satellites.object, selection.object);

		/** Where the camera looks straight down at a satellite, if it is in orbit at the moment on display. */
		const facing = (index: number) => {
			const { time, motionTime } = useSim.getState();
			if (!inOrbit(catalog, index, time)) return null;
			const p = [0, 0, 0];
			satellitePosition(catalog, index, motionTime, p);
			const r = Math.hypot(p[0], p[1], p[2]);
			return {
				lat: (Math.asin(p[1] / r) * 180) / Math.PI,
				lng: (Math.atan2(p[0], p[2]) * 180) / Math.PI,
				altitude: r / GLOBE_RADIUS - 1 + 1.6,
			};
		};

		// A shared link to a satellite (?sat=) opens looking straight at it, and follows it.
		const linked = useSelection.getState().selected;
		if (linked !== null) {
			const view = facing(linked);
			if (view) globe.pointOfView(view);
			useSelection.setState({ following: true });
		}

		// Picking a satellite from search, the timeline or the finale flies to it
		// (see the frame loop), and from then on the camera keeps it in view.
		let flightStart = Number.NEGATIVE_INFINITY;
		const stopFocusing = useSelection.subscribe((state, previous) => {
			if (state.focusRequests !== previous.focusRequests && state.selected !== null) {
				stopDrift();
				flightStart = performance.now();
			}
		});

		// The camera drifts slowly round, so a still sky still feels like a place
		// and the turn shows the shells' depth. Arriving at the present, it pulls back
		// to take in the high-orbit ring. Taking hold of the globe, or being
		// turned to face a satellite, stops both.
		const controls = globe.controls();
		controls.autoRotateSpeed = 0.35;
		let held = linked !== null;
		const drift = (on: boolean) => {
			controls.autoRotate = on && !held && !reducedMotion;
		};
		drift(true);
		function stopDrift() {
			held = true;
			drift(false);
		}
		controls.addEventListener("start", stopDrift);
		const stopOpening = useSim.subscribe((state, previous) => {
			if (state.intro && !previous.intro) {
				held = false;
				drift(true);
			}
			if (state.finale && !previous.finale && !held && !reducedMotion) {
				const { lat, lng, altitude } = globe.pointOfView();
				// From well above the equator, so the high-orbit ring reads as a ring and not an edge-on line.
				globe.pointOfView({ lat: Math.max(lat - 10, 28), lng: lng + 25, altitude: Math.max(altitude, FINALE_ALTITUDE, ringFits() - 1) }, 3200);
			}
		});

		// Hover picking runs at most once per frame: when the pointer moves, and a
		// few times a second while it rests, since the satellites move under it.
		let pointer: { x: number; y: number } | null = null;
		let pointerMoved = false;
		let lastPick = 0;

		// The spotlit satellite's name, beside its ring on screen. Hidden when the
		// Earth is between it and the camera, and whenever nothing is lit.
		const tag = document.createElement("div");
		tag.setAttribute("aria-hidden", "true");
		tag.className =
			"caps pointer-events-none absolute top-0 left-0 whitespace-nowrap text-white opacity-0 transition-opacity duration-500 motion-reduce:transition-none [text-shadow:0_0_8px_rgb(2_3_10)]";
		element.appendChild(tag);
		const at = new Vector3();
		const placeTag = (lit: { index: number; label: string } | null) => {
			if (!lit) {
				tag.style.opacity = "0";
				return;
			}
			const p = [0, 0, 0];
			satellitePosition(catalog, lit.index, useSim.getState().motionTime, p);
			at.set(p[0], p[1], p[2]);
			// Behind the Earth: the line from the camera to it passes through the globe.
			const c = camera.position;
			const d = at.clone().sub(c);
			const b = c.dot(d);
			const a = d.dot(d);
			const disc = b * b - a * (c.dot(c) - GLOBE_RADIUS * GLOBE_RADIUS);
			const hidden = disc > 0 && (-b - Math.sqrt(disc)) / a < 1;
			at.project(camera);
			const offscreen = at.z > 1 || Math.abs(at.x) > 1 || Math.abs(at.y) > 1;
			if (tag.textContent !== lit.label) tag.textContent = lit.label;
			tag.style.opacity = hidden || offscreen ? "0" : "1";
			const x = ((at.x + 1) / 2) * element.clientWidth;
			const y = ((1 - at.y) / 2) * element.clientHeight;
			tag.style.transform = `translate(${Math.round(x + 18)}px, ${Math.round(y - 5)}px)`;
		};

		let lastFrame = performance.now();
		let frame = requestAnimationFrame(function tick(now) {
			const { time, motionTime } = useSim.getState();
			const frameMs = Math.min(now - lastFrame, 100);
			lastFrame = now;

			// Following: the camera eases round to the satellite, then keeps up with it.
			// The flight sets the distance; after it, the visitor's zoom is left alone.
			const following = useSelection.getState();
			if (following.following && following.selected !== null) {
				const view = facing(following.selected);
				if (view) {
					const pov = globe.pointOfView();
					const flying = now - flightStart < FLIGHT_MS;
					const ease = reducedMotion ? 1 : 1 - Math.exp(-frameMs / (flying ? 220 : 60));
					const turn = ((view.lng - pov.lng + 540) % 360) - 180;
					globe.pointOfView({
						lat: pov.lat + (view.lat - pov.lat) * ease,
						lng: pov.lng + turn * ease,
						altitude: flying ? pov.altitude + (view.altitude - pov.altitude) * ease : pov.altitude,
					});
				}
			}

			// The sweep's pauses: while it holds on a named moment, the camera turns to
			// face that satellite (pulling back if its orbit is further out than the view),
			// and the satellite is lit with the selection's ring and orbit while the rest
			// of the sky dims. Moving on, the camera eases back to the opening distance.
			// A visitor who has taken hold of the globe keeps it; the light still shows.
			const { intro, spotlight } = useSim.getState();
			const lit = intro && spotlight && inOrbit(catalog, spotlight.index, time) ? spotlight : null;
			if (intro) {
				controls.autoRotate = !held && !reducedMotion && lit === null;
				if (!held && !reducedMotion) {
					const pov = globe.pointOfView();
					const view = lit ? facing(lit.index) : null;
					if (view) {
						// From a little below its orbit, not straight down on it, so the orbit reads
						// as an ellipse round the Earth rather than a line through the middle, and the
						// satellite on its near side sits in the open sky above the Earth, clear of the
						// words along the bottom. Far enough back for a distant orbit to fit across the window.
						const radii = view.altitude + 1 - 1.6;
						const target = {
							lat: Math.min(Math.max(view.lat - 22, -70), 70),
							lng: view.lng,
							altitude: Math.max(home.altitude, radii > 2 ? fitsAcross(radii) - 1 : 0),
						};
						const ease = 1 - Math.exp(-frameMs / 380);
						const turn = ((target.lng - pov.lng + 540) % 360) - 180;
						globe.pointOfView({
							lat: pov.lat + (target.lat - pov.lat) * ease,
							lng: pov.lng + turn * ease,
							altitude: pov.altitude + (target.altitude - pov.altitude) * ease,
						});
					} else if (Math.abs(pov.altitude - home.altitude) > 0.02) {
						const ease = 1 - Math.exp(-frameMs / 700);
						globe.pointOfView({ ...pov, altitude: pov.altitude + (home.altitude - pov.altitude) * ease });
					}
				}
			}
			placeTag(lit);

			if (pointer && (pointerMoved || now - lastPick > 250)) {
				pointerMoved = false;
				lastPick = now;
				const hovered = pickSatellite(
					catalog,
					time,
					motionTime,
					camera,
					{ width: element.clientWidth, height: element.clientHeight },
					pointer,
					visibleClasses.current,
				);
				useSelection.setState({ hovered, pointer });
				element.style.cursor = hovered === null ? "" : "pointer";
			}
			if (now - lastViewCheck > 250) {
				lastViewCheck = now;
				// The drift alone does not count: only the visitor moving the camera.
				const moved = held && awayFromHome();
				if (moved !== useView.getState().moved) useView.setState({ moved });
			}
			const { hovered, selected, focusClass } = useSelection.getState();
			// A spotlight is drawn as a selection would be, without selecting anything.
			const shown = selected ?? lit?.index ?? null;
			satellites.update(time, motionTime, now, {
				selected: shown !== null && inOrbit(catalog, shown, time) ? shown : null,
				orbitClass: focusClass !== null && visibleClasses.current[focusClass] ? focusClass : null,
				// "Operating" is known for today only: a satellite that is dead now was working once.
				dimInactive: inLastDay(time),
			});
			selection.update(time, motionTime, hovered, shown);
			frame = requestAnimationFrame(tick);
		});

		const local = (event: PointerEvent) => {
			const rect = element.getBoundingClientRect();
			return { x: event.clientX - rect.left, y: event.clientY - rect.top };
		};
		let pressedAt: { x: number; y: number } | null = null;
		const pressed = new Set<number>();
		const onMove = (event: PointerEvent) => {
			// Dragging the globe with one finger or the mouse takes it back from the
			// camera; zooming and pinching keep following.
			if (pressedAt && pressed.size === 1 && useSelection.getState().following) {
				const at = local(event);
				if (Math.hypot(at.x - pressedAt.x, at.y - pressedAt.y) > CLICK_TOLERANCE) useSelection.getState().stopFollowing();
			}
			if (event.pointerType !== "mouse") return; // touch has no hover
			pointer = local(event);
			pointerMoved = true;
		};
		const onLeave = () => {
			pointer = null;
			useSelection.setState({ hovered: null });
		};
		const onDown = (event: PointerEvent) => {
			pressed.add(event.pointerId);
			pressedAt = local(event);
		};
		const onCancel = (event: PointerEvent) => {
			pressed.delete(event.pointerId);
			pressedAt = null;
		};
		const onUp = (event: PointerEvent) => {
			pressed.delete(event.pointerId);
			if (!pressedAt) return;
			const at = local(event);
			const moved = Math.hypot(at.x - pressedAt.x, at.y - pressedAt.y);
			pressedAt = null;
			if (moved > CLICK_TOLERANCE) return;
			// Touch has no hover, so pick at the tap with a larger target.
			const picked =
				event.pointerType === "mouse"
					? useSelection.getState().hovered
					: pickSatellite(
							catalog,
							useSim.getState().time,
							useSim.getState().motionTime,
							camera,
							{ width: element.clientWidth, height: element.clientHeight },
							at,
							visibleClasses.current,
							20,
						);
			useSelection.getState().select(picked);
		};
		element.addEventListener("pointermove", onMove);
		element.addEventListener("pointerleave", onLeave);
		element.addEventListener("pointerdown", onDown);
		element.addEventListener("pointerup", onUp);
		element.addEventListener("pointercancel", onCancel);

		const resize = new ResizeObserver(() => {
			globe.width(element.clientWidth).height(element.clientHeight);
			fitControls();
		});
		resize.observe(element);

		return () => {
			cancelAnimationFrame(frame);
			resize.disconnect();
			element.removeEventListener("pointermove", onMove);
			element.removeEventListener("pointerleave", onLeave);
			element.removeEventListener("pointerdown", onDown);
			element.removeEventListener("pointerup", onUp);
			element.removeEventListener("pointercancel", onCancel);
			satellites.dispose();
			stopFocusing();
			stopOpening();
			controls.removeEventListener("start", stopDrift);
			selection.dispose();
			globe._destructor();
			element.replaceChildren();
		};
		// `colors` is a constant from App; class visibility is applied by the effect below.
	}, [catalog]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		visibleClasses.current = classVisible;
		layer.current?.setClassVisible(classVisible);
		// Don't leave a hidden satellite selected.
		const { selected, select } = useSelection.getState();
		if (selected !== null && !classVisible[catalog.orbits.orbitClass[selected]]) select(null);
	}, [catalog, classVisible]);

	return (
		<div
			ref={container}
			role="img"
			aria-label="The Earth, with every satellite in orbit on the date shown drawn as a point. Use Find a satellite to look one up."
			className="absolute inset-0"
		/>
	);
}
