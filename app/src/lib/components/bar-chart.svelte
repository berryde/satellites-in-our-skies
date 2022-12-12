<script lang="ts">
	import { max } from 'd3-array';
	import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
	import { select } from 'd3';
	import { axisBottom, axisLeft } from 'd3-axis';
	import { schemeTableau10 } from 'd3-scale-chromatic';
	import AxisTitles from './axis-titles.svelte';

	export let data: Record<string, number> = {};
	export let xTitle: string;
	export let yTitle: string;
	export let useColour: boolean = true;

	const margins = {
		top: 25,
		left: 70,
		right: 25,
		bottom: 25
	};

	let xAxis: SVGGElement;
	let yAxis: SVGGElement;

	let width = 0;
	let height = 0;

	$: x = scaleBand()
		.domain(Object.keys(data))
		.range([margins.left, width - margins.right])
		.padding(0.2);

	$: y = scaleLinear()
		.domain([0, max(Object.values(data))] as [number, number])
		.range([height - margins.bottom, margins.top])
		.nice(10);

	$: select(yAxis).call(axisLeft(y).ticks(10));
	$: select(xAxis).call(axisBottom(x).ticks(15));

	const color = useColour
		? scaleOrdinal<string>().domain(Object.keys(data)).range(schemeTableau10)
		: () => schemeTableau10[0];
</script>

<AxisTitles {xTitle} {yTitle} offsetX={20}>
	<div bind:clientWidth={width} bind:clientHeight={height} class="w-full h-96">
		<svg {width} {height} class="fill-slate-800 ">
			<g bind:this={yAxis} transform="translate({margins.left},{0})" />
			<g bind:this={xAxis} transform="translate({0},{height - margins.bottom})" />
			{#each Object.entries(data) as [key, value]}
				<rect
					x={x(key)}
					y={y(value)}
					width={x.bandwidth()}
					height={Math.abs(height - margins.bottom - y(value))}
					fill={color(key)}
					class="hover:opacity-90 transition-opacity"
				>
					<title>{value}</title>
				</rect>
			{/each}
		</svg>
	</div>
</AxisTitles>
