import { type Catalog, DAY_MS, STILL_IN_ORBIT_DAYS, catalogMoment, launchTime } from "../data/catalog";
import { inOrbit } from "../globe/orbitMath";
import { useSelection } from "./selection";
import { useSim } from "./store";

/** A moment (ms since 1970) soon after a satellite's launch, while it is certainly up. */
export function soonAfterLaunch(catalog: Catalog, index: number): number {
	const launched = launchTime(catalog, index);
	const decayDays = catalog.orbits.decayDays[index];
	if (decayDays >= STILL_IN_ORBIT_DAYS) return launched + DAY_MS;
	// A few came down within the day: stop halfway through their time up.
	return launched + Math.min(DAY_MS, (catalogMoment(catalog, decayDays) - launched) / 2);
}

/** Pauses just after a satellite's launch, selects it and turns the globe to face it. */
export function showAtLaunch(catalog: Catalog, index: number): void {
	const { setTime, setPlaying } = useSim.getState();
	setTime(soonAfterLaunch(catalog, index));
	setPlaying(false);
	useSelection.getState().selectAndFocus(index);
}

/**
 * Selects a satellite and turns the globe to face it. If it is not in orbit at
 * the moment on display, goes to just after its launch so there is something to see.
 */
export function showSatellite(catalog: Catalog, index: number): void {
	if (inOrbit(catalog, index, useSim.getState().time)) useSelection.getState().selectAndFocus(index);
	else showAtLaunch(catalog, index);
}
