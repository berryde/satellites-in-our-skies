import { useEffect, useMemo, useRef } from "react";
import { type Catalog, DAY_MS, countInOrbit, launchTime } from "../data/catalog";
import { findMoments } from "../data/moments";
import { useSelection } from "../state/selection";
import { showSatellite, soonAfterLaunch } from "../state/show";
import { type IntroBeat, useSim } from "../state/store";
import { useThrottledTime } from "./useThrottledTime";

/**
 * Seconds the sweep travels to each moment and holds on it. The first travel is
 * the rewind: from today's sky back to Sputnik alone, the satellites going out
 * newest first. Each hold is long enough to read the moment's name.
 */
const PACE = [
	{ travel: 1.6, hold: 2.6 },
	{ travel: 2.6, hold: 3 },
	{ travel: 2.6, hold: 3 },
	{ travel: 3, hold: 3 },
	{ travel: 3, hold: 3 },
];
/** The run from the last moment to today, where most of the satellites arrive, is given longest. */
const LAST_STRETCH = 8;

/** The opening sweep's stops: today (where the rewind starts), each named moment, then today again. */
export function openingBeats(catalog: Catalog): IntroBeat[] {
	const beats = findMoments(catalog).map((moment, i) => ({
		time: soonAfterLaunch(catalog, moment.index),
		...(PACE[i] ?? PACE[PACE.length - 1]),
		// The pause on each moment turns to the satellite it names.
		focus: { index: moment.index, label: moment.short },
	}));
	const now = Date.now();
	return [{ time: now, travel: 0, hold: 0 }, ...beats, { time: now, travel: LAST_STRETCH, hold: 0 }];
}

/** Launches from this year on are the recent rush that the finale counts. */
const RUSH_FROM = Date.UTC(2019, 0, 1);
const SPACE_STATION = "25544";
/** How long a moment stays named while the sweep travels on past it. */
const LINGER = 3 * 365 * DAY_MS;

/** Shares that read as "N in 10", or as a percentage where one in ten would round to nothing. */
function share(part: number, whole: number): string {
	const tenths = Math.round((part / whole) * 10);
	return tenths >= 1 && tenths <= 9 ? `${tenths} in 10` : `${Math.round((part / whole) * 100)}%`;
}

/**
 * The opening's bookkeeping: the finale is a starting point, so it goes as soon
 * as the visitor starts somewhere. What the sweep and finale show lives with the
 * time controls (see SweepMoment and Finale), because they are about time.
 */
export function Opening() {
	const finale = useSim((s) => s.finale);
	useEffect(() => {
		if (!finale) return;
		const end = () => useSim.getState().endFinale();
		const stopSelection = useSelection.subscribe((s, previous) => s.selected !== previous.selected && s.selected !== null && end());
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && end();
		const search = document.getElementById("find");
		search?.addEventListener("toggle", end);
		window.addEventListener("keydown", onKey);
		return () => {
			stopSelection();
			search?.removeEventListener("toggle", end);
			window.removeEventListener("keydown", onKey);
		};
	}, [finale]);
	return null;
}

/**
 * During the sweep, just above the date: the moment it has reached, named as
 * it arrives. The date beneath carries the year, so there is no second one.
 * The line keeps its height for the whole sweep, so the controls never jump.
 */
export function SweepMoment({ catalog }: { catalog: Catalog }) {
	const intro = useSim((s) => s.intro);
	const time = useThrottledTime(50);
	const moments = useMemo(() => findMoments(catalog), [catalog]);
	// Running back to 1957 at the start, the moments flash past too fast to read, so they are not named.
	const before = useRef(time);
	const rewinding = time < before.current;
	before.current = time;
	if (!intro) return null;
	const moment = rewinding ? undefined : moments.findLast((m) => m.launched <= time && time < m.launched + LINGER);
	return (
		<div className="mb-5 h-7 text-center short:hidden">
			{/* Keyed by moment, so each new one settles in. A screen reader hears each as it arrives. */}
			<p
				key={moment?.index}
				role="status"
				className="text-lg text-balance transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none starting:translate-y-1 starting:opacity-0 sm:text-xl"
			>
				{moment?.label}
			</p>
		</div>
	);
}

