import { create } from "zustand";

/** Sputnik 1's launch day: the left end of the timeline. */
export const FIRST_LAUNCH = Date.UTC(1957, 9, 4);

export const SPEEDS = [
	{ label: "Actual speed", factor: 1 },
	{ label: "1 minute per second", factor: 60 },
	{ label: "10 minutes per second", factor: 600 },
	{ label: "1 day per second", factor: 86_400 },
	{ label: "1 year per second", factor: 365 * 86_400 },
] as const;

/**
 * From this speed up, a satellite would lap the Earth many times a second and
 * land somewhere new every frame. So the sky is held still instead: positions
 * stop, the date runs on, and the only thing that changes is who is in orbit.
 */
export const STILL_FROM = 86_400;

/** The speed the globe settles at on reaching the present: slow enough to follow one satellite round. */
export const REST_SPEED = 60;

/**
 * Time cannot run past the present, so at today the speeds between actual and
 * still play the most recent day, over and over.
 */
export const REPLAY_MS = 86_400_000;

/**
 * Whether `time` is within the day that the replay covers. Some things are
 * only known about the present: which satellites are still working, for one.
 */
export function inLastDay(time: number, now = Date.now()): boolean {
	return now - time < REPLAY_MS + 5_000;
}

/**
 * The fastest speed on offer at `time`, as an index into SPEEDS. Within the
 * last day a speed that holds the sky still would reach the present in under
 * a second and drop straight back to the resting speed, so the fastest there
 * is the fastest that replays the day.
 */
export function fastestSpeedAt(time: number): number {
	return inLastDay(time) ? SPEEDS.findLastIndex((s) => s.factor < STILL_FROM) : SPEEDS.length - 1;
}

/** Whether `time` counts as today: the present moment, or the day being replayed. */
export function atToday(time: number, speed: number, now = Date.now()): boolean {
	const replaying = speed > 1 && speed < STILL_FROM;
	return now - time < (replaying ? REPLAY_MS : 0) + 5_000;
}

/**
 * The opening sweep, paced by events rather than by the calendar: it holds on
 * each named moment long enough to read it, travels between them, and slows
 * through the last few years, where most of the satellites arrive.
 */
export type IntroBeat = {
	/** A moment to stop at, ms since 1970. */
	time: number;
	/** Seconds spent travelling here from the beat before. */
	travel: number;
	/** Seconds held here before moving on. */
	hold: number;
	/** A satellite to spotlight while the sweep holds here (index into the catalogue), and its short name. */
	focus?: { index: number; label: string };
};

/** Where the sweep is, `elapsed` seconds in, and whether it has arrived. */
function sweepAt(beats: IntroBeat[], elapsed: number): { time: number; done: boolean; holding: IntroBeat | null } {
	let from = beats[0].time;
	for (const beat of beats) {
		const { time, travel, hold } = beat;
		if (elapsed < travel) {
			// Eases out of one moment and into the next.
			const x = elapsed / travel;
			return { time: from + (time - from) * x * x * (3 - 2 * x), done: false, holding: null };
		}
		elapsed -= travel;
		if (elapsed < hold) return { time, done: false, holding: beat };
		elapsed -= hold;
		from = time;
	}
	return { time: from, done: true, holding: null };
}

let beats: IntroBeat[] = [];
/** Seconds of the sweep played so far. Counted frame by frame, so a hidden tab pauses it. */
let sweepElapsed = 0;

