import Globe, { type GlobeInstance } from "globe.gl";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { Catalog } from "../data/catalog";
import { useSelection } from "../state/selection";
import { useSim } from "../state/store";
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
			.height(element.clientHeight)
			.pointOfView({ lat: 25, lng: -30, altitude: 2.6 });

		// GEO is ~6.6 Earth radii out, so let the camera pull well back.
		globe.controls().maxDistance = 1600;
		globe.controls().minDistance = 120;
		const camera = globe.camera() as PerspectiveCamera;
		camera.far = 10_000;
		camera.updateProjectionMatrix();

		const satellites = createSatelliteLayer(catalog, colors);
		const selection = createSelectionLayer(catalog);
		layer.current = satellites;
		globe.scene().add(satellites.object, selection.object);

		// A shared link to a satellite (?sat=) opens looking straight at it.
		const linked = useSelection.getState().selected;
		const { time } = useSim.getState();
		if (linked !== null && inOrbit(catalog, linked, time)) {
			const p = [0, 0, 0];
			satellitePosition(catalog, linked, time, p);
			const r = Math.hypot(p[0], p[1], p[2]);
			globe.pointOfView({
				lat: (Math.asin(p[1] / r) * 180) / Math.PI,
				lng: (Math.atan2(p[0], p[2]) * 180) / Math.PI,
				altitude: r / GLOBE_RADIUS - 1 + 1.6,
			});
		}

		// Hover picking runs at most once per frame: when the pointer moves, and a
		// few times a second while it rests, since the satellites move under it.
		let pointer: { x: number; y: number } | null = null;
		let pointerMoved = false;
		let lastPick = 0;

		let frame = requestAnimationFrame(function tick(now) {
			const { time } = useSim.getState();
			if (pointer && (pointerMoved || now - lastPick > 250)) {
				pointerMoved = false;
				lastPick = now;
				const hovered = pickSatellite(
					catalog,
					time,
					camera,
					{ width: element.clientWidth, height: element.clientHeight },
					pointer,
					visibleClasses.current,
				);
				useSelection.setState({ hovered, pointer });
				element.style.cursor = hovered === null ? "" : "pointer";
			}
			const { hovered, selected } = useSelection.getState();
			satellites.update(time);
			selection.update(time, hovered, selected);
			frame = requestAnimationFrame(tick);
		});

		const local = (event: PointerEvent) => {
			const rect = element.getBoundingClientRect();
			return { x: event.clientX - rect.left, y: event.clientY - rect.top };
		};
		let pressedAt: { x: number; y: number } | null = null;
		const onMove = (event: PointerEvent) => {
			if (event.pointerType !== "mouse") return; // touch has no hover
			pointer = local(event);
			pointerMoved = true;
		};
		const onLeave = () => {
			pointer = null;
			useSelection.setState({ hovered: null });
		};
		const onDown = (event: PointerEvent) => {
			pressedAt = local(event);
		};
		const onUp = (event: PointerEvent) => {
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

		const resize = new ResizeObserver(() => {
			globe.width(element.clientWidth).height(element.clientHeight);
		});
		resize.observe(element);

		return () => {
			cancelAnimationFrame(frame);
			resize.disconnect();
			element.removeEventListener("pointermove", onMove);
			element.removeEventListener("pointerleave", onLeave);
			element.removeEventListener("pointerdown", onDown);
			element.removeEventListener("pointerup", onUp);
			satellites.dispose();
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

	return <div ref={container} className="absolute inset-0" />;
}
