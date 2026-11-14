import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { type Catalog, STILL_IN_ORBIT_DAYS, catalogMoment, launchTime } from "../data/catalog";
import { inOrbit } from "../globe/orbitMath";
import { showSatellite } from "../state/show";
import { useSim } from "../state/store";

/** Catalogue numbers offered before anything is typed. */
const WELL_KNOWN = ["25544", "20580", "44235", "00002"];
const MAX_RESULTS = 8;

const year = (time: number) => new Date(time).getUTCFullYear();

/** The button that opens the search: a drawn lens, and its words where there is room for them. */
export function FindButton() {
	return (
		<button
			type="button"
			popoverTarget="find"
			title="Find a satellite"
			className="pointer-events-auto btn flex h-9 items-center gap-2 px-3 text-sm relative max-sm:w-9 max-sm:justify-center max-sm:px-0 pointer-coarse:before:absolute pointer-coarse:before:-inset-1 pointer-coarse:before:content-['']"
		>
			<svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
				<circle cx="7" cy="7" r="5" />
				<path d="M10.75 10.75L14.5 14.5" />
			</svg>
			<span className="max-sm:sr-only">Find a satellite</span>
		</button>
	);
}

/** Looks a satellite up by name or catalogue number, in a panel opened by FindButton. */
export function Search({ catalog, colors }: { catalog: Catalog; colors: string[] }) {
	const panel = useRef<HTMLDivElement>(null);
	const input = useRef<HTMLInputElement>(null);
	const listId = useId();
	const inputId = useId();
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);

	const names = useMemo(() => catalog.satellites.name.map((name) => name.toLowerCase()), [catalog]);

	// Start afresh, with the cursor in the box, each time the panel opens.
	useEffect(() => {
		const element = panel.current!;
		const onToggle = (event: Event) => {
			if ((event as ToggleEvent).newState !== "open") return;
			setQuery("");
			setActive(0);
			input.current?.focus();
		};
		element.addEventListener("toggle", onToggle);
		return () => element.removeEventListener("toggle", onToggle);
	}, []);

	const typed = query.trim().toLowerCase();
	const matches = useMemo(() => {
		const { satcat } = catalog.satellites;
		if (!typed) return WELL_KNOWN.map((id) => satcat.indexOf(id)).filter((index) => index >= 0);
		// An exact catalogue number or name first, then names that start with what
		// was typed, then names containing it. Within each of the last two, the
		// satellites still up come before the ones that have come down.
		const exact: number[] = [];
		const starting: number[][] = [[], []];
		const containing: number[][] = [[], []];
		const number = typed.padStart(5, "0");
		const { decayDays } = catalog.orbits;
		for (let i = 0; i < catalog.count; i++) {
			const down = decayDays[i] < STILL_IN_ORBIT_DAYS ? 1 : 0;
			if (satcat[i] === number || satcat[i].toLowerCase() === typed || names[i] === typed) exact.push(i);
			else if (names[i].startsWith(typed)) starting[down].push(i);
			else if (names[i].includes(typed)) containing[down].push(i);
		}
		return [...exact, ...starting.flat(), ...containing.flat()];
	}, [catalog, names, typed]);
	const shown = matches.slice(0, MAX_RESULTS);

	const pick = (index: number) => {
		panel.current?.hidePopover();
		showSatellite(catalog, index);
	};

	const surprise = () => {
		const { time } = useSim.getState();
		// Most of the catalogue is up at any recent date, so a few tries nearly always land; failing that, the Space Station.
		for (let tries = 0; tries < 200; tries++) {
			const index = Math.floor(Math.random() * catalog.count);
			if (inOrbit(catalog, index, time)) return pick(index);
		}
		const station = catalog.satellites.satcat.indexOf("25544");
		if (station >= 0) pick(station);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			if (shown.length === 0) return;
			const step = event.key === "ArrowDown" ? 1 : -1;
			setActive((current) => (current + step + shown.length) % shown.length);
		} else if (event.key === "Enter" && shown[active] !== undefined) {
			event.preventDefault();
			pick(shown[active]);
		}
	};

	/** "since 1998" for a satellite still up, "1957 to 1958" for one that has come down. */
	const years = (index: number) => {
		const launched = year(launchTime(catalog, index));
		const decayDays = catalog.orbits.decayDays[index];
		return decayDays >= STILL_IN_ORBIT_DAYS
			? `since ${launched}`
			: `${launched} to ${year(catalogMoment(catalog, decayDays))}`;
	};

	return (
		<div
			ref={panel}
			id="find"
			popover="auto"
			className="mx-auto mt-16 mb-auto w-[min(24rem,calc(100%-2rem))] plate p-3 text-sm text-gray-200 [--plate-alpha:0.96] backdrop:bg-black/50"
		>
			<label htmlFor={inputId} className="font-semibold">
				Find a satellite
			</label>
			<div className="relative mt-2">
				<input
					ref={input}
					id={inputId}
					type="search"
					role="combobox"
					aria-expanded={shown.length > 0}
					aria-controls={listId}
					aria-activedescendant={shown.length > 0 ? `${listId}-${active}` : undefined}
					aria-autocomplete="list"
					autoComplete="off"
					spellCheck={false}
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setActive(0);
					}}
					onKeyDown={onKeyDown}
					placeholder="Name or catalogue ID"
					className="min-h-11 w-full rounded-[3px] border border-white/25 bg-white/5 pr-11 pl-3 text-base placeholder:text-gray-400"
				/>
				{query && (
					<button
						type="button"
						onClick={() => {
							setQuery("");
							setActive(0);
							input.current?.focus();
						}}
						aria-label="Clear"
						className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded text-gray-400 hover:text-white"
					>
						<svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
							<path d="M1 1l10 10M11 1L1 11" />
						</svg>
					</button>
				)}
			</div>

			{!typed && (
				<div className="mt-3 flex items-center justify-between px-2">
					<p className="text-xs text-gray-400">Suggestions</p>
					{/* A satellite at random, from those in orbit on the date showing, so there is always something to fly to. */}
					<button
						type="button"
						onClick={surprise}
						className="-my-1 -mr-2 flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs text-gray-200 hover:bg-white/10 hover:text-white pointer-coarse:min-h-11"
					>
						<svg viewBox="0 0 14 14" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M1 3.5h2.5c3.5 0 3.5 7 7 7H13M1 10.5h2.5c1.4 0 2.2-1.1 2.9-2.4M8.6 5.9c.7-1.3 1.5-2.4 2.9-2.4H13M11.5 2l1.5 1.5-1.5 1.5M11.5 9l1.5 1.5-1.5 1.5" />
						</svg>
						Surprise me
					</button>
				</div>
			)}
			<ul id={listId} role="listbox" aria-label="Matching satellites" className="mt-1">
				{shown.map((index, position) => (
					<li
						key={index}
						id={`${listId}-${position}`}
						role="option"
						aria-selected={position === active}
						onClick={() => pick(index)}
						onPointerMove={() => setActive(position)}
						className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[3px] px-2 aria-selected:bg-white/10"
					>
						<span
							className="size-2 shrink-0 rounded-full"
							style={{ background: colors[catalog.orbits.orbitClass[index]] }}
						/>
						<span className="min-w-0 flex-1 truncate">{catalog.satellites.name[index]}</span>
						<span className="shrink-0 text-gray-400 tabular-nums">{years(index)}</span>
					</li>
				))}
			</ul>

			<p role="status" className="mt-2 px-2 text-xs text-gray-400 empty:hidden">
				{typed && matches.length === 0
					? `No matches for “${query.trim()}”.`
					: matches.length > shown.length
						? `${shown.length} of ${matches.length.toLocaleString()} shown`
						: ""}
			</p>
		</div>
	);
}