type State = {
	/** Simulation time, ms since 1970: the date on display, and so who is in orbit. */
	time: number;
	/**
	 * The moment the satellites' positions are drawn for. It follows `time`,
	 * except while the sky is held still (see STILL_FROM, and while the timeline
	 * is being dragged), when it stays where it was.
	 */
	motionTime: number;
	playing: boolean;
	/** Simulated seconds per real second, while the displayed moment is in the past. */
	speed: number;
	/**
	 * True from a plain visit's arrival until the visitor starts: the title card
	 * over today's sky, which says what this is before anything moves.
	 */
	landing: boolean;
	/** True while the opening sweep from 1957 to the present is running. */
	intro: boolean;
	/**
	 * The satellite of the named moment the sweep is holding on, if any: the
	 * globe turns to it and lights it while the rest of the sky dims. Only
	 * meaningful while `intro` is true.
	 */
	spotlight: { index: number; label: string } | null;
	/** True from the end of the opening sweep until the visitor does something: the sweep's last word. */
	finale: boolean;
	/**
	 * True while `speed` is the resting speed the globe chose on reaching the
	 * present, not one the visitor picked. Going back into the past then plays
	 * history again, where the resting speed would barely move the date.
	 */
	restingByDefault: boolean;
	/** True while the timeline is being dragged or stepped with the keyboard. */
	scrubbing: boolean;
	/** Goes to a moment, positions and all. */
	setTime: (time: number) => void;
	/** Moves the date while the timeline is dragged, holding the sky still until `endScrub`. */
	scrub: (time: number) => void;
	endScrub: () => void;
	setPlaying: (playing: boolean) => void;
	setSpeed: (speed: number) => void;
	goLive: () => void;
	/** Hands the opening sweep its script, once the catalogue it is drawn from has loaded. */
	beginIntro: (beats: IntroBeat[]) => void;
	/**
	 * From the title card: plays the sweep, which first runs the sky back from
	 * today to Sputnik. Under reduced motion there is no sweep: the card gives way to the finale.
	 */
	startIntro: () => void;
	/** From the title card: "Just look". The card goes and today's sky is left to explore. */
	leaveLanding: () => void;
	/** Plays the opening sweep again from 1957. */
	replayIntro: () => void;
	endFinale: () => void;
};

const params = new URLSearchParams(location.search);
/** `?t=1965-06-01` opens the globe paused at that moment. */
const linkedTime = Date.parse(params.get("t") ?? "");
const hasLinkedTime = !Number.isNaN(linkedTime);
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// A link to a moment or to a satellite should open on what it points at, and a
// visitor who asked for less motion should not get twenty seconds of it.
const plainVisit = !params.has("t") && !params.has("sat");

const HISTORY_SPEED = 365 * 86_400;

/** Leaving today for the past swaps a resting speed nobody chose for one that plays history. */
function leaveRest(s: State, time: number): Partial<State> {
	if (!s.restingByDefault || atToday(time, REST_SPEED)) return {};
	return { speed: HISTORY_SPEED, restingByDefault: false };
}

/** What went wrong with a link the page was opened from, said once, for the visitor to dismiss. */
export const useLinkNote = create<{ note: string | null }>()(() => ({
	note: !params.has("t")
		? null
		: !hasLinkedTime
			? `This link's date, “${params.get("t")}”, couldn't be read, so the globe is showing today. Dates look like 1969-07-20.`
			: linkedTime < FIRST_LAUNCH
				? "This link's date is before the first satellite, so the globe is showing the day after Sputnik 1 went up."
				: linkedTime > Date.now()
					? "This link's date hasn't happened yet, so the globe is showing today."
					: null,
}));

const openingTime = hasLinkedTime
	? // Before the first launch there is nothing to show: open on the first day with a satellite up.
		linkedTime < FIRST_LAUNCH
		? FIRST_LAUNCH + 86_400_000
		: Math.min(linkedTime, Date.now())
	: // Today's sky, at the resting speed, which replays the last day.
		Date.now() - REPLAY_MS;

