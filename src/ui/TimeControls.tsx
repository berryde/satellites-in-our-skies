import { useEffect } from "react";
import type { Catalog } from "../data/catalog";
import { useSelection } from "../state/selection";
import { DAY_MS } from "../data/catalog";
import { FIRST_LAUNCH, SPEEDS, STILL_FROM, atToday, fastestSpeedAt, useLinkNote, useSim } from "../state/store";
import { Finale, SweepMoment } from "./Opening";
import { Timeline } from "./Timeline";
import { useThrottledTime } from "./useThrottledTime";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" });
const clockFormat = new Intl.DateTimeFormat(undefined, { timeStyle: "short", timeZone: "UTC" });

type Props = {
	catalog: Catalog;
	colors: string[];
};

const stepGlyph = (path: string) => (
	<svg viewBox="0 0 10 10" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
		<path d={path} />
	</svg>
);

/**
 * The playback speed: one step slower, one step faster, and a row of notches
 * showing where on the scale it stands.
 */
function SpeedStepper({ speed, intro, fastest, onChange }: { speed: number; intro: boolean; fastest: number; onChange: (speed: number) => void }) {
	// The opening sweep runs faster than any speed on offer, so it sits past the last notch.
	const index = intro ? SPEEDS.length : SPEEDS.findIndex((s) => s.factor === speed);
	const step = "grid size-9 shrink-0 place-items-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white disabled:text-gray-600 disabled:hover:bg-transparent pointer-coarse:size-11";
	return (
		// One piece: slower, the speed in words, faster, held together in a hairline capsule.
		<div role="group" aria-label="Playback speed" className="flex h-11 items-center rounded-full border border-white/20 p-0.5 pointer-coarse:h-12">
			<button type="button" aria-label="Slower" title="Slower (J)" aria-keyshortcuts="J" disabled={index <= 0} onClick={() => onChange(SPEEDS[index - 1].factor)} className={step}>
				{stepGlyph("M1 5h8")}
			</button>
			<p aria-live="polite" className="min-w-[9.5rem] px-1 text-center text-sm whitespace-nowrap">
				{intro ? "Fast forward" : SPEEDS[index].label}
			</p>
			<button
				type="button"
				aria-label="Faster"
				// At today the faster speeds have nowhere to go; the tooltip says why it is off.
				title={index >= fastest && fastest < SPEEDS.length - 1 ? "Faster speeds travel through history: go back in time first" : "Faster (L)"}
				aria-keyshortcuts="L"
				disabled={index >= fastest} onClick={() => onChange(SPEEDS[index + 1].factor)} className={step}>
				{stepGlyph("M1 5h8M5 1v8")}
			</button>
		</div>
	);
}

/** A link that pointed somewhere the globe can't go: what happened instead, until it is dismissed. */
function LinkNote() {
	const note = useLinkNote((s) => s.note);
	if (!note) return null;
	return (
		<div role="status" className="mb-4 flex items-start gap-3 border-b border-white/15 pb-3 text-sm">
			<p className="flex-1 text-pretty">{note}</p>
			<button
				type="button"
				onClick={() => useLinkNote.setState({ note: null })}
				className="btn -my-0.5 shrink-0 px-2 py-0.5 pointer-coarse:min-h-11"
			>
				Dismiss
			</button>
		</div>
	);
}

