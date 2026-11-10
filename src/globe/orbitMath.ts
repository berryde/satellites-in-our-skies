/**
 * Two-body orbits with first-order J2 drift (the Earth's equatorial bulge
 * slowly rotating each orbit's plane and ellipse). This is the CPU twin of the
 * vertex shader in satelliteLayer.ts: both must stay in step, so the
 * satellite a user hovers on the CPU is the dot the GPU drew.
 */
import type { Catalog } from "../data/catalog";

export const MU = 398600.4418; // km^3/s^2
export const J2 = 1.08262668e-3;
export const EQUATORIAL_RADIUS_KM = 6378.137;
export const TAU = Math.PI * 2;

/** globe.gl draws the Earth with a radius of 100 scene units. */
export const GLOBE_RADIUS = 100;
export const KM_TO_UNITS = GLOBE_RADIUS / 6371;

const wrap = (angle: number) => ((angle % TAU) + TAU) % TAU;

/** Mean motion and J2 drift rates, all in radians per second. */
export function rates(a: number, e: number, inc: number) {
	const n = Math.sqrt(MU / (a * a * a));
	const p = a * (1 - e * e);
	const k = 1.5 * J2 * (EQUATORIAL_RADIUS_KM / p) ** 2 * n;
	const ci = Math.cos(inc);
	return { n, raanRate: -k * ci, argpRate: 0.5 * k * (5 * ci * ci - 1) };
}

/** RAAN, argument of perigee and mean anomaly of satellite `i`, `seconds` after the data epoch. */
export function anglesAt(catalog: Catalog, i: number, seconds: number) {
	const o = catalog.orbits;
	const { n, raanRate, argpRate } = rates(o.semiMajorAxisKm[i], o.eccentricity[i], o.inclination[i]);
	return {
		raan: wrap(o.raan[i] + raanRate * seconds),
		argp: wrap(o.argPerigee[i] + argpRate * seconds),
		anomaly: wrap(o.meanAnomaly[i] + n * seconds),
	};
}

/** Greenwich mean sidereal time (radians) at `time` ms since 1970. */
export function gmst(time: number): number {
	const daysSinceJ2000 = time / 86_400_000 + 2440587.5 - 2451545.0;
	return wrap(((280.46061837 + 360.98564736629 * daysSinceJ2000) * Math.PI) / 180);
}

/**
 * Scene position of an orbit point, written into `out` as [x, y, z].
 * Solves Kepler's equation for the mean anomaly, then rotates perifocal ->
 * inertial -> Earth-fixed -> globe.gl's axes (y north, z at 0°E, x at 90°E).
 */
export function orbitPoint(
	a: number,
	e: number,
	inc: number,
	raan: number,
	argp: number,
	anomaly: number,
	earthAngle: number,
	out: number[],
) {
	let E = anomaly + e * Math.sin(anomaly);
	for (let j = 0; j < 5; j++) E -= (E - e * Math.sin(E) - anomaly) / (1 - e * Math.cos(E));
	const xp = a * (Math.cos(E) - e);
	const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

	const cO = Math.cos(raan), sO = Math.sin(raan);
	const cw = Math.cos(argp), sw = Math.sin(argp);
	const ci = Math.cos(inc), si = Math.sin(inc);
	const x = (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp;
	const y = (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp;
	const z = sw * si * xp + cw * si * yp;

	const cg = Math.cos(earthAngle), sg = Math.sin(earthAngle);
	out[0] = (-sg * x + cg * y) * KM_TO_UNITS;
	out[1] = z * KM_TO_UNITS;
	out[2] = (cg * x + sg * y) * KM_TO_UNITS;
}

/** Scene position of satellite `i` at `time` (ms since 1970). */
export function satellitePosition(catalog: Catalog, i: number, time: number, out: number[]) {
	const o = catalog.orbits;
	const { raan, argp, anomaly } = anglesAt(catalog, i, (time - catalog.epoch) / 1000);
	orbitPoint(o.semiMajorAxisKm[i], o.eccentricity[i], o.inclination[i], raan, argp, anomaly, gmst(time), out);
}

/** Whether satellite `i` is in orbit at `time`. */
export function inOrbit(catalog: Catalog, i: number, time: number): boolean {
	const days = (time - catalog.epoch) / 86_400_000;
	return catalog.orbits.launchDays[i] <= days && days < catalog.orbits.decayDays[i];
}
