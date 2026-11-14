import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type Catalog, DAY_MS, STILL_IN_ORBIT_DAYS, catalogMoment, launchTime, orbitClassWords } from "../data/catalog";
import { MU, inOrbit } from "../globe/orbitMath";
import { useSelection } from "../state/selection";
import { showAtLaunch } from "../state/show";
import { inLastDay } from "../state/store";
import { useThrottledTime } from "./useThrottledTime";

const EARTH_RADIUS_KM = 6378.137;
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeZone: "UTC" });
const whole = (value: number) => Math.round(value).toLocaleString();

/** A span of time in the largest unit that reads naturally: "9 days", "7 months", "36 years". */
function duration(ms: number): string {
	const days = ms / DAY_MS;
	const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
	if (days < 1) return "less than a day";
	if (days < 61) return plural(Math.floor(days), "day");
	if (days < 730) return plural(Math.floor(days / 30.44), "month");
	return plural(Math.floor(days / 365.25), "year");
}

/** Name label that follows the pointer while hovering a satellite. */
export function HoverLabel({ catalog }: { catalog: Catalog }) {
	const hovered = useSelection((s) => s.hovered);
	const pointer = useSelection((s) => s.pointer);
	const selected = useSelection((s) => s.selected);
	const label = useRef<HTMLDivElement>(null);
	const shown = hovered !== null && hovered !== selected;

	// Below and to the right of the pointer, switching to the other side of it
	// where the label would run off the edge of the window.
	useLayoutEffect(() => {
		const element = label.current;
		const bounds = element?.offsetParent;
		if (!element || !bounds) return;
		const GAP = 14;
		const fitsRight = pointer.x + GAP + element.offsetWidth <= bounds.clientWidth;
		const fitsBelow = pointer.y + GAP + element.offsetHeight <= bounds.clientHeight;
		element.style.left = `${fitsRight ? pointer.x + GAP : Math.max(0, pointer.x - GAP - element.offsetWidth)}px`;
		element.style.top = `${fitsBelow ? pointer.y + GAP : Math.max(0, pointer.y - GAP - element.offsetHeight)}px`;
	}, [pointer, hovered, shown]);

	if (!shown) return null;
	return (
		<div
			ref={label}
			className="plate pointer-events-none absolute rounded-[3px] px-2 py-1 text-xs whitespace-nowrap"
		>
			{catalog.satellites.name[hovered]}
			<span className="ml-1.5 text-gray-400 tabular-nums">{new Date(launchTime(catalog, hovered)).getUTCFullYear()}</span>
		</div>
	);
}

