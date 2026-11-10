import { SPEEDS, useSim } from "../state/store";
import { useThrottledTime } from "./useThrottledTime";

const FIRST_LAUNCH = Date.UTC(1957, 9, 4); // Sputnik 1

const dateFormat = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "short",
	timeZone: "UTC",
});

export function TimeControls() {
	const time = useThrottledTime(100);
	const { playing, speed, setPlaying, setSpeed, setTime, goLive } = useSim();
	const live = speed === 1 && Date.now() - time < 5_000;

	return (
		<section className="absolute inset-x-0 bottom-6 mx-auto w-[min(40rem,calc(100%-2rem))] rounded-xl bg-black/60 p-3 backdrop-blur sm:bottom-8">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<button
					type="button"
					onClick={() => setPlaying(!playing)}
					className="w-16 rounded bg-white/10 px-2 py-1 hover:bg-white/20"
				>
					{playing ? "Pause" : "Play"}
				</button>
				<span className="min-w-44 flex-1 tabular-nums">{dateFormat.format(time)} UTC</span>
				<select
					value={speed}
					onChange={(e) => setSpeed(Number(e.target.value))}
					aria-label="Playback speed"
					className="rounded bg-white/10 px-2 py-1"
				>
					{SPEEDS.map((s) => (
						<option key={s.factor} value={s.factor} className="bg-gray-900">
							{s.label}
						</option>
					))}
				</select>
				<button
					type="button"
					onClick={goLive}
					disabled={live}
					className="rounded px-2 py-1 font-medium text-red-300 hover:bg-white/10 disabled:text-red-400 disabled:hover:bg-transparent"
				>
					{live ? "● Live" : "Go live"}
				</button>
			</div>
			<input
				type="range"
				aria-label="Date"
				min={FIRST_LAUNCH}
				max={Date.now()}
				step={86_400_000}
				value={time}
				onChange={(e) => setTime(Number(e.target.value))}
				className="mt-2 w-full accent-teal-300"
			/>
		</section>
	);
}
