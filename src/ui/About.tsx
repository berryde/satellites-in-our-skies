/** What is real and what is not. */
const NOTE =
	"Each orbit's height, shape and tilt are real. Which way it faces, and where the satellite sits along it, are illustrative.";

/** Opens the About panel: a drawn "i", the same size and edge as the other tools. */
export function AboutButton() {
	return (
		<button
			type="button"
			popoverTarget="about"
			aria-label="About, data sources and author"
			title="About, data sources and author"
			// 36px to the eye; on touch an invisible margin makes it 44px to the finger.
			className="pointer-events-auto btn relative grid size-9 place-items-center pointer-coarse:before:absolute pointer-coarse:before:-inset-1 pointer-coarse:before:content-['']"
		>
			<svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
				<circle cx="8" cy="8" r="6.75" />
				<path d="M8 7.25v4" />
				<circle cx="8" cy="4.75" r="0.4" fill="currentColor" />
			</svg>
		</button>
	);
}

/** The honesty note, the data credit and the author, in a panel opened from the tools. */
export function About({ sources }: { sources: string[] }) {
	return (
		<div
			id="about"
			popover="auto"
			className="m-auto w-[min(22rem,calc(100%-2rem))] plate p-4 text-sm text-gray-200 [--plate-alpha:0.9] backdrop:bg-black/50"
		>
			<h2 className="font-semibold">About</h2>
			<p className="mt-3">{NOTE}</p>
			<p className="mt-3 text-gray-400">Data: {sources.join("; ")}.</p>
			<p className="mt-3 text-gray-400">
				Made by Dan Berry ·{" "}
				<a
					href="https://berryde.com/"
					rel="author"
					className="underline decoration-white/40 underline-offset-2 hover:text-white hover:decoration-white"
				>
					berryde.com
				</a>
			</p>
			<button
				type="button"
				popoverTarget="about"
				popoverTargetAction="hide"
				className="btn mt-4 min-h-9 px-4 pointer-coarse:min-h-11"
			>
				Close
			</button>
		</div>
	);
}
