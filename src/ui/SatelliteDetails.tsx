import { useEffect } from "react";
import { type Catalog, DAY_MS, STILL_IN_ORBIT_DAYS } from "../data/catalog";
import { MU } from "../globe/orbitMath";
import { useSelection } from "../state/selection";

const EARTH_RADIUS_KM = 6378.137;
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeZone: "UTC" });
const km = (value: number) => `${Math.round(value).toLocaleString()} km`;

/** Name label that follows the pointer while hovering a satellite. */
export function HoverLabel({ catalog }: { catalog: Catalog }) {
	const hovered = useSelection((s) => s.hovered);
	const pointer = useSelection((s) => s.pointer);
	const selected = useSelection((s) => s.selected);
	if (hovered === null || hovered === selected) return null;
	return (
		<div
			className="pointer-events-none absolute rounded bg-black/75 px-2 py-1 text-xs whitespace-nowrap"
			style={{ left: pointer.x + 14, top: pointer.y + 14 }}
		>
			{catalog.satellites.name[hovered]}
		</div>
	);
}

/** Details of the selected satellite. */
export function SatelliteDetails({ catalog, colors }: { catalog: Catalog; colors: string[] }) {
	const selected = useSelection((s) => s.selected);
	const select = useSelection((s) => s.select);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && select(null);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [select]);

	if (selected === null) return null;

	const o = catalog.orbits;
	const s = catalog.satellites;
	const a = o.semiMajorAxisKm[selected];
	const e = o.eccentricity[selected];
	const orbitClass = o.orbitClass[selected];
	const periodMinutes = (2 * Math.PI * Math.sqrt((a * a * a) / MU)) / 60;
	const launched = catalog.epoch + o.launchDays[selected] * DAY_MS;
	const decayed =
		o.decayDays[selected] < STILL_IN_ORBIT_DAYS ? catalog.epoch + o.decayDays[selected] * DAY_MS : null;

	const rows: [string, string][] = [
		["Owner", catalog.owners[s.owner[selected]].name],
		["Country", catalog.countries[s.country[selected]].name],
		["Altitude", `${km(a * (1 - e) - EARTH_RADIUS_KM)} – ${km(a * (1 + e) - EARTH_RADIUS_KM)}`],
		["Inclination", `${((o.inclination[selected] * 180) / Math.PI).toFixed(1)}°`],
		["Period", periodMinutes < 120 ? `${periodMinutes.toFixed(0)} min` : `${(periodMinutes / 60).toFixed(1)} h`],
		["Launched", dateFormat.format(launched)],
		decayed === null
			? ["Status", s.active[selected] ? "In orbit, operating" : "In orbit, inactive"]
			: ["Re-entered", dateFormat.format(decayed)],
		// Objects outside the US catalog are identified by their GCAT ID (e.g. "A08425").
		[/^\d/.test(s.satcat[selected]) ? "NORAD ID" : "GCAT ID", s.satcat[selected]],
	];

	return (
		<aside className="absolute top-4 right-4 w-[min(20rem,calc(100%-2rem))] rounded-xl bg-black/70 p-4 backdrop-blur sm:top-6 sm:right-6">
			<div className="mb-3 flex items-start gap-2">
				<div className="flex-1">
					<h2 className="font-semibold">{s.name[selected]}</h2>
					<p className="flex items-center gap-1.5 text-sm text-gray-400">
						<span className="size-2 rounded-full" style={{ background: colors[orbitClass] }} />
						{catalog.orbitClasses[orbitClass]}
					</p>
				</div>
				<button
					type="button"
					onClick={() => select(null)}
					aria-label="Close"
					className="rounded px-2 text-lg leading-none text-gray-400 hover:bg-white/10 hover:text-white"
				>
					×
				</button>
			</div>
			<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
				{rows.map(([label, value]) => (
					<div key={label} className="contents">
						<dt className="text-gray-400">{label}</dt>
						<dd className="tabular-nums">{value}</dd>
					</div>
				))}
			</dl>
		</aside>
	);
}