export function TimeControls({ catalog, colors }: Props) {
	const time = useThrottledTime(100);
	const { playing, speed, intro, setPlaying, setSpeed, goLive } = useSim();
	const finale = useSim((s) => s.finale);
	// The title card takes this place until the visitor starts.
	const landing = useSim((s) => s.landing);
	// Paused partway through the replay is a moment yesterday, not today.
	const today = atToday(time, playing ? speed : 1);
	const detailsOpen = useSelection((s) => s.selected !== null);
	// The time of day is a blur when days go by in a second, so it is shown only
	// while it can be read: paused, or at a speed where the satellites still move.
	// A date reached by a jump (a link, Home, a day step from one) sits on
	// midnight, and "12:00 AM" there says nothing, so it is left off.
	const clockReadable = playing ? !intro && speed < STILL_FROM : time % DAY_MS !== 0;

	// The keys an editor's timeline uses, from anywhere except where they already
	// mean something (typing, a focused button, an open popover):
	// Space plays and pauses; J slower, K pause, L play or faster; comma and full
	// stop step back and forward, a minute while the satellites move, a day while the sky is still.
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const key = event.key.toLowerCase();
			if (![" ", "j", "k", "l", ",", "."].includes(key)) return;
			if (key === " " && (event.repeat || (event.target as Element).closest("button, a"))) return;
			if ((event.target as Element).closest("input, select, textarea, :popover-open")) return;
			if (document.querySelector(":popover-open")) return;
			// The title card is still up: the keys wait for the visitor to start.
			if (useSim.getState().landing) return;
			event.preventDefault();
			const { playing, speed, intro, time, setPlaying, setSpeed, setTime } = useSim.getState();
			const index = intro ? SPEEDS.length : SPEEDS.findIndex((s) => s.factor === speed);
			if (key === " ") setPlaying(!playing);
			else if (key === "k") setPlaying(false);
			else if (key === "l") {
				if (!playing) setPlaying(true);
				else if (index < fastestSpeedAt(time)) setSpeed(SPEEDS[index + 1].factor);
			} else if (key === "j") {
				if (index > 0) setSpeed(SPEEDS[Math.min(index, SPEEDS.length) - 1].factor);
				else setPlaying(false);
			} else {
				const step = speed < STILL_FROM ? 60_000 : DAY_MS;
				setTime(Math.min(Math.max(time + (key === "." ? step : -step), FIRST_LAUNCH), Date.now()));
				setPlaying(false);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		// No panel: the instruments sit straight on the scene, like a broadcast's
		// telemetry, with the night deepening along the bottom edge behind them.
		// On small screens the details of a selected satellite take their place.
		<section
			aria-label="Time"
			inert={landing}
			className={`pointer-events-none absolute inset-x-0 bottom-0 isolate pt-20 pb-3 transition-[opacity,visibility] duration-700 motion-reduce:transition-none sm:pb-5 short:pt-10 ${detailsOpen ? "compact:hidden" : ""} ${landing ? "invisible opacity-0" : ""}`}
		>
			<div className="absolute inset-0 -z-10 bg-linear-to-t from-space/95 via-space/75 via-50% to-transparent" />
			{/* On a phone held sideways it moves right, clear of the legend. */}
			<div className="pointer-events-auto mx-auto w-[min(48rem,calc(100%-2rem))] short:mr-4 short:ml-auto short:w-[min(36rem,calc(100%-17rem))]">
				<LinkNote />
				<SweepMoment catalog={catalog} />
				<Finale catalog={catalog} />
				{/* Transport and speed on the left, the moment in the middle, the way back to today on the right. */}
				{/* While the finale is up it takes this row's place: the date is today and the sky is
				    already moving, so play, speed and the date wait until the visitor starts somewhere. */}
				<div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 max-sm:gap-x-2 ${finale ? "hidden" : ""}`}>
					<div className="flex items-center gap-2 max-sm:contents">
						<button
							type="button"
							onClick={() => setPlaying(!playing)}
							aria-label={playing ? "Pause" : "Play"}
							aria-keyshortcuts="Space K"
							title={playing ? "Pause (Space or K)" : "Play (Space or L)"}
							className="grid size-11 shrink-0 place-items-center justify-self-start rounded-full border border-white/30 hover:border-white/70 hover:bg-white/10"
						>
							<svg viewBox="0 0 10 10" className="size-3" fill="currentColor" aria-hidden="true">
								{playing ? <path d="M1.5 0h2.5v10H1.5zM6 0h2.5v10H6z" /> : <path d="M2 0l8 5-8 5z" />}
							</svg>
						</button>
						{/* The sweep sets its own pace; the speeds arrive with the present. */}
						<div className={`max-sm:order-last max-sm:col-span-3 max-sm:mt-9 max-sm:justify-self-center ${intro ? "invisible max-sm:hidden" : ""}`}>
							<SpeedStepper speed={speed} intro={intro} fastest={fastestSpeedAt(time)} onChange={setSpeed} />
						</div>
					</div>

					{/* The moment on display, as the readout everything else hangs from. */}
					{/* The date alone is centred on the row; the time hangs beneath it, so the row lines up whether or not it shows. */}
					<div className="relative text-center tabular-nums">
						<p className="readout text-[2rem] leading-none sm:text-[2.5rem] short:text-[1.75rem]">{dateFormat.format(time)}</p>
						<p className={`caps absolute inset-x-0 top-full mt-1.5 text-gray-400 ${clockReadable ? "" : "invisible"}`}>
							{clockFormat.format(time)} UTC
						</p>
					</div>

					<button
						type="button"
						onClick={goLive}
						disabled={today}
						className="flex min-h-11 items-center gap-2 justify-self-end rounded-full px-3 text-sm whitespace-nowrap hover:bg-white/10 disabled:text-gray-500 disabled:hover:bg-transparent max-sm:px-2"
					>
						{intro ? (
							<span aria-label="Skip to today">
								<span className="max-sm:hidden">Skip to today</span>
								<span className="sm:hidden" aria-hidden="true">Skip</span>
							</span>
						) : today ? (
							"Today"
						) : (
							// A phone has room for the one word; the arrow says the rest.
							<span aria-label="Jump to today">
								<span className="max-sm:hidden">Jump to today</span>
								<span className="sm:hidden" aria-hidden="true">Today</span>
							</span>
						)}
						{!today && (
							<svg viewBox="0 0 12 10" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								<path d="M1 5h8M6 2l3 3-3 3M11 1v8" />
							</svg>
						)}
					</button>
				</div>
				<Timeline catalog={catalog} colors={colors} time={time} />
			</div>
		</section>
	);
}
