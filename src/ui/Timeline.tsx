import {
	type CSSProperties,
	type KeyboardEvent,
	type PointerEvent,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { type Catalog, DAY_MS, countInOrbit, orbitHistory } from "../data/catalog";
import { findMoments } from "../data/moments";
import { showAtLaunch } from "../state/show";
import { FIRST_LAUNCH, reducedMotion, useSim } from "../state/store";

/** Points along the history curve. */
const SAMPLES = 240;

const YEAR_MS = 365.25 * DAY_MS;

/** How long after a moment its name stays up while time plays past it. */
const MOMENT_LINGER = 3 * 365 * DAY_MS;

/** The closest the track zooms in: a year from end to end. */
const MIN_SPAN = YEAR_MS;

/** Years between labels on the ruler, the smallest that leaves each label room. */
const LABEL_STEPS = [1, 2, 5, 10, 20];
/** Room each label on the ruler needs, in CSS pixels. */
const LABEL_ROOM = 64;

const dayFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric", timeZone: "UTC" });

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type View = { from: number; to: number };

type Props = {
	catalog: Catalog;
	colors: string[];
	/** Simulation time, throttled: used for what is read, not for the playhead. */
	time: number;
};

/**
 * The whole history as one track: satellites in orbit over time, stacked by
 * orbit class, with a playhead that can be dragged and named moments to jump
 * to. It zooms, like an editor's timeline, from all of history down to a year.
 */
export function Timeline({ catalog, colors, time }: Props) {
	const root = useRef<HTMLDivElement>(null);
	const track = useRef<HTMLDivElement>(null);
	const playhead = useRef<HTMLSpanElement>(null);
	// The right end of the track is the moment the page opened.
	const [end] = useState(() => Date.now());

	// The stretch of history the track shows. Zooming narrows it; it never runs past either end.
	const [view, setViewState] = useState<View>({ from: FIRST_LAUNCH, to: end });
	const viewRef = useRef(view);
	const setView = (from: number, to: number) => {
		const span = clamp(to - from, MIN_SPAN, end - FIRST_LAUNCH);
		const start = clamp(from, FIRST_LAUNCH, end - span);
		const next = { from: start, to: start + span };
		viewRef.current = next;
		setViewState(next);
	};
	const span = view.to - view.from;
	const zoomed = span < end - FIRST_LAUNCH - DAY_MS;
	const fraction = (t: number) => (t - view.from) / span;

	const [width, setWidth] = useState(600);
	useLayoutEffect(() => {
		const element = track.current!;
		const observer = new ResizeObserver(() => setWidth(element.clientWidth));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const [hoverTime, setHoverTime] = useState<number | null>(null);
	const [activeMoment, setActiveMoment] = useState<number | null>(null);

	// The playhead moves every frame, so it is driven by a CSS variable rather than a render.
	// Zoomed in, the view turns the page when the playhead runs off its end.
	useEffect(() => {
		const apply = (t: number) => {
			const { from, to } = viewRef.current;
			const playing = useSim.getState().playing && !useSim.getState().scrubbing;
			if (playing && (t > to || t < from) && to - from < end - FIRST_LAUNCH) {
				setView(t - (to - from) * 0.05, t + (to - from) * 0.95);
				return;
			}
			const f = (t - from) / (to - from);
			root.current?.style.setProperty("--played", String(clamp(f, 0, 1)));
			playhead.current?.style.setProperty("opacity", f < 0 || f > 1 ? "0" : "1");
		};
		apply(useSim.getState().time);
		return useSim.subscribe((state) => apply(state.time));
	}, [end, view]); // eslint-disable-line react-hooks/exhaustive-deps

	// One closed shape per orbit class, each stacked on the ones before it,
	// scaled to the busiest moment in view so that a quiet decade still has a shape.
	const bands = useMemo(() => {
		const history = orbitHistory(catalog, view.from, view.to, SAMPLES);
		let peak = 1;
		for (let j = 0; j < SAMPLES; j++) {
			peak = Math.max(peak, history.reduce((sum, counts) => sum + counts[j], 0));
		}
		const point = (count: number, j: number) => `${j},${(1 - count / peak).toFixed(4)}`;
		let lower = new Array<number>(SAMPLES).fill(0);
		const paths = history.map((counts) => {
			const upper = counts.map((count, j) => lower[j] + count);
			const path = `M${upper.map(point).join("L")}L${lower.map(point).reverse().join("L")}Z`;
			lower = upper;
			return path;
		});
		// The outline of the whole stack, drawn as a lit edge along its top.
		return { paths, edge: `M${lower.map(point).join("L")}` };
	}, [catalog, view]);

	const moments = useMemo(
		() =>
			findMoments(catalog).map((moment) => ({
				...moment,
				label: `${new Date(moment.launched).getUTCFullYear()} · ${moment.label}`,
			})),
		[catalog],
	);

	// A milestone the playhead has passed is filled in. Crossing one while time
	// plays forward sends a single ring of light out from it; a jump does not.
	const reached = moments.map((moment) => time >= moment.launched);
	const reachedBefore = useRef<{ reached: boolean[]; time: number } | null>(null);
	const [crossings, setCrossings] = useState<number[]>(() => moments.map(() => 0));
	useEffect(() => {
		const previous = reachedBefore.current;
		reachedBefore.current = { reached, time };
		const { playing, scrubbing } = useSim.getState();
		if (!previous || reducedMotion || !playing || scrubbing) return;
		// More than 400 days in one step is a jump (a moment picked, Jump to today), as for the launch bloom.
		if (Math.abs(time - previous.time) > 400 * DAY_MS) return;
		const before = previous.reached;
		if (reached.some((now, i) => now && !before[i])) {
			setCrossings((counts) => counts.map((count, i) => (reached[i] && !before[i] ? count + 1 : count)));
		}
	}, [reached.join()]); // eslint-disable-line react-hooks/exhaustive-deps

	const hoverCount = useMemo(
		() => (hoverTime === null ? 0 : countInOrbit(catalog, hoverTime).reduce((a, b) => a + b, 0)),
		[catalog, hoverTime],
	);

	// What is written above the track: the moment being pointed at, else the date
	// under the pointer, else the moment that time has just played past. At today
	// nothing: the faster speeds loop the last day there, but that is how the
	// globe keeps moving, not something the visitor needs explained.
	// During the opening sweep the moments are named in large type beside the globe instead.
	const intro = useSim((s) => s.intro);
	const passed = !intro && moments.findLast((m) => time >= m.launched && time < m.launched + MOMENT_LINGER);
	const caption =
		activeMoment !== null
			? { at: moments[activeMoment].launched, text: moments[activeMoment].label }
			: hoverTime !== null
				? {
						at: hoverTime,
						text: `${monthFormat.format(hoverTime)} · ${hoverCount.toLocaleString()} in orbit`,
					}
				: passed
					? { at: passed.launched, text: passed.label }
					: null;

	const { scrub, endScrub } = useSim.getState();
	const timeAt = (clientX: number) => {
		const rect = track.current!.getBoundingClientRect();
		const { from, to } = viewRef.current;
		return from + clamp((clientX - rect.left) / rect.width, 0, 1) * (to - from);
	};

	/** Zooms by `factor` (below 1 is in), keeping the moment at `anchor` where it is. */
	const zoom = (factor: number, anchor: number) => {
		const { from, to } = viewRef.current;
		setView(anchor - (anchor - from) * factor, anchor + (to - anchor) * factor);
	};

	// The wheel zooms around the pointer (a trackpad pinch arrives as a wheel with
	// Ctrl held); a sideways swipe moves along. Listened for directly, since
	// React's wheel handler cannot stop the browser's own zoom.
	useEffect(() => {
		const element = track.current!;
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			const { from, to } = viewRef.current;
			const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;
			if (sideways) {
				const delta = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
				const shift = (delta / element.clientWidth) * (to - from);
				setView(from + shift, to + shift);
			} else {
				zoom(Math.exp(event.deltaY * (event.ctrlKey ? 0.01 : 0.002)), timeAt(event.clientX));
			}
		};
		element.addEventListener("wheel", onWheel, { passive: false });
		return () => element.removeEventListener("wheel", onWheel);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// One finger drags the playhead. A second one turns the gesture into a pinch,
	// which zooms with the two moments under the fingers held beneath them.
	const pointers = useRef(new Map<number, number>());
	const pinch = useRef<{ a: number; b: number } | null>(null);
	const dragging = useRef<number | null>(null);
	const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		event.currentTarget.setPointerCapture(event.pointerId);
		pointers.current.set(event.pointerId, event.clientX);
		if (pointers.current.size === 2 && event.pointerType === "touch") {
			const [a, b] = [...pointers.current.values()];
			pinch.current = { a: timeAt(a), b: timeAt(b) };
			if (dragging.current !== null) endScrub();
			dragging.current = null;
			return;
		}
		if (dragging.current !== null || pinch.current) return;
		dragging.current = event.pointerId;
		setHoverTime(null);
		scrub(timeAt(event.clientX));
	};
	const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
		if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, event.clientX);
		if (pinch.current && pointers.current.size === 2) {
			const rect = track.current!.getBoundingClientRect();
			const [x1, x2] = [...pointers.current.values()].map((x) => (x - rect.left) / rect.width);
			if (Math.abs(x2 - x1) < 0.02) return;
			const { a, b } = pinch.current;
			const perUnit = (b - a) / (x2 - x1);
			setView(a - x1 * perUnit, a + (1 - x1) * perUnit);
		} else if (dragging.current === event.pointerId) scrub(timeAt(event.clientX));
		else if (dragging.current === null && event.pointerType === "mouse") setHoverTime(timeAt(event.clientX));
	};
	// Lifting, the browser cancelling the gesture and losing capture all end the drag.
	const endDrag = (event: PointerEvent<HTMLDivElement>) => {
		pointers.current.delete(event.pointerId);
		if (pointers.current.size < 2) pinch.current = null;
		if (dragging.current !== event.pointerId) return;
		dragging.current = null;
		endScrub();
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		const now = useSim.getState().time;
		// Zoom keys as in an editor: = in, - out, 0 back to all of history.
		const zooms: Record<string, () => void> = {
			"=": () => zoom(0.5, clamp(now, view.from, view.to)),
			"+": () => zoom(0.5, clamp(now, view.from, view.to)),
			"-": () => zoom(2, clamp(now, view.from, view.to)),
			"0": () => setView(FIRST_LAUNCH, end),
		};
		if (event.key in zooms && !event.metaKey && !event.ctrlKey) {
			event.preventDefault();
			zooms[event.key]();
			return;
		}
		const steps: Record<string, number> = {
			ArrowRight: now + DAY_MS,
			ArrowUp: now + DAY_MS,
			ArrowLeft: now - DAY_MS,
			ArrowDown: now - DAY_MS,
			PageUp: now + 365 * DAY_MS,
			PageDown: now - 365 * DAY_MS,
			Home: FIRST_LAUNCH,
			End: Date.now(),
		};
		if (!(event.key in steps)) return;
		event.preventDefault();
		// Held down, a key steps many times a second: the sky stays still until it is let go.
		scrub(clamp(steps[event.key], FIRST_LAUNCH, Date.now()));
	};

	// The ruler: a label every so many years, as many as there is room for, a
	// tick every year, and a tick every month once a year has room to show them.
	const ruler = useMemo(() => {
		const years = span / YEAR_MS;
		const step = LABEL_STEPS.find((s) => years / s <= width / LABEL_ROOM) ?? 50;
		const first = new Date(view.from).getUTCFullYear();
		const last = new Date(view.to).getUTCFullYear();
		const ticks: { at: number; major: boolean }[] = [];
		const labels: number[] = [];
		const monthly = years * 12 <= width / 6;
		for (let year = first; year <= last + 1; year++) {
			const at = Date.UTC(year, 0);
			if (at >= view.from && at <= view.to) {
				const major = year % step === 0;
				ticks.push({ at, major });
				if (major) labels.push(year);
			}
			if (monthly) {
				for (let month = 1; month < 12; month++) {
					const at = Date.UTC(year, month);
					if (at >= view.from && at <= view.to) ticks.push({ at, major: false });
				}
			}
		}
		return { ticks, labels, monthly };
	}, [view, span, width]);

	const curve = (
		<svg viewBox={`0 0 ${SAMPLES - 1} 1`} preserveAspectRatio="none" className="size-full" aria-hidden="true">
			{bands.paths.map((path, i) => (
				<path key={catalog.orbitClasses[i]} d={path} fill={colors[i]} />
			))}
			<path d={bands.edge} fill="none" stroke="white" strokeOpacity={0.85} strokeWidth={1.25} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
		</svg>
	);
	const at = (t: number): CSSProperties => ({ left: `${fraction(t) * 100}%` });
	const inView = (t: number) => t >= view.from && t <= view.to;
	const atStart = view.from <= FIRST_LAUNCH;
	const atEnd = view.to >= end;
	// A label too near an end label would run into it.
	const clearOfEnds = (year: number) => {
		const x = fraction(Date.UTC(year)) * width;
		return (!atStart || x > 44) && (!atEnd || x < width - 56) && x > 12 && x < width - 12;
	};
	const visibleMoments = moments.map((moment, i) => ({ moment, i })).filter(({ moment }) => inView(moment.launched));

	return (
		<div ref={root} className="mt-6 select-none max-sm:mt-4" style={{ "--played": 0 } as CSSProperties}>
			<div className="relative h-3">
				{caption && inView(caption.at) && (
					<span
						className="caps absolute whitespace-nowrap"
						// Slides from left-aligned at the start to right-aligned at the end, so it never overhangs.
						style={{ ...at(caption.at), transform: `translateX(-${fraction(caption.at) * 100}%)` }}
					>
						{caption.text}
					</span>
				)}
			</div>

			<div ref={track} className="relative mt-1 h-[clamp(2.75rem,10dvh,3.5rem)]">
				{ruler.ticks
					.filter((tick) => tick.major)
					.map((tick) => (
						<span key={tick.at} className="absolute inset-y-0 w-px bg-white/10" style={at(tick.at)} />
					))}
				{/* Years still to come are dim; the part already played is lit. */}
				<div className="absolute inset-0 opacity-20">{curve}</div>
				{/* The played part gives off light, as the satellites do: a soft bloom under the lit curve. */}
				<div className="absolute inset-x-0 -top-3 bottom-0 [clip-path:inset(0_calc((1-var(--played))*100%)_0_0)]" aria-hidden="true">
					<div className="absolute inset-x-0 top-3 bottom-0 opacity-70 blur-md">{curve}</div>
				</div>
				<div className="absolute inset-0 [clip-path:inset(0_calc((1-var(--played))*100%)_0_0)]">{curve}</div>
				<span className="absolute inset-x-0 bottom-0 h-px bg-white/25" />

				{/* Where there is room, each moment carries its name on a flag, alternating heights so neighbours do not collide. */}
				{visibleMoments.map(({ moment, i }) => (
					<span
						key={moment.index}
						aria-hidden="true"
						className="pointer-events-none absolute bottom-0 flex flex-col items-start compact:hidden"
						style={{ ...at(moment.launched), top: i % 2 ? "0.875rem" : 0 }}
					>
						{/* Lit once the playhead has passed it; still to come, it waits in grey. */}
						<span className={`caps -translate-x-px border-l pl-1.5 whitespace-nowrap transition-colors duration-500 ${reached[i] ? "border-white/60 text-white" : "border-white/25 text-gray-500"}`}>
							{moment.short}
						</span>
						<span className={`w-px flex-1 -translate-x-px transition-colors duration-500 ${reached[i] ? "bg-white/60" : "bg-white/25"}`} />
					</span>
				))}

				<div
					role="slider"
					tabIndex={0}
					aria-label="Date"
					aria-valuemin={FIRST_LAUNCH}
					aria-valuemax={end}
					aria-valuenow={Math.round(clamp(time, FIRST_LAUNCH, end))}
					aria-valuetext={dayFormat.format(time)}
					aria-keyshortcuts="= - 0"
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={endDrag}
					onPointerCancel={endDrag}
					onLostPointerCapture={endDrag}
					onPointerLeave={() => setHoverTime(null)}
					onDoubleClick={() => setView(FIRST_LAUNCH, end)}
					onKeyDown={onKeyDown}
					onKeyUp={endScrub}
					onBlur={endScrub}
					className="absolute inset-x-0 -inset-y-1 cursor-ew-resize touch-none rounded"
				/>

				<span
					ref={playhead}
					className="pointer-events-none absolute -inset-y-1 left-[calc(var(--played)*100%)] w-[3px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_1px_rgb(255_255_255/0.6)]"
				/>

				{visibleMoments.map(({ moment, i }) => (
					<button
						key={moment.index}
						type="button"
						aria-label={moment.label}
						onClick={() => showAtLaunch(catalog, moment.index)}
						onPointerEnter={(event) => event.pointerType === "mouse" && setActiveMoment(i)}
						onPointerLeave={() => setActiveMoment(null)}
						onFocus={() => setActiveMoment(i)}
						onBlur={() => setActiveMoment(null)}
						className="group absolute bottom-0 grid size-7 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full pointer-coarse:size-11"
						style={at(moment.launched)}
					>
						{/* Passed: filled. To come: an open ring. */}
						<span
							className={`size-2.5 rounded-full border-[1.5px] transition-colors duration-300 group-hover:border-white group-hover:bg-white ${reached[i] ? "border-white bg-white" : "border-white/60 bg-space"}`}
						/>
						{crossings[i] > 0 && (
							<span
								key={crossings[i]}
								aria-hidden="true"
								className="absolute size-2.5 rounded-full border border-white opacity-0 animate-[milestone-passed_900ms_cubic-bezier(0.16,1,0.3,1)]"
							/>
						)}
					</button>
				))}
			</div>

			{/* A ruled edge under the track: a short tick for every year (or month), a longer one at each label. */}
			<div className="relative h-1.5 overflow-x-clip" aria-hidden="true">
				{ruler.ticks.map((tick) => (
					<span
						key={tick.at}
						className={`absolute top-0 w-px ${tick.major ? "h-1.5 bg-white/50" : "h-[3px] bg-white/25"}`}
						style={at(tick.at)}
					/>
				))}
			</div>

			<div className="caps relative mt-1.5 h-3 text-gray-400" aria-hidden="true">
				{atStart && <span className="absolute left-0">1957</span>}
				{ruler.labels.filter(clearOfEnds).map((year) => (
					<span key={year} className="absolute -translate-x-1/2" style={at(Date.UTC(year))}>
						{year}
					</span>
				))}
				{atEnd && <span className="absolute right-0">Today</span>}
			</div>

			{/* Zoomed in: where the view sits in all of history. Drag the window to move along; "All years" zooms back out. */}
			{zoomed && <Overview view={view} end={end} onMove={setView} onReset={() => setView(FIRST_LAUNCH, end)} />}
		</div>
	);
}

function Overview({
	view,
	end,
	onMove,
	onReset,
}: {
	view: View;
	end: number;
	onMove: (from: number, to: number) => void;
	onReset: () => void;
}) {
	const bar = useRef<HTMLDivElement>(null);
	const grab = useRef<{ x: number; from: number } | null>(null);
	const total = end - FIRST_LAUNCH;
	const span = view.to - view.from;
	const move = (event: PointerEvent<HTMLDivElement>) => {
		if (!grab.current) return;
		const shift = ((event.clientX - grab.current.x) / bar.current!.clientWidth) * total;
		onMove(grab.current.from + shift, grab.current.from + shift + span);
	};
	return (
		<div className="mt-2 flex items-center gap-3 text-xs">
			<div ref={bar} className="relative h-3 flex-1 rounded-full bg-white/10">
				<div
					role="presentation"
					onPointerDown={(event) => {
						event.currentTarget.setPointerCapture(event.pointerId);
						grab.current = { x: event.clientX, from: view.from };
					}}
					onPointerMove={move}
					onPointerUp={() => (grab.current = null)}
					onPointerCancel={() => (grab.current = null)}
					className="absolute inset-y-0 min-w-2 cursor-grab touch-none rounded-full bg-white/50 hover:bg-white/70 active:cursor-grabbing"
					style={{ left: `${((view.from - FIRST_LAUNCH) / total) * 100}%`, width: `${(span / total) * 100}%` }}
				/>
			</div>
			<span className="text-gray-400 tabular-nums">
				{new Date(view.from).getUTCFullYear()}–{new Date(view.to).getUTCFullYear()}
			</span>
			<button
				type="button"
				onClick={onReset}
				aria-keyshortcuts="0"
				className="-my-1 rounded-[3px] px-1.5 py-1 hover:bg-white/10 pointer-coarse:min-h-11"
			>
				All years
			</button>
		</div>
	);
}
