import { useEffect, useState } from "react";
import { type Catalog, loadCatalog } from "./data/catalog";
import { SatelliteGlobe } from "./globe/SatelliteGlobe";
import { useSelection } from "./state/selection";
import { startClock, useLinkNote, useSim } from "./state/store";
import { About, AboutButton } from "./ui/About";
import { Legend } from "./ui/Legend";
import { Opening, openingBeats } from "./ui/Opening";
import { ResetView } from "./ui/ResetView";
import { FindButton, Search } from "./ui/Search";
import { HoverLabel, SatelliteDetails } from "./ui/SatelliteDetails";
import { Landing } from "./ui/Landing";
import { TimeControls } from "./ui/TimeControls";

/** Orbit class colours, in the order of catalog.orbitClasses. Mirrors the @theme tokens. */
const ORBIT_COLORS = ["#5eead4", "#fbbf24", "#f472b6", "#a78bfa"];

/** three.js draws with WebGL 2; some browsers and devices have it switched off. */
const canDraw = (() => {
	try {
		return document.createElement("canvas").getContext("webgl2") !== null;
	} catch {
		return false;
	}
})();

export function App() {
	const [catalog, setCatalog] = useState<Catalog>();
	const [failed, setFailed] = useState(false);
	const landing = useSim((s) => s.landing);
	const [attempt, setAttempt] = useState(0);
	const [classVisible, setClassVisible] = useState([true, true, true, true]);

	useEffect(() => startClock(), []);

	useEffect(() => {
		if (!canDraw) return;
		let current = true;
		loadCatalog().then(
			(catalog) => {
				if (!current) return;
				setCatalog(catalog);
				// `?sat=25544` opens that satellite's details (by NORAD catalogue number).
				const linked = new URLSearchParams(location.search).get("sat");
				const index = linked ? catalog.satellites.satcat.indexOf(linked.padStart(5, "0")) : -1;
				if (index >= 0) useSelection.getState().select(index);
				else if (linked) {
					useLinkNote.setState({
						note: `No satellite has the catalogue ID “${linked}”.`,
					});
				}
				useSim.getState().beginIntro(openingBeats(catalog));
			},
			(error: unknown) => {
				// The cause is for whoever is debugging; the visitor gets words they can act on.
				console.error("Couldn't load satellite data:", error);
				if (current) setFailed(true);
			},
		);
		return () => {
			current = false;
		};
	}, [attempt]);

	// Keep the address a link to what is on screen: the selected satellite, and
	// the moment on display while it is paused. See the deep links read in store.ts.
	useEffect(() => {
		if (!catalog) return;
		let pending: ReturnType<typeof setTimeout> | undefined;
		const write = () => {
			const { selected } = useSelection.getState();
			const { time, playing } = useSim.getState();
			const params = new URLSearchParams(location.search);
			params.delete("t");
			params.delete("sat");
			const parts = params.size > 0 ? [params.toString()] : [];
			if (!playing) parts.push(`t=${new Date(time).toISOString().slice(0, 16)}Z`);
			if (selected !== null) parts.push(`sat=${catalog.satellites.satcat[selected].replace(/^0+(?=\d)/, "")}`);
			const query = parts.length > 0 ? `?${parts.join("&")}` : "";
			if (query !== location.search) history.replaceState(null, "", `${location.pathname}${query}`);
		};
		// Dragging the timeline changes the moment many times a second, and
		// browsers limit how often the address may be rewritten.
		const schedule = () => {
			clearTimeout(pending);
			pending = setTimeout(write, 400);
		};
		const stopSelection = useSelection.subscribe((state, previous) => {
			if (state.selected !== previous.selected) schedule();
		});
		const stopSim = useSim.subscribe((state, previous) => {
			if (state.playing !== previous.playing || (!state.playing && state.time !== previous.time)) schedule();
		});
		return () => {
			clearTimeout(pending);
			stopSelection();
			stopSim();
		};
	}, [catalog]);

	const retry = () => {
		setFailed(false);
		setAttempt((n) => n + 1);
	};

	return (
		<main className="relative h-full">
			{catalog ? (
				<SatelliteGlobe catalog={catalog} colors={ORBIT_COLORS} classVisible={classVisible} />
			) : (
				<div className="absolute inset-0 grid place-items-center p-6 text-center text-sm">
					{!canDraw ? (
						<p className="max-w-sm">
							This globe is drawn with WebGL, which this browser has switched off or doesn't support. Try
							a different browser, or turn on hardware acceleration in this one's settings.
						</p>
					) : failed ? (
						<div role="alert" className="max-w-sm">
							<p>The satellite data didn't load. Check your connection, then try again.</p>
							<button
								type="button"
								onClick={retry}
								className="btn mt-4 min-h-11 px-4"
							>
								Try again
							</button>
						</div>
					) : landing ? null : (
						// On a plain visit the title card says this instead, on its button.
						<p role="status" className="text-gray-400">
							Loading satellites…
						</p>
					)}
				</div>
			)}

			{/* Title, count and legend stack in the top-left. Only the legend's rows take
			    the pointer, so the globe can be dragged through everything else. */}
			<div className="pointer-events-none absolute inset-x-0 top-0 isolate flex flex-col gap-6 p-4 sm:p-6">
				{/* The night deepens behind the words, so that satellites passing under them do not drown them. */}
				<div className="absolute top-0 -bottom-24 left-0 -z-10 w-full bg-linear-to-b from-space/90 via-space/75 via-70% to-transparent sm:w-[34rem] sm:bg-[radial-gradient(ellipse_at_top_left,rgb(2_3_10/0.92),rgb(2_3_10/0.6)_45%,transparent_72%)]" />
				<header className="text-balance">
					<h1 className="engraved pr-[6.5rem] text-xs leading-tight sm:pr-56 sm:text-lg">
						The Satellites in Our Skies
					</h1>
				</header>
				{catalog && (
					<Legend
						catalog={catalog}
						colors={ORBIT_COLORS}
						visible={classVisible}
						onToggle={(i) => setClassVisible((v) => v.map((on, j) => (j === i ? !on : on)))}
						onShowAll={() => setClassVisible([true, true, true, true])}
					/>
				)}
				{catalog && <Opening />}
			</div>

			{catalog && (
				<>
					<TimeControls catalog={catalog} colors={ORBIT_COLORS} />
					<HoverLabel catalog={catalog} />
					{/* The few tools there are, in one row in the top-right corner, level with the title. */}
					<nav
						aria-label="Tools"
						className="absolute top-1.5 right-4 flex items-center gap-2 sm:top-3.5 sm:right-6"
					>
						<ResetView />
						<FindButton />
						<AboutButton />
					</nav>
					<About sources={catalog.sources} />
					<Search catalog={catalog} colors={ORBIT_COLORS} />
					<SatelliteDetails catalog={catalog} colors={ORBIT_COLORS} />
				</>
			)}
			{canDraw && !failed && <Landing catalog={catalog} />}
		</main>
	);
}
