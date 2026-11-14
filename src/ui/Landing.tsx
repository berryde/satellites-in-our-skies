import { useEffect, useMemo, useRef, useState } from "react";
import { type Catalog, countInOrbit } from "../data/catalog";
import { useSelection } from "../state/selection";
import { reducedMotion, useSim } from "../state/store";

/** How long the count takes to climb from one to today's, in ms. */
const CLIMB_MS = 1800;

/**
 * The count climbs from 1 (Sputnik, alone) to today's, quickly at first and
 * settling as it arrives, the way the satellites themselves arrived. Under
 * reduced motion it is simply there.
 */
function useClimb(target: number | null): number | null {
	const [value, setValue] = useState<number | null>(null);
	useEffect(() => {
		if (target === null) return;
		if (reducedMotion) return setValue(target);
		let frame = 0;
		const begin = performance.now() + 250;
		const step = (now: number) => {
			const t = Math.min(Math.max((now - begin) / CLIMB_MS, 0), 1);
			// Exponential ease-out: most of the climb is over early, like the curve on the timeline read backwards.
			const eased = t === 1 ? 1 : 1 - 2 ** (-10 * t);
			setValue(Math.max(1, Math.round(1 + (target - 1) * eased)));
			if (t < 1) frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	}, [target]);
	return value;
}

/**
 * The title card for a visitor who arrives from a plain link. Today's sky is
 * already behind it, turning. The card leads with the one number that says what
 * this is (how many satellites are up there now, against the one of 1957), and
 * nothing moves through history until the visitor chooses.
 */
export function Landing({ catalog }: { catalog: Catalog | undefined }) {
	const ready = catalog !== undefined;
	const landing = useSim((s) => s.landing);
	const start = useRef<HTMLButtonElement>(null);
	const today = useMemo(() => (catalog ? countInOrbit(catalog, Date.now()).reduce((a, b) => a + b, 0) : null), [catalog]);
	const count = useClimb(today);

	// The way in is where the keyboard starts, once there is something to start.
	useEffect(() => {
		if (landing && ready) start.current?.focus({ preventScroll: true });
	}, [landing, ready]);

	// Starting anywhere else (Escape, picking a satellite, opening search) also puts the card away.
	useEffect(() => {
		if (!landing) return;
		const leave = () => useSim.getState().leaveLanding();
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && leave();
		const stopSelection = useSelection.subscribe((s, previous) => s.selected !== previous.selected && s.selected !== null && leave());
		const search = document.getElementById("find");
		search?.addEventListener("toggle", leave);
		window.addEventListener("keydown", onKey);
		return () => {
			stopSelection();
			search?.removeEventListener("toggle", leave);
			window.removeEventListener("keydown", onKey);
		};
	}, [landing]);

	return (
		// Stays mounted so it can fade away; once gone it is inert and invisible.
		<section
			aria-label="Start"
			inert={!landing}
			className={`pointer-events-none absolute inset-x-0 bottom-0 isolate px-4 pt-32 pb-10 transition-[opacity,visibility] duration-500 ease-out motion-reduce:transition-none sm:px-6 sm:pb-14 short:pt-16 short:pb-6 ${landing ? "" : "invisible opacity-0"}`}
		>
			{/* The night deepens along the bottom edge, as it does behind the time controls that will take its place. */}
			<div className="absolute inset-0 -z-10 bg-linear-to-t from-space via-space/80 via-45% to-transparent" />
			<div className="pointer-events-auto max-w-[34rem] transition-[opacity,translate] delay-200 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none starting:translate-y-2 starting:opacity-0">
				<h2 className="font-light">
					{/* The hero is a number: the readout, at the largest it is ever set. Space is kept for it while the data loads. */}
					<span className="readout block min-h-[1em] text-[6.5rem] leading-[0.9] sm:text-[9rem] [@media(max-height:44rem)]:text-[4.5rem]" aria-hidden={count === null}>
						{count?.toLocaleString() ?? "\u00a0"}
					</span>
					<span className="mt-3 block max-w-[26rem] text-xl leading-snug text-balance sm:text-2xl">
						satellites in orbit today. <span className="text-gray-400">In 1957 there was one.</span>
					</span>
				</h2>
				<div className="mt-8 flex flex-wrap items-center gap-3">
					{/* The one filled button on the page: the way in. */}
					<button
						ref={start}
						type="button"
						disabled={!ready}
						onClick={() => useSim.getState().startIntro()}
						className="flex h-12 items-center gap-2.5 rounded-full bg-white px-6 text-base font-medium text-space transition-colors hover:bg-white/85 disabled:bg-white/25 disabled:text-white/80"
					>
						{ready && !reducedMotion && (
							<svg viewBox="0 0 10 10" className="size-3" fill="currentColor" aria-hidden="true">
								<path d="M2 0l8 5-8 5z" />
							</svg>
						)}
						{!ready ? "Loading satellites…" : reducedMotion ? "Show today's sky" : "Watch them arrive"}
					</button>
					{!reducedMotion && (
						<button
							type="button"
							onClick={() => useSim.getState().leaveLanding()}
							className="flex h-12 items-center gap-2 rounded-full border border-white/25 px-5 text-base hover:border-white/60 hover:bg-white/10"
						>
							<svg viewBox="0 0 16 12" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								<path d="M1 6s2.6-4.5 7-4.5S15 6 15 6s-2.6 4.5-7 4.5S1 6 1 6z" />
								<circle cx="8" cy="6" r="2" />
							</svg>
							Just look
						</button>
					)}
				</div>
			</div>
		</section>
	);
}
