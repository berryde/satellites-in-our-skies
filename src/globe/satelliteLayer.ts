import * as THREE from "three";
import type { Catalog } from "../data/catalog";
import { reducedMotion } from "../state/store";
import { anglesAt, EQUATORIAL_RADIUS_KM, gmst, J2, KM_TO_UNITS, MU } from "./orbitMath";

/**
 * Every satellite as one point, positioned entirely on the GPU.
 *
 * Each point carries its orbital elements as vertex attributes, and the vertex
 * shader solves Kepler's equation for the current time (see orbitMath.ts for
 * the CPU twin). The CPU only updates a few uniforms per frame, so tens of
 * thousands of moving points stay cheap.
 *
 * float32 can't track orbital angles over decades (a LEO satellite turns ~10^6
 * radians in 20 years), so the CPU computes each orbit's angles in double
 * precision at an "anchor" time, and the shader only advances them by the few
 * days between the anchor and now. Anchors are 30 days apart, so this costs
 * one attribute upload per simulated month.
 */
const ANCHOR_STEP_SECONDS = 30 * 86_400;

/** A change in the moment drawn that is too big to be playback: more than the fastest moving speed covers in a slow frame. */
const LEAP_MS = 30 * 60_000;
const FADE_MS = 240;

/**
 * Launch blooms: a satellite arrives as a flare that settles into its point,
 * and on re-entry glows like an ember and falls to the surface. The flare is
 * timed in real seconds, whatever the playback speed, so it is the same
 * gesture in 1962 at a year per second as in 2021.
 */
const BLOOM_SECONDS = 1.1;
const EMBER_SECONDS = 0.9;
/** A step in the date bigger than this in one frame is a jump, not playback: nothing blooms. */
const JUMP_DAYS = 400;
/** How quickly the measured playback rate follows a change, in ms. */
const RATE_SETTLE_MS = 150;
/**
 * The arrival budget. Up to this many satellites flaring at once each get the
 * full flare. Beyond it each flare is shrunk so that the light of all of them
 * together stays about the same: the 1960s arrive one by one, the years after
 * 2019 as a fine shimmer across the shell rather than a white-out.
 */
const FULL_FLARES = 10;
/** The least a flare is ever scaled to: even in the busiest year an arrival is a spark. */
const SMALLEST_FLARE = 0.2;
/** How quickly the flare scale follows the count, in ms, so that it breathes rather than flickers. */
const BUDGET_SETTLE_MS = 300;

