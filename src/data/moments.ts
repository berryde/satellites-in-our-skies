import { type Catalog, launchTime } from "./catalog";

/** Named moments in the history, each tied to a satellite in the catalogue by its catalogue number. */
const MOMENTS = [
	{ satcat: "00002", label: "Sputnik 1, the first satellite", short: "Sputnik 1" },
	{ satcat: "00858", label: "First geostationary satellite", short: "Syncom 3" },
	{ satcat: "10684", label: "First GPS satellite", short: "GPS" },
	{ satcat: "25544", label: "Space Station's first module", short: "Space Station" },
	{ satcat: "44235", label: "First Starlink launch", short: "Starlink" },
];

export type Moment = {
	/** Index of the satellite in the catalogue. */
	index: number;
	/** Its launch, ms since 1970. */
	launched: number;
	label: string;
	/** A name short enough to sit on the timeline. */
	short: string;
};

/** The named moments that are in this catalogue, in date order. */
export function findMoments(catalog: Catalog): Moment[] {
	return MOMENTS.flatMap(({ satcat, label, short }) => {
		const index = catalog.satellites.satcat.indexOf(satcat);
		return index < 0 ? [] : [{ index, launched: launchTime(catalog, index), label, short }];
	});
}
