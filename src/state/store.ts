import { create } from "zustand";

export const SPEEDS = [
	{ label: "Real time", factor: 1 },
	{ label: "1 min/s", factor: 60 },
	{ label: "1 hour/s", factor: 3600 },
	{ label: "1 day/s", factor: 86_400 },
	{ label: "1 month/s", factor: 30 * 86_400 },
	{ label: "1 year/s", factor: 365 * 86_400 },
] as const;

type State = {
	/** Simulation time, ms since 1970. */
	time: number;
	playing: boolean;
	/** Simulated seconds per real second. */
	speed: number;
	setTime: (time: number) => void;
	setPlaying: (playing: boolean) => void;
	setSpeed: (speed: number) => void;
	goLive: () => void;
};

/** `?t=1965-06-01` opens the globe paused at that moment. */
const linkedTime = Date.parse(new URLSearchParams(location.search).get("t") ?? "");

export const useSim = create<State>()((set) => ({
	time: Number.isNaN(linkedTime) ? Date.now() : Math.min(linkedTime, Date.now()),
	playing: Number.isNaN(linkedTime),
	speed: 1,
	setTime: (time) => set({ time }),
	setPlaying: (playing) => set({ playing }),
	setSpeed: (speed) => set({ speed }),
	goLive: () => set({ time: Date.now(), speed: 1, playing: true }),
}));

/** Advances simulation time every animation frame while playing. */
export function startClock(): () => void {
	let last = performance.now();
	let frame = requestAnimationFrame(function tick(now) {
		const { playing, speed, time } = useSim.getState();
		if (playing) {
			// Never run past the present (there's no data for the future): when a
			// fast-forward catches up, drop back to real time.
			const next = time + (now - last) * speed;
			const present = Date.now();
			if (next >= present && speed !== 1) useSim.setState({ time: present, speed: 1 });
			else useSim.setState({ time: Math.min(next, present) });
		}
		last = now;
		frame = requestAnimationFrame(tick);
	});
	return () => cancelAnimationFrame(frame);
}