const vertexShader = /* glsl */ `
	attribute vec4 elementsA; // semi-major axis (km), eccentricity, inclination, RAAN at anchor
	attribute vec4 elementsB; // argument of perigee at anchor, mean anomaly at anchor, launch day, decay day
	attribute float orbitClass;
	attribute float operating;

	uniform float uDays;     // the date on display, in days since the data epoch: who is in orbit
	uniform float uSeconds;  // the moment positions are drawn for, in seconds since the anchor
	uniform float uGmst;     // Earth's rotation angle at that moment, radians
	uniform float uPointSize;
	uniform float uOpacity;
	uniform vec3 uColors[4];
	uniform float uClassVisible[4];
	uniform float uClassLevel[4]; // brightness of each class: one is picked out by dimming the others
	uniform float uField;         // brightness of everything but the selected satellite
	uniform float uInactive;      // brightness of a satellite that has stopped working
		uniform int uSelected;
	uniform float uBloomDays; // how many days of the date on display a bloom lasts, at the current rate
	uniform float uBloomScale; // how much of the full flare each arrival gets, from the arrival budget
	uniform float uEmberDays;
	uniform vec3 uEmber;


		varying vec3 vColor;
	varying float vLevel;
	varying float vHeat;

	const float MU = ${MU.toFixed(4)};
	const float J2 = ${J2.toExponential(8)};
	const float RE = ${EQUATORIAL_RADIUS_KM.toFixed(3)};
	const float KM_TO_UNITS = ${KM_TO_UNITS.toFixed(10)};

	void main() {
		float a = elementsA.x;
		float e = elementsA.y;
		float inc = elementsA.z;
		int cls = int(orbitClass + 0.5);

				bool inOrbit = elementsB.z <= uDays && uDays < elementsB.w;
		// Just come down: still drawn for a moment, burning up.
		float ember = uEmberDays > 0.0 ? (uDays - elementsB.w) / uEmberDays : 2.0;
		bool burning = ember >= 0.0 && ember < 1.0;
		if (!(inOrbit || burning) || uClassVisible[cls] < 0.5) {
			gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // outside the clip volume
			gl_PointSize = 0.0;
			return;
		}

		float n = sqrt(MU / (a * a * a));
		float p = a * (1.0 - e * e);
		float k = 1.5 * J2 * (RE / p) * (RE / p) * n;
		float ci = cos(inc);
		float raan = elementsA.w - k * ci * uSeconds;
		float argp = elementsB.x + 0.5 * k * (5.0 * ci * ci - 1.0) * uSeconds;
		float M = elementsB.y + n * uSeconds;

		// Kepler's equation, M = E - e sin E, by Newton's method.
		float E = M + e * sin(M);
		for (int j = 0; j < 5; j++) {
			E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
		}
		float xp = a * (cos(E) - e);
		float yp = a * sqrt(1.0 - e * e) * sin(E);

		// Perifocal -> inertial.
		float cO = cos(raan), sO = sin(raan);
		float cw = cos(argp), sw = sin(argp);
		float si = sin(inc);
		float x = (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp;
		float y = (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp;
		float z = (sw * si) * xp + (cw * si) * yp;

		// Inertial -> Earth-fixed -> globe.gl axes (y north, z at 0°E, x at 90°E).
		float cg = cos(uGmst), sg = sin(uGmst);
				vec3 position = vec3(-sg * x + cg * y, z, cg * x + sg * y) * KM_TO_UNITS;

		vColor = uColors[cls];
		bool selected = gl_VertexID == uSelected;
		vLevel = selected ? 1.0 : uClassLevel[cls] * uField * (operating > 0.5 ? 1.0 : uInactive);
		float size = selected ? 1.6 : mix(1.0, 1.6, clamp(uClassLevel[cls] - 1.0, 0.0, 1.0));
		vHeat = 0.0;

		// Launch: white-hot and wide, cooling into the class colour as it settles.
		float bloom = uBloomDays > 0.0 ? (uDays - elementsB.z) / uBloomDays : 2.0;
		if (inOrbit && bloom < 1.0) {
			float heat = (1.0 - bloom) * uBloomScale;
			vHeat = heat;
			vColor = mix(vColor, vec3(1.0), heat * heat * 0.85);
			vLevel = max(vLevel, 1.0) * (1.0 + heat);
			size *= 1.0 + 6.0 * heat;
		}
		// Re-entry: an orange ember that shrinks as it falls to the surface.
		if (burning) {
			float r = length(position);
			position *= mix(1.0, RE * KM_TO_UNITS / r, ember * ember);
			vColor = uEmber;
			vLevel = 1.6 * (1.0 - ember);
			size *= 1.4 * (1.0 - ember);
		}

		vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
		gl_Position = projectionMatrix * viewPosition;
		// Depth: a satellite on the near side of its shell is drawn larger and
		// brighter than one on the far side, so the shells read as shells and
		// not as a flat disc. Measured against the Earth's centre, so the cue
		// stays the same as the camera pulls back.
		float near = length(cameraPosition) / max(-viewPosition.z, 1.0);
		if (!selected) {
			size *= clamp(near, 0.55, 1.9);
			vLevel *= clamp(near * near, 0.3, 1.6);
		}
		gl_PointSize = uPointSize * size;
	}
`;

const fragmentShader = /* glsl */ `
		uniform float uOpacity;
	uniform float uBloomRing; // the ring is the first thing a crowded sky gives up
	varying vec3 vColor;
	varying float vLevel;
	varying float vHeat;

	void main() {
		float d = length(gl_PointCoord - 0.5);
		if (d > 0.5) discard;
		// A bright core with a soft skirt. The points add their light together,
		// so a crowded shell glows where a lone satellite is a single spark.
		float glow = smoothstep(0.5, 0.0, d);
		float light = glow * glow * 1.5 * vLevel;
		if (vHeat > 0.0) {
			// Arriving: the point is drawn large, so the core is kept tight, and a
			// thin ring runs outward from it, fading as the satellite cools.
			float scale = 1.0 + 6.0 * vHeat;
			float core = smoothstep(0.5 / scale, 0.0, d);
			float ring = smoothstep(0.035, 0.0, abs(d - mix(0.47, 0.08, vHeat))) * vHeat * 0.9 * uBloomRing;
			light = core * core * 1.5 * vLevel + ring + glow * glow * glow * vHeat * 0.35;
		}
		gl_FragColor = vec4(vColor, min(1.0, light) * uOpacity);
	}
`;