/** Details of the selected satellite. */
export function SatelliteDetails({ catalog, colors }: { catalog: Catalog; colors: string[] }) {
	const selected = useSelection((s) => s.selected);
	const select = useSelection((s) => s.select);
	const following = useSelection((s) => s.following);
	// On a phone the card opens as a short summary; the full list is one tap away.
	const [more, setMore] = useState(false);
	useEffect(() => setMore(false), [selected]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && select(null);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [select]);

	const time = useThrottledTime(250);

	// Always present, so that a screen reader hears when a satellite is picked on the globe.
	const announcement = (
		<p role="status" className="sr-only">
			{selected === null ? "" : `Showing details for ${catalog.satellites.name[selected]}`}
		</p>
	);
	if (selected === null) return announcement;

	const o = catalog.orbits;
	const s = catalog.satellites;
	const a = o.semiMajorAxisKm[selected];
	const e = o.eccentricity[selected];
	const orbitClass = o.orbitClass[selected];
	const periodMinutes = (2 * Math.PI * Math.sqrt((a * a * a) / MU)) / 60;
	const launched = catalogMoment(catalog, o.launchDays[selected]);
	const decayed =
		o.decayDays[selected] < STILL_IN_ORBIT_DAYS ? catalogMoment(catalog, o.decayDays[selected]) : null;

	const lowest = whole(a * (1 - e) - EARTH_RADIUS_KM);
	const highest = whole(a * (1 + e) - EARTH_RADIUS_KM);
	const words = orbitClassWords(catalog, orbitClass);

	// Its life first: when it went up, how long it has been there (on the date
	// shown), and how it ended or whether it still works. Then where it is.
	const up = time >= launched && (decayed === null || time < decayed);
	const working = s.active[selected] ? "operating" : "no longer operating";
	const present = inLastDay(time);
	const rows: [string, string][] = [
		["Launched", dateFormat.format(launched)],
		...(decayed !== null
			? [["Re-entered", `${dateFormat.format(decayed)}, after ${duration(decayed - launched)}`] as [string, string]]
			: []),
		...(up && !(present && decayed === null)
			? [["On this date", `${duration(time - launched)} after launch`] as [string, string]]
			: []),
		...(decayed === null
			? [["Today", present ? `${duration(time - launched)} in orbit, ${working}` : `Still in orbit, ${working}`] as [string, string]]
			: []),
		["Owner", catalog.owners[s.owner[selected]].name],
		["Country", catalog.countries[s.country[selected]].name],
		["Altitude", lowest === highest ? `${lowest} km` : `${lowest} to ${highest} km`],
		["Orbit tilt", `${((o.inclination[selected] * 180) / Math.PI).toFixed(1)}° from the equator`],
		[
			"One orbit takes",
			periodMinutes < 120 ? `${periodMinutes.toFixed(0)} minutes` : `${(periodMinutes / 60).toFixed(1)} hours`,
		],
		// Objects outside the US catalog are identified by their GCAT ID (e.g. "A08425").
		[/^\d/.test(s.satcat[selected]) ? "Catalogue ID" : "GCAT ID", s.satcat[selected]],
	];

	const altitude = lowest === highest ? `${lowest} km` : `${lowest}–${highest} km`;
	const lap = periodMinutes < 120 ? `${periodMinutes.toFixed(0)} min` : `${(periodMinutes / 60).toFixed(1)} h`;
	const summary: [string, string][] = [
		["Altitude", altitude],
		["One orbit", lap],
		[decayed === null ? "Launched" : "In orbit", decayed === null ? String(new Date(launched).getUTCFullYear()) : `${new Date(launched).getUTCFullYear()}–${new Date(decayed).getUTCFullYear()}`],
	];

	// Scrubbing to before its launch or after its re-entry leaves nothing to mark on the globe.
	const missing = inOrbit(catalog, selected, time)
		? null
		: time < launched
			? "Not yet launched on this date."
			: "No longer in orbit on this date.";

	return (
		<>
			{announcement}
			{/* On a phone this is a sheet along the bottom, where the timeline was. */}
			<aside aria-label="Satellite details" className="absolute top-4 right-4 max-h-[calc(100dvh-2rem)] w-[min(20rem,calc(100%-2rem))] plate overflow-y-auto p-4 transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none starting:translate-y-1 starting:opacity-0 max-sm:top-auto max-sm:bottom-4 max-sm:left-4 max-sm:max-h-[60dvh] max-sm:w-auto sm:top-[4.25rem] sm:right-6 sm:max-h-[calc(100dvh-5.25rem)]">
				<div className="mb-3 flex items-start gap-2 max-sm:mb-2">
					<div className="min-w-0 flex-1">
						<h2 className="text-xl leading-tight font-semibold break-words [font-stretch:112.5%] max-sm:text-lg">{s.name[selected]}</h2>
						<p className="flex items-center gap-1.5 text-sm text-gray-400">
							<span className="size-2 rounded-full" style={{ background: colors[orbitClass] }} />
							{words.name}
							{words.where && `, ${words.where}`}
						</p>
					</div>
					<button
						type="button"
						onClick={() => select(null)}
						aria-label="Close"
						className="-mt-1 -mr-1 grid size-8 place-items-center rounded text-gray-400 hover:bg-white/10 hover:text-white pointer-coarse:size-11"
					>
						<svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
							<path d="M1 1l10 10M11 1L1 11" />
						</svg>
					</button>
				</div>
				{/* A phone gets the three numbers that say most about it, as readouts. */}
				{!more && (
					<dl className="mb-3 grid grid-cols-3 gap-2 sm:hidden">
						{summary.map(([label, value]) => (
							<div key={label}>
								<dt className="caps text-gray-400">{label}</dt>
								<dd className="mt-1 text-sm whitespace-nowrap tabular-nums">{value}</dd>
							</div>
						))}
					</dl>
				)}
				{missing && (
					<div className="mb-3 rounded-[3px] border border-white/15 bg-white/5 p-3 text-sm">
						<p>{missing}</p>
						<button
							type="button"
							onClick={() => showAtLaunch(catalog, selected)}
							className="btn mt-2 min-h-8 px-3 pointer-coarse:min-h-11"
						>
							Go to its launch
						</button>
					</div>
				)}
				<div className={`mb-3 flex items-center gap-2 ${more ? "" : "max-sm:mb-0"}`}>
					{!missing && (
						<button
							type="button"
							aria-pressed={following}
							onClick={() => (following ? useSelection.getState().stopFollowing() : useSelection.getState().selectAndFocus(selected))}
							className="flex min-h-9 items-center gap-2 rounded-full border border-white/20 px-3 text-sm hover:border-white/50 hover:bg-white/10 aria-pressed:border-white/60 aria-pressed:bg-white/10 pointer-coarse:min-h-11"
						>
							{/* A sight: the camera keeps this satellite in the middle of the view. */}
							<svg viewBox="0 0 14 14" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
								<circle cx="7" cy="7" r="4" />
								<path d="M7 0.5v3M7 10.5v3M0.5 7h3M10.5 7h3" />
							</svg>
							{following ? "Following" : "Follow"}
						</button>
					)}
					<button
						type="button"
						aria-expanded={more}
						onClick={() => setMore(!more)}
						// The same capsule as Follow, beside it: the two things this card can do.
						className="flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 px-3 text-sm hover:border-white/50 hover:bg-white/10 sm:hidden pointer-coarse:min-h-11"
					>
						{more ? "Less" : "More"}
						<svg viewBox="0 0 10 6" className={`h-1.5 w-2.5 transition-transform duration-200 motion-reduce:transition-none ${more ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M1 1l4 4 4-4" />
						</svg>
					</button>
				</div>
				<dl className={`grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm ${more ? "" : "max-sm:hidden"}`}>
					{rows.map(([label, value]) => (
						<div key={label} className="contents">
							<dt className="text-gray-400">{label}</dt>
							<dd className="min-w-0 break-words tabular-nums">{value}</dd>
						</div>
					))}
				</dl>
				<p className={`mt-3 border-t border-white/10 pt-3 text-xs text-gray-400 ${more ? "" : "max-sm:hidden"}`}>
					Height, shape and tilt are real. Which way the orbit faces, and where on it the satellite sits, are illustrative.
				</p>
			</aside>
		</>
	);
}