// Every direct action on time ends the opening sweep.
export const useSim = create<State>()((set) => ({
	time: openingTime,
	motionTime: openingTime,
	playing: !hasLinkedTime && !reducedMotion,
	// A link to a past date plays on through history; otherwise the present is all there is to watch.
	// A link to within the last day is already at the present, where history has nowhere to play.
	speed: hasLinkedTime && !inLastDay(openingTime) ? HISTORY_SPEED : REST_SPEED,
	restingByDefault: !hasLinkedTime || inLastDay(openingTime),
	// A link has somewhere to be; only a plain visit gets the title card.
	landing: plainVisit,
	intro: false,
	spotlight: null,
	finale: false,
	scrubbing: false,
	setTime: (time) => set((s) => ({ time, motionTime: time, intro: false, finale: false, ...leaveRest(s, time) })),
	scrub: (time) => set({ time, scrubbing: true, intro: false, finale: false }),
	endScrub: () => set((s) => (s.scrubbing ? { scrubbing: false, motionTime: s.time, ...leaveRest(s, s.time) } : s)),
	// Pausing a still sky puts every satellite where it belongs on the date now showing.
	// Pausing the sweep leaves history to play on at a speed that moves through it.
	setPlaying: (playing) =>
		set((s) => ({
			playing,
			intro: false,
			motionTime: playing ? s.motionTime : s.time,
			...(s.intro ? { speed: HISTORY_SPEED, restingByDefault: false } : {}),
		})),
	setSpeed: (speed) =>
		set((s) => {
			// No faster than the moment allows (see fastestSpeedAt); keys and buttons can both ask.
			speed = Math.min(speed, SPEEDS[fastestSpeedAt(s.time)].factor);
			// "Actual speed" during the replay means now, not this time yesterday.
			const time = speed === 1 && atToday(s.time, s.speed) ? Date.now() : s.time;
			return { speed, time, intro: false, restingByDefault: false, motionTime: speed < STILL_FROM ? time : s.motionTime };
		}),
	goLive: () =>
		set((s) => {
			const resting = s.speed >= STILL_FROM;
			// Skipping the sweep still ends on its last word.
			const finale = s.intro || s.finale;
			const speed = resting ? REST_SPEED : s.speed;
			const time = speed > 1 ? Date.now() - REPLAY_MS : Date.now();
			return { time, motionTime: time, speed, playing: true, intro: false, finale, scrubbing: false, restingByDefault: resting || s.restingByDefault };
		}),
	beginIntro: (script) => {
		if (!plainVisit || beats.length > 0) return;
		beats = script;
	},
	startIntro: () => {
		if (beats.length === 0) return;
		if (reducedMotion) return set({ landing: false, finale: true });
		sweepElapsed = 0;
		// The sky is held where it stands, so the satellites drain away and come
		// back in place rather than jumping.
		set((s) => ({ landing: false, intro: true, finale: false, playing: true, scrubbing: false, time: beats[0].time, motionTime: s.motionTime }));
	},
	leaveLanding: () => set({ landing: false }),
	replayIntro: () => {
		if (beats.length === 0) return;
		sweepElapsed = 0;
		set({ intro: true, finale: false, playing: true, scrubbing: false, time: beats[0].time, motionTime: Date.now() - REPLAY_MS });
	},
	endFinale: () => set({ finale: false }),
}));

/** Advances simulation time every animation frame while playing. */
export function startClock(): () => void {
	let last = performance.now();
	let frame = requestAnimationFrame(function tick(now) {
		const { playing, speed, time, intro, scrubbing } = useSim.getState();
		if (playing && !scrubbing) {
			const present = Date.now();
			// A long gap between frames (a hidden tab) must not skip years of history.
			const elapsed = speed > 1 || intro ? Math.min(now - last, 100) : now - last;
			const next = time + elapsed * speed;
			if (intro) {
				sweepElapsed += elapsed / 1000;
				const at = sweepAt(beats, sweepElapsed);
				if (!at.done) {
					// While the sweep holds on a moment, its satellite is in the spotlight.
					const spotlight = at.holding?.focus ?? null;
					if (spotlight !== useSim.getState().spotlight) useSim.setState({ time: at.time, spotlight });
					else useSim.setState({ time: at.time });
				} else {
					const replay = present - REPLAY_MS;
					useSim.setState({ time: replay, motionTime: replay, intro: false, finale: true, speed: REST_SPEED, restingByDefault: true, spotlight: null });
				}
			} else if (speed >= STILL_FROM) {
				// Never run past the present (there's no data for the future).
				if (next < present) useSim.setState({ time: next });
				else {
					// Arrived: the sky starts to move, replaying the day that led up to now.
					const replay = present - REPLAY_MS;
					useSim.setState({ time: replay, motionTime: replay, intro: false, speed: REST_SPEED, restingByDefault: true });
				}
			} else if (speed > 1) {
				const moment = next < present ? next : present - REPLAY_MS;
				useSim.setState({ time: moment, motionTime: moment });
			} else {
				const moment = Math.min(next, present);
				useSim.setState({ time: moment, motionTime: moment });
			}
		}
		last = now;
		frame = requestAnimationFrame(tick);
	});
	return () => cancelAnimationFrame(frame);
}
