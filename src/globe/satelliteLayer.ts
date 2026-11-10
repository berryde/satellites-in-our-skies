import * as THREE from "three";
import type { Catalog } from "../data/catalog";
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

const vertexShader = /* glsl */ `
	attribute vec4 elementsA; // semi-major axis (km), eccentricity, inclination, RAAN at anchor
	attribute vec4 elementsB; // argument of perigee at anchor, mean anomaly at anchor, launch day, decay day
	attribute float orbitClass;

	uniform float uDays;     // days since the data epoch
	uniform float uSeconds;  // seconds since the anchor
	uniform float uGmst;     // Earth's rotation angle, radians
	uniform float uPointSize;
	uniform vec3 uColors[4];
	uniform float uClassVisible[4];

	varying vec3 vColor;

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
		if (!inOrbit || uClassVisible[cls] < 0.5) {
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
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		gl_PointSize = uPointSize;
	}
`;

const fragmentShader = /* glsl */ `
	varying vec3 vColor;

	void main() {
		float d = length(gl_PointCoord - 0.5);
		if (d > 0.5) discard;
		gl_FragColor = vec4(vColor, smoothstep(0.5, 0.2, d));
	}
`;

export type SatelliteLayer = {
	object: THREE.Points;
	update: (time: number) => void;
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

	const uniforms = {
		uDays: { value: 0 },
		uSeconds: { value: 0 },
		uGmst: { value: 0 },
		uPointSize: { value: 2.5 * Math.min(window.devicePixelRatio, 2) },
		uColors: { value: colors.map((c) => new THREE.Color(c)) },
		uClassVisible: { value: colors.map(() => 1) },
	};

	const material = new THREE.ShaderMaterial({
		uniforms,
		vertexShader,
		fragmentShader,
		transparent: true,
		depthWrite: false, // points don't hide each other, but the Earth still hides them
	});

	const object = new THREE.Points(geometry, material);
	object.frustumCulled = false; // the real positions only exist in the shader

	let anchor = Number.NaN;
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
		update(time) {
			const seconds = (time - catalog.epoch) / 1000;
			const nearest = Math.round(seconds / ANCHOR_STEP_SECONDS) * ANCHOR_STEP_SECONDS;
			if (nearest !== anchor) setAnchor(nearest);
			uniforms.uDays.value = seconds / 86_400;
			uniforms.uSeconds.value = seconds - anchor;
			uniforms.uGmst.value = gmst(time);
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
