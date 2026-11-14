import { useMemo } from "react";
import { type Catalog, countInOrbit, orbitClassWords } from "../data/catalog";
import { useSelection } from "../state/selection";
import { inLastDay, useSim } from "../state/store";
import { ResetView } from "./ResetView";
import { useThrottledTime } from "./useThrottledTime";

type Props = {
	catalog: Catalog;
	colors: string[];
	visible: boolean[];
	onToggle: (index: number) => void;
	onShowAll: () => void;
};

const focus = (focusClass: number | null) => useSelection.setState({ focusClass });

function Readout({ value }: { value: number }) {
	return (
		<p className="readout text-6xl leading-none sm:text-7xl compact:text-5xl">{value.toLocaleString()}</p>
	);
}

export function Legend({ catalog, colors, visible, onToggle, onShowAll }: Props) {
	const time = useThrottledTime(250);
	const counts = useMemo(() => countInOrbit(catalog, time), [catalog, time]);
	const total = counts.reduce((a, b) => a + b, 0);
	// With a class switched off, the count still says what is up; the line beneath says what is drawn.
	const someHidden = visible.includes(false);
	const drawn = counts.reduce((sum, count, i) => (visible[i] ? sum + count : sum), 0);
	const detailsOpen = useSelection((s) => s.selected !== null);
	// During the opening sweep only the count climbs; the rows arrive with the present.
	const intro = useSim((s) => s.intro);
	const landing = useSim((s) => s.landing);

	return (
		// Held back while the title card is up, then in with the sweep.
		<section className={`transition-opacity duration-700 motion-reduce:transition-none ${landing ? "invisible opacity-0" : ""}`}>
			<div className="mb-4 compact:mb-3">
				<Readout value={total} />
				<p className="mt-1 text-sm text-gray-400">
					{total === 1 ? "satellite" : "satellites"} in orbit
					{someHidden && ` · ${drawn.toLocaleString()} on the globe`}
				</p>
			</div>
			{/* Where room is short: one row of four cells, a dot and count over a short name. They give way to the details of a selected satellite. */}
				<ul
					className={`grid grid-cols-4 gap-x-1 text-sm short:max-w-64 short:grid-cols-2 transition-[opacity,visibility] duration-700 motion-reduce:transition-none roomy:block roomy:w-56 roomy:space-y-1 ${detailsOpen ? "max-sm:hidden" : ""} ${intro ? "invisible opacity-0 max-sm:hidden" : ""}`}
			>
				{catalog.orbitClasses.map((code, i) => {
					const { name, where } = orbitClassWords(catalog, i);
					const short = name.replace(/ orbit$/, "");
					return (
						<li key={code}>
							<button
								type="button"
								onClick={() => onToggle(i)}
								aria-pressed={visible[i]}
								title={`${name}, ${where}. Select to ${visible[i] ? "hide" : "show"} it on the globe.`}
								// Pointing at a class picks it out on the globe before anything is switched off.
								onPointerEnter={(event) => event.pointerType === "mouse" && focus(i)}
								onPointerLeave={() => focus(null)}
								onFocus={() => focus(i)}
								onBlur={() => focus(null)}
								className="group pointer-events-auto flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-white/10 aria-[pressed=false]:text-gray-400 roomy:items-baseline compact:min-h-11 compact:flex-wrap compact:gap-x-1.5 compact:gap-y-0 pointer-coarse:min-h-11"
								>
									{/* Switched off, the dot is an empty ring in the class's colour: off, but still named. */}
									<span
										className="size-2.5 shrink-0 rounded-full border-[1.5px] group-aria-[pressed=false]:bg-transparent!"
										style={{ backgroundColor: colors[i], borderColor: colors[i] }}
									/>
								<span className="flex-1 compact:order-last compact:basis-full compact:text-xs compact:text-gray-400">
									<span className="compact:sr-only">{name}</span>
									<span className="roomy:hidden" aria-hidden="true">{short}</span>
								</span>
								<span className="text-gray-400 tabular-nums compact:text-inherit">{counts[i].toLocaleString()}</span>
							</button>
						</li>
					);
				})}
			</ul>
			{/* Only today is it known which satellites still work, so only today are the rest fainter. */}
			<div className={`mt-2 flex items-baseline gap-3 px-1 text-xs text-gray-400 ${detailsOpen || intro ? "max-sm:hidden" : ""}`}>
				{someHidden && (
					<button
						type="button"
						onClick={onShowAll}
						className="pointer-events-auto -my-1 -ml-1.5 rounded-[3px] px-1.5 py-1 text-white hover:bg-white/10 pointer-coarse:min-h-11"
					>
						Show all
					</button>
				)}
				<ResetView inline />
				<p className={`compact:hidden ${inLastDay(time) ? "" : "invisible"}`}>Faint points: no longer operating</p>
			</div>
		</section>
	);
}
