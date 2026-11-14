import * as THREE from "three";
import type { Catalog } from "../data/catalog";
import { anglesAt, GLOBE_RADIUS, gmst, inOrbit, MU, orbitPoint, satellitePosition, TAU } from "./orbitMath";

const point: number[] = [0, 0, 0];
const projected = new THREE.Vector3();

/**
 * The visible satellite drawn nearest to a screen position, if any is within
 * `radius` CSS pixels. `time` decides who is in orbit and `motionTime` where
 * they are drawn, as in satelliteLayer.ts. Positions are recomputed on the CPU (orbitMath.ts), and
 * satellites hidden behind the Earth are skipped.
 */
export function pickSatellite(
	catalog: Catalog,
	time: number,
	motionTime: number,
	camera: THREE.Camera,
	viewport: { width: number; height: number },
	pointer: { x: number; y: number },
	classVisible: boolean[],
	radius = 10,
): number | null {
	const eye = camera.position;
	const eyeDistanceSq = eye.lengthSq() - GLOBE_RADIUS * GLOBE_RADIUS;
	let best: number | null = null;
	let bestDistanceSq = radius * radius;

	for (let i = 0; i < catalog.count; i++) {
		if (!classVisible[catalog.orbits.orbitClass[i]] || !inOrbit(catalog, i, time)) continue;
		satellitePosition(catalog, i, motionTime, point);

		projected.set(point[0], point[1], point[2]).project(camera);
		if (projected.z > 1) continue; // behind the camera
		const dx = ((projected.x + 1) / 2) * viewport.width - pointer.x;
		const dy = ((1 - projected.y) / 2) * viewport.height - pointer.y;
		const distanceSq = dx * dx + dy * dy;
		if (distanceSq >= bestDistanceSq) continue;

		// Hidden if the line of sight enters the Earth before reaching the satellite:
		// solve |eye + t·d|² = R² for the nearest t, with d = satellite − eye.
		const d = [point[0] - eye.x, point[1] - eye.y, point[2] - eye.z];
		const dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
		const ed = eye.x * d[0] + eye.y * d[1] + eye.z * d[2];
		const discriminant = ed * ed - dd * eyeDistanceSq;
		if (discriminant > 0) {
			const t = (-ed - Math.sqrt(discriminant)) / dd;
			if (t > 0 && t < 1) continue;
		}

		best = i;
		bestDistanceSq = distanceSq;
	}
	return best;
}

const ringShader = {
	vertexShader: /* glsl */ `
		uniform float uSize;
		void main() {
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			gl_PointSize = uSize;
		}
	`,
	fragmentShader: /* glsl */ `
		uniform vec3 uColor;
		uniform float uOpacity;
		void main() {
			float d = length(gl_PointCoord - 0.5);
			float ring = smoothstep(0.5, 0.42, d) * smoothstep(0.28, 0.36, d);
			if (ring < 0.01) discard;
			gl_FragColor = vec4(uColor, ring * uOpacity);
		}
	`,
};

const ORBIT_SEGMENTS = 256;
const TRAIL_SEGMENTS = 40;
/** A trail covers this much of one lap: the path just flown, fading out behind the satellite. */
const TRAIL_LAPS = 0.08;