/** What the eye is being led to, by dimming the rest. */
export type Focus = {
	/** The selected satellite, which stays bright while the field dims around it. */
	selected: number | null;
	/** An orbit class being pointed at in the legend. */
	orbitClass: number | null;
	/** Whether satellites that have stopped working are drawn fainter. */
	dimInactive: boolean;
};

const FIELD_AROUND_SELECTION = 0.45;
/** A class pointed at in the legend is drawn brighter and larger, since some classes are sparse. */
const CLASS_IN_FOCUS = 2;
const CLASS_OUT_OF_FOCUS = 0.12;
const INACTIVE = 0.3;
/** How quickly a level settles on its target: the time to cover most of the distance, in ms. */
const SETTLE_MS = 140;

export type SatelliteLayer = {
	object: THREE.Points;
	/**
	 * `time` decides who is in orbit; `motionTime` decides where each one is.
	 * They differ while the sky is held still (see STILL_FROM in store.ts).
	 */
	update: (time: number, motionTime: number, now: number, focus: Focus) => void;
	setClassVisible: (visible: boolean[]) => void;
	dispose: () => void;
};

export function createSatelliteLayer(catalog: Catalog, colors: string[]): SatelliteLayer {
	const { count, orbits: o } = catalog;
	const elementsA = new Float32Array(count * 4);
	const elementsB = new Float32Array(count * 4);
	for (let i = 0; i < count; i++) {
		elementsA.set([o.semiMajorAxisKm[i], o.eccentricity[i], o.inclination[i], 0], i * 4);
		elementsB.set([0, 0, o.launchDays[i], o.decayDays[i]], i * 4);
	}

	const geometry = new THREE.BufferGeometry();
	// Positions are computed in the shader; this attribute only sets the draw count.
	geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
	const attributeA = new THREE.BufferAttribute(elementsA, 4);
	const attributeB = new THREE.BufferAttribute(elementsB, 4);
	geometry.setAttribute("elementsA", attributeA);
	geometry.setAttribute("elementsB", attributeB);
	geometry.setAttribute("orbitClass", new THREE.BufferAttribute(o.orbitClass, 1));
	geometry.setAttribute("operating", new THREE.BufferAttribute(Float32Array.from(catalog.satellites.active), 1));

	const uniforms = {
		uDays: { value: 0 },
		uSeconds: { value: 0 },
		uGmst: { value: 0 },
		uPointSize: { value: 4 * Math.min(window.devicePixelRatio, 2) },
		uOpacity: { value: 1 },
		uColors: { value: colors.map((c) => new THREE.Color(c)) },
		uClassVisible: { value: colors.map(() => 1) },
		uClassLevel: { value: colors.map(() => 1) },
		uField: { value: 1 },
		uInactive: { value: 1 },
				uSelected: { value: -1 },
		uBloomDays: { value: 0 },
		uBloomScale: { value: 1 },
		uBloomRing: { value: 1 },
		uEmberDays: { value: 0 },
		uEmber: { value: new THREE.Color("#ff8a3d") },
	};

	const material = new THREE.ShaderMaterial({
		uniforms,
		vertexShader,
		fragmentShader,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false, // points don't hide each other, but the Earth still hides them
	});

	const object = new THREE.Points(geometry, material);
	object.frustumCulled = false; // the real positions only exist in the shader

	let anchor = Number.NaN;
	let lastMotion = Number.NaN;
	let fadeStart = -FADE_MS;
		let lastFrame = Number.NaN;
	let lastTime = Number.NaN;
	/** Days of the date on display per real second, smoothed. */
	let rate = 0;
	// Launch days in order, so the satellites flaring at any moment can be counted with two binary searches.
	const launchOrder = Float32Array.from(o.launchDays).sort();
	/** How many launches fall on or before `days`. */
	const launchedBy = (days: number) => {
		let lo = 0;
		let hi = launchOrder.length;
		while (lo < hi) {
			const mid = (lo + hi) >>> 1;
			if (launchOrder[mid] <= days) lo = mid + 1;
			else hi = mid;
		}
		return lo;
	};
	function setAnchor(seconds: number) {
		anchor = seconds;
		for (let i = 0; i < count; i++) {
			const { raan, argp, anomaly } = anglesAt(catalog, i, seconds);
			elementsA[i * 4 + 3] = raan;
			elementsB[i * 4] = argp;
			elementsB[i * 4 + 1] = anomaly;
		}
		attributeA.needsUpdate = true;
		attributeB.needsUpdate = true;
	}

	return {
		object,
		update(time, motionTime, now, focus) {
			// Levels ease to their targets, so that focus arrives and leaves without a flash.
						const frameMs = now - lastFrame;
			const k = reducedMotion || Number.isNaN(lastFrame) ? 1 : 1 - Math.exp(-frameMs / SETTLE_MS);
			lastFrame = now;

			// The playback rate, measured from how far the date moved this frame. A jump
			// (a moment picked, a link followed) stops every bloom rather than starting thousands.
			const stepDays = (time - lastTime) / 86_400_000;
			lastTime = time;
			if (!(Math.abs(stepDays) < JUMP_DAYS) || !(frameMs > 0)) rate = 0;
			else rate += (Math.abs(stepDays) / (frameMs / 1000) - rate) * (1 - Math.exp(-frameMs / RATE_SETTLE_MS));
			// Flares and embers belong to time running forward. Run backward (the
			// opening's rewind, a drag to the left) the satellites simply go out.
			const forward = stepDays >= 0;
			uniforms.uBloomDays.value = reducedMotion || !forward ? 0 : rate * BLOOM_SECONDS;
			uniforms.uEmberDays.value = reducedMotion || !forward ? 0 : rate * EMBER_SECONDS;
			// The arrival budget: the more satellites flaring at once, the smaller each flare.
			const days = (time - catalog.epoch) / 86_400_000;
			const bloomDays = uniforms.uBloomDays.value;
			const flaring = bloomDays > 0 ? launchedBy(days) - launchedBy(days - bloomDays) : 0;
			const budget = Math.max(SMALLEST_FLARE, Math.min(1, Math.sqrt(FULL_FLARES / Math.max(flaring, 1))));
			const breathe = Number.isNaN(frameMs) || !(frameMs > 0) ? 1 : 1 - Math.exp(-frameMs / BUDGET_SETTLE_MS);
			uniforms.uBloomScale.value += (budget - uniforms.uBloomScale.value) * breathe;
			// Rings go first: full until the budget halves each flare, gone by a quarter.
			const scale = uniforms.uBloomScale.value;
			uniforms.uBloomRing.value = Math.min(1, Math.max(0, (scale - 0.25) / 0.25));
			const ease = (uniform: { value: number }, target: number) => {
				uniform.value += (target - uniform.value) * k;
			};
			const levels = uniforms.uClassLevel.value;
			for (let c = 0; c < levels.length; c++) {
				const target = focus.orbitClass === null ? 1 : focus.orbitClass === c ? CLASS_IN_FOCUS : CLASS_OUT_OF_FOCUS;
				levels[c] += (target - levels[c]) * k;
			}
			ease(uniforms.uField, focus.selected === null ? 1 : FIELD_AROUND_SELECTION);
			ease(uniforms.uInactive, focus.dimInactive ? INACTIVE : 1);
			uniforms.uSelected.value = focus.selected ?? -1;

			const seconds = (motionTime - catalog.epoch) / 1000;
			const nearest = Math.round(seconds / ANCHOR_STEP_SECONDS) * ANCHOR_STEP_SECONDS;
			if (nearest !== anchor) setAnchor(nearest);
			// When the positions leap (the sky let go after being held still, the
			// replay starting over, a jump along the timeline), every point would
			// teleport at once. They fade back in at their new places instead.
			if (Math.abs(motionTime - lastMotion) > LEAP_MS && !reducedMotion) fadeStart = now;
			lastMotion = motionTime;
			const t = Math.min((now - fadeStart) / FADE_MS, 1);
			uniforms.uOpacity.value = 1 - (1 - t) ** 3;
			uniforms.uDays.value = (time - catalog.epoch) / 86_400_000;
			uniforms.uSeconds.value = seconds - anchor;
			uniforms.uGmst.value = gmst(motionTime);
		},
		setClassVisible(visible) {
			uniforms.uClassVisible.value = visible.map((v) => (v ? 1 : 0));
		},
		dispose() {
			geometry.dispose();
			material.dispose();
		},
	};
}
