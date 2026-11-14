import { useSelection, useView } from "../state/selection";
import { useSim } from "../state/store";

/**
 * Puts the camera back where it opened. Shown only once it has been moved, and
 * not while the sweep, its finale or the details card is up. Where there is
 * room it leads the row of tools in the top-right corner; on a compact screen
 * it joins the quiet row under the legend.
 */
export function ResetView({ inline = false }: { inline?: boolean }) {
	const moved = useView((s) => s.moved);
	const busy = useSim((s) => s.landing || s.intro || s.finale);
	const detailsOpen = useSelection((s) => s.selected !== null);
	if (!moved || busy || detailsOpen) return null;
	return (
		<button
			type="button"
			onClick={() => useView.getState().reset()}
			className={
				inline
					? "pointer-events-auto -my-1 -ml-1.5 rounded-[3px] px-1.5 py-1 text-white hover:bg-white/10 roomy:hidden pointer-coarse:min-h-11"
					: "h-9 rounded-[3px] px-3 text-sm text-gray-400 hover:bg-white/10 hover:text-white compact:hidden pointer-coarse:h-11"
			}
		>
			Reset view
		</button>
	);
}