/** Ring markers for the hovered and selected satellites, and the selected one's orbit. */
export function createSelectionLayer(catalog: Catalog) {
	const group = new THREE.Group();
	const pixelRatio = Math.min(window.devicePixelRatio, 2);

	function marker(size: number, opacity: number) {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
		const material = new THREE.ShaderMaterial({
			...ringShader,
			uniforms: {
				uSize: { value: size * pixelRatio },
				uColor: { value: new THREE.Color(1, 1, 1) },
				uOpacity: { value: opacity },
			},
			transparent: true,
			depthWrite: false,
		});
		const object = new THREE.Points(geometry, material);
		object.frustumCulled = false;
		object.visible = false;
		group.add(object);
		return object;
	}
	const hoverMarker = marker(18, 0.8);
	const selectedMarker = marker(24, 1);

	const orbitGeometry = new THREE.BufferGeometry();
	orbitGeometry.setAttribute(
		"position",
		new THREE.BufferAttribute(new Float32Array((ORBIT_SEGMENTS + 1) * 3), 3),
	);
	const orbit = new THREE.Line(
		orbitGeometry,
		new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }),
	);
	orbit.frustumCulled = false;
	orbit.visible = false;
	group.add(orbit);

	/**
	 * Where a satellite has just been, brightest at the satellite. It is the
	 * path over the turning Earth, so a satellite that keeps station over one
	 * place (the high ring) has no trail, and one that is moving shows which way.
	 */
	function trail(peak: number) {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array((TRAIL_SEGMENTS + 1) * 3), 3));
		const shade = new Float32Array((TRAIL_SEGMENTS + 1) * 3);
		for (let s = 0; s <= TRAIL_SEGMENTS; s++) shade.fill(peak * (1 - s / TRAIL_SEGMENTS) ** 2, s * 3, s * 3 + 3);
		geometry.setAttribute("color", new THREE.BufferAttribute(shade, 3));
		// Added to what is behind it, so that black is clear and the tail fades to nothing.
		const material = new THREE.LineBasicMaterial({
			vertexColors: true,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});
		const object = new THREE.Line(geometry, material);
		object.frustumCulled = false;
		object.visible = false;
		group.add(object);
		return object;
	}
	const hoverTrail = trail(0.7);
	const selectedTrail = trail(1);

	function drawTrail(object: THREE.Line, index: number | null, time: number, motionTime: number) {
		object.visible = index !== null && inOrbit(catalog, index, time);
		if (!object.visible) return;
		const a = catalog.orbits.semiMajorAxisKm[index!];
		const lapMs = TAU * Math.sqrt((a * a * a) / MU) * 1000;
		const position = object.geometry.getAttribute("position") as THREE.BufferAttribute;
		for (let s = 0; s <= TRAIL_SEGMENTS; s++) {
			satellitePosition(catalog, index!, motionTime - (s / TRAIL_SEGMENTS) * TRAIL_LAPS * lapMs, point);
			position.setXYZ(s, point[0], point[1], point[2]);
		}
		position.needsUpdate = true;
	}

	function place(object: THREE.Points, index: number | null, time: number, motionTime: number) {
		object.visible = index !== null && inOrbit(catalog, index, time);
		if (!object.visible) return;
		satellitePosition(catalog, index!, motionTime, point);
		const position = object.geometry.getAttribute("position") as THREE.BufferAttribute;
		position.setXYZ(0, point[0], point[1], point[2]);
		position.needsUpdate = true;
	}

	/** The orbit as it lies right now, traced through a full turn of mean anomaly. */
	function traceOrbit(index: number | null, time: number, motionTime: number) {
		orbit.visible = index !== null && inOrbit(catalog, index, time);
		if (!orbit.visible) return;
		const o = catalog.orbits;
		const { raan, argp } = anglesAt(catalog, index!, (motionTime - catalog.epoch) / 1000);
		const earthAngle = gmst(motionTime);
		const position = orbitGeometry.getAttribute("position") as THREE.BufferAttribute;
		for (let s = 0; s <= ORBIT_SEGMENTS; s++) {
			const anomaly = (s / ORBIT_SEGMENTS) * TAU;
			orbitPoint(o.semiMajorAxisKm[index!], o.eccentricity[index!], o.inclination[index!], raan, argp, anomaly, earthAngle, point);
			position.setXYZ(s, point[0], point[1], point[2]);
		}
		position.needsUpdate = true;
	}

	return {
		object: group,
		update(time: number, motionTime: number, hovered: number | null, selected: number | null) {
			place(hoverMarker, hovered === selected ? null : hovered, time, motionTime);
			place(selectedMarker, selected, time, motionTime);
			traceOrbit(selected, time, motionTime);
			drawTrail(hoverTrail, hovered === selected ? null : hovered, time, motionTime);
			drawTrail(selectedTrail, selected, time, motionTime);
		},
		dispose() {
			group.traverse((child) => {
				if (child instanceof THREE.Points || child instanceof THREE.Line) {
					child.geometry.dispose();
					(child.material as THREE.Material).dispose();
				}
			});
		},
	};
}
