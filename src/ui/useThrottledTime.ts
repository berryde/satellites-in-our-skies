import { useEffect, useState } from "react";
import { useSim } from "../state/store";

/** Simulation time, re-rendering at most every `ms` rather than every frame. */
export function useThrottledTime(ms: number): number {
	const [time, setTime] = useState(() => useSim.getState().time);
	useEffect(() => {
		const id = setInterval(() => setTime(useSim.getState().time), ms);
		return () => clearInterval(id);
	}, [ms]);
	return time;
}
