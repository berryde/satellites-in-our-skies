/** Loads the files written by pipeline/build.py. */

export type OrbitColumn =
	| "semiMajorAxisKm"
	| "eccentricity"
	| "inclination"
	| "raan"
	| "argPerigee"
	| "meanAnomaly"
	| "launchDays"
	| "decayDays"
	| "orbitClass";

type Code = { code: string; name: string };

type CatalogJson = {
	generatedAt: string;
	epoch: string;
	count: number;
	columns: OrbitColumn[];
	orbitClasses: string[];
	countries: Code[];
	owners: Code[];
	satellites: {
		name: string[];
		/** NORAD catalogue number, or GCAT's ID for objects without one. */
		satcat: string[];
		country: number[];
		owner: number[];
		/** 1 if currently operating (GCAT's judgement, sometimes a guess). */
		active: number[];
	};
	sources: string[];
};

export type Catalog = Omit<CatalogJson, "epoch"> & {
	/** Reference epoch (ms since 1970) that the orbit columns are relative to. */
	epoch: number;
	/** One Float32Array per orbit column, each `count` long. */
	orbits: Record<OrbitColumn, Float32Array>;
};

const url = (path: string) => `${import.meta.env.BASE_URL}data/${path}`;

export async function loadCatalog(): Promise<Catalog> {
	const get = async (path: string) => {
		const response = await fetch(url(path));
		if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
		return response;
	};
	const [json, buffer] = await Promise.all([
		get("catalog.json").then((r) => r.json() as Promise<CatalogJson>),
		get("orbits.bin").then((r) => r.arrayBuffer()),
	]);

	const all = new Float32Array(buffer);
	if (all.length !== json.count * json.columns.length) {
		throw new Error("orbits.bin does not match catalog.json; re-run the pipeline");
	}
	const orbits = Object.fromEntries(
		json.columns.map((column, i) => [column, all.subarray(i * json.count, (i + 1) * json.count)]),
	) as Record<OrbitColumn, Float32Array>;

	return { ...json, epoch: Date.parse(json.epoch), orbits };
}

export const DAY_MS = 86_400_000;

/**
 * What each orbit class is called on screen, keyed by the pipeline's name for
 * it, with a few words on where it is. Classes follow GCAT's orbit categories.
 */
const ORBIT_CLASS_WORDS: Record<string, { name: string; where: string }> = {
	LEO: { name: "Low orbit", where: "below 2,000 km" },
	MEO: { name: "Medium orbit", where: "2,000 to 35,000 km" },
	// GCAT's GEO covers everything that laps once a day, not only the strictly stationary.
	GEO: { name: "High orbit", where: "36,000 km, one lap a day" },
	Elliptical: { name: "Elliptical", where: "stretched: near, then far" },
};

export function orbitClassWords(catalog: Catalog, orbitClass: number): { name: string; where: string } {
	const code = catalog.orbitClasses[orbitClass];
	return ORBIT_CLASS_WORDS[code] ?? { name: code, where: "" };
}

/** decayDays at or above this means the satellite has not re-entered (see pipeline/build.py). */
export const STILL_IN_ORBIT_DAYS = 1e7;

/** Number of satellites in orbit at `time` (ms since 1970), per orbit class. */
export function countInOrbit(catalog: Catalog, time: number): number[] {
	const days = (time - catalog.epoch) / DAY_MS;
	const { launchDays, decayDays, orbitClass } = catalog.orbits;
	const counts = catalog.orbitClasses.map(() => 0);
	for (let i = 0; i < catalog.count; i++) {
		if (launchDays[i] <= days && days < decayDays[i]) counts[orbitClass[i]]++;
	}
	return counts;
}

/**
 * The moment (ms since 1970) that a launchDays or decayDays value stands for.
 * Float32 days are only good to a couple of minutes this far from the epoch,
 * so the result is rounded to ten: otherwise a midnight launch can land on
 * the evening before and show the wrong date.
 */
export function catalogMoment(catalog: Catalog, days: number): number {
	const TEN_MINUTES = 600_000;
	return Math.round((catalog.epoch + days * DAY_MS) / TEN_MINUTES) * TEN_MINUTES;
}

/** Launch moment (ms since 1970) of the satellite at `index`. */
export function launchTime(catalog: Catalog, index: number): number {
	return catalogMoment(catalog, catalog.orbits.launchDays[index]);
}

/**
 * Satellites in orbit per orbit class at `samples` evenly spaced moments from
 * `start` to `end` (ms since 1970): one array per class, each `samples` long.
 */
export function orbitHistory(catalog: Catalog, start: number, end: number, samples: number): number[][] {
	const { launchDays, decayDays, orbitClass } = catalog.orbits;
	const step = (end - start) / (samples - 1);
	// The first sample at or after a moment given in days from the catalogue epoch.
	const sampleAt = (days: number) =>
		Math.max(0, Math.ceil((catalog.epoch + days * DAY_MS - start) / step));

	// Mark where each satellite enters and leaves, then run a total along each class.
	const history = catalog.orbitClasses.map(() => new Array<number>(samples).fill(0));
	for (let i = 0; i < catalog.count; i++) {
		const changes = history[orbitClass[i]];
		const launched = sampleAt(launchDays[i]);
		const decayed = sampleAt(decayDays[i]);
		if (launched < samples) changes[launched]++;
		if (decayed < samples) changes[decayed]--;
	}
	for (const counts of history) {
		for (let j = 1; j < samples; j++) counts[j] += counts[j - 1];
	}
	return history;
}
