import { useMemo } from "react";
import { type Catalog, countInOrbit } from "../data/catalog";
import { useThrottledTime } from "./useThrottledTime";

type Props = {
	catalog: Catalog;
	colors: string[];
	visible: boolean[];
	onToggle: (index: number) => void;
};

export function Legend({ catalog, colors, visible, onToggle }: Props) {
	const time = useThrottledTime(250);
	const counts = useMemo(() => countInOrbit(catalog, time), [catalog, time]);
	const total = counts.reduce((a, b) => a + b, 0);

	return (
		<section className="absolute top-20 left-0 p-4 sm:top-24 sm:p-6">
			<p className="text-3xl font-semibold tabular-nums">{total.toLocaleString()}</p>
			<p className="mb-3 text-sm text-gray-400">satellites in orbit</p>
			<ul className="space-y-1 text-sm">
				{catalog.orbitClasses.map((name, i) => (
					<li key={name}>
						<button
							type="button"
							onClick={() => onToggle(i)}
							aria-pressed={visible[i]}
							className="flex w-44 items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-white/10 aria-[pressed=false]:opacity-40"
						>
							<span className="size-2.5 rounded-full" style={{ background: colors[i] }} />
							<span className="flex-1">{name}</span>
							<span className="text-gray-400 tabular-nums">{counts[i].toLocaleString()}</span>
						</button>
					</li>
				))}
			</ul>
		</section>
	);
}
