import { useEffect, useState } from "react";
import { type Catalog, loadCatalog } from "./data/catalog";
import { SatelliteGlobe } from "./globe/SatelliteGlobe";
import { useSelection } from "./state/selection";
import { startClock } from "./state/store";
import { Legend } from "./ui/Legend";
import { HoverLabel, SatelliteDetails } from "./ui/SatelliteDetails";
import { TimeControls } from "./ui/TimeControls";

/** Orbit class colours, in the order of catalog.orbitClasses. Mirrors the @theme tokens. */
const ORBIT_COLORS = ["#5eead4", "#fbbf24", "#f472b6", "#a78bfa"];

export function App() {
	const [catalog, setCatalog] = useState<Catalog>();
	const [error, setError] = useState<string>();
	const [classVisible, setClassVisible] = useState([true, true, true, true]);

	useEffect(() => {
		loadCatalog().then((catalog) => {
			setCatalog(catalog);
			// `?sat=25544` opens that satellite's details (by NORAD catalogue number).
			const linked = new URLSearchParams(location.search).get("sat");
			const index = linked ? catalog.satellites.satcat.indexOf(linked.padStart(5, "0")) : -1;
			if (index >= 0) useSelection.getState().select(index);
		}, (e: Error) => setError(e.message));
		return startClock();
	}, []);

	if (error) return <p className="p-6 text-red-300">Couldn't load satellite data: {error}</p>;

	return (
		<main className="relative h-full">
			{catalog ? (
				<SatelliteGlobe catalog={catalog} colors={ORBIT_COLORS} classVisible={classVisible} />
			) : (
				<p className="absolute inset-0 grid place-items-center text-sm text-gray-400">
					Loading satellites…
				</p>
			)}

			<header className="pointer-events-none absolute top-0 left-0 p-4 sm:p-6">
				<h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
					The Satellites in Our Skies
				</h1>
				<p className="text-sm text-gray-400">Every payload in Earth orbit since 1957</p>
			</header>

			{catalog && (
				<>
					<Legend
						catalog={catalog}
						colors={ORBIT_COLORS}
						visible={classVisible}
						onToggle={(i) => setClassVisible((v) => v.map((on, j) => (j === i ? !on : on)))}
					/>
					<TimeControls />
					<HoverLabel catalog={catalog} />
					<SatelliteDetails catalog={catalog} colors={ORBIT_COLORS} />
					<footer className="absolute right-0 bottom-0 p-2 text-[10px] text-gray-500">
						Data: {catalog.sources.join("; ")}. Positions are illustrative. Hover or tap a satellite for details.
					</footer>
				</>
			)}
		</main>
	);
}
