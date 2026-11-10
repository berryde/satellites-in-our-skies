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
	const [json, buffer] = await Promise.all([
		fetch(url("catalog.json")).then((r) => r.json() as Promise<CatalogJson>),
		fetch(url("orbits.bin")).then((r) => r.arrayBuffer()),
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