function useFinaleFigure(catalog: Catalog) {
	const { total, recent } = useMemo(() => {
		const now = Date.now();
		const total = countInOrbit(catalog, now).reduce((a, b) => a + b, 0);
		const { launchDays, decayDays } = catalog.orbits;
		const days = (now - catalog.epoch) / DAY_MS;
		let recent = 0;
		for (let i = 0; i < catalog.count; i++) {
			if (launchDays[i] <= days && days < decayDays[i] && launchTime(catalog, i) >= RUSH_FROM) recent++;
		}
		return { total, recent };
	}, [catalog]);
	const figure = share(recent, total);
	return { figure, tenths: /^\d in 10$/.test(figure) ? Number(figure[0]) : null };
}

const STATEMENT = "of the satellites in orbit today went up since 2019.";

/** Ten dots, the share lit one by one: the sentence drawn as a picture. */
function TenDots({ lit, className = "" }: { lit: number; className?: string }) {
	return (
		<div className={`flex gap-1.5 ${className}`} aria-hidden="true">
			{Array.from({ length: 10 }, (_, i) => (
				<span
					key={i}
					className={`size-2 rounded-full transition-[background-color,scale] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${i < lit ? "bg-white starting:scale-50 starting:bg-white/15" : "border border-white/30"}`}
					style={{ transitionDelay: `${300 + i * 70}ms` }}
				/>
			))}
		</div>
	);
}

const capsule =
	"flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-4 text-sm whitespace-nowrap hover:border-white/60 hover:bg-white/10 max-sm:min-h-10 max-sm:gap-1.5 max-sm:px-3";

function FinaleActions({ catalog, className = "" }: { catalog: Catalog; className?: string }) {
	const station = catalog.satellites.satcat.indexOf(SPACE_STATION);
	const { replayIntro, endFinale } = useSim.getState();
	return (
		<div className={`pointer-events-auto flex items-center gap-2 ${className}`}>
			{/* Just look leads: the interface steps back and the sky is left to itself. */}
			<button type="button" onClick={endFinale} className={`${capsule} border-white/60 bg-white/10 hover:bg-white/15`}>
				<svg viewBox="0 0 16 12" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M1 6s2.6-4.5 7-4.5S15 6 15 6s-2.6 4.5-7 4.5S1 6 1 6z" />
					<circle cx="8" cy="6" r="2" />
				</svg>
				Just look
			</button>
			{station >= 0 && (
				<button type="button" onClick={() => showSatellite(catalog, station)} className={capsule}>
					<svg viewBox="0 0 14 14" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
						<circle cx="7" cy="7" r="4" />
						<path d="M7 0.5v3M7 10.5v3M0.5 7h3M10.5 7h3" />
					</svg>
					<span className="max-sm:hidden">Follow the Space Station</span>
					<span className="sm:hidden" aria-label="Follow the Space Station">Follow ISS</span>
				</button>
			)}
			<button type="button" onClick={replayIntro} className={capsule}>
				<svg viewBox="0 0 14 14" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M2.5 7a4.5 4.5 0 1 0 1.3-3.2M2.5 1.5v2.3h2.3" />
				</svg>
				<span className="max-sm:hidden">Play the history again</span>
				<span className="sm:hidden" aria-label="Play the history again">Replay</span>
			</button>
		</div>
	);
}

/**
 * The finale, just above the date at every size: the figure as a readout beside
 * its sentence, the ten dots, and the places to start. Time is told at the
 * bottom of the screen, so its last word is told there too.
 */
export function Finale({ catalog }: { catalog: Catalog }) {
	const finale = useSim((s) => s.finale);
	const { figure, tenths } = useFinaleFigure(catalog);
	if (!finale) return null;
	return (
		<section aria-label="Where to start" className="mb-2 flex flex-col transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none starting:translate-y-2 starting:opacity-0 sm:items-center short:hidden">
			<h2 className="flex items-end gap-3 font-light sm:gap-4">
				<span className="readout shrink-0 text-5xl leading-[0.8] sm:text-6xl">{figure}</span>
				<span className="max-w-[17rem] text-sm leading-snug text-balance text-gray-200 sm:text-base">{STATEMENT}</span>
			</h2>
			{tenths !== null && <TenDots lit={tenths} className="mt-3 sm:mt-4" />}
			<FinaleActions catalog={catalog} className="mt-4 sm:mt-5" />
		</section>
	);
}
