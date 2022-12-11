<script lang="ts">
	import type { TimeSeries } from '$lib/types';
	import { extent } from 'd3-array';
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { select } from 'd3';
	import { axisBottom, axisLeft } from 'd3-axis';
	import AxisTitles from './axis-titles.svelte';

	export let data: TimeSeries[] = [];

	const margins = {
		top: 25,
		left: 40,
		right: 25,
		bottom: 25
	};

	let scaledData: { value: number; date: number }[];

	let xAxis: SVGGElement;
	let yAxis: SVGGElement;
	let width = 0;
	let height = 0;

	$: x = scaleTime()
		.domain(extent(data, (d) => new Date(d.year, 0, 1)) as [Date, Date])
		.range([margins.left, width - margins.right]);

	$: y = scaleLinear()
		.domain(extent(data, (d) => d.count) as [number, number])
		.range([height - margins.bottom, margins.top])
		.nice(10);

	$: scaledData = data.map((d) => {
		return {
			value: y(d.count),
			date: x(new Date(d.year, 0, 1))
		};
	});

	$: select(yAxis).call(axisLeft(y).ticks(20));
	$: select(xAxis).call(axisBottom(x).ticks(15));
</script>

<AxisTitles yTitle="Number of satellites launched" xTitle="Year">
	<div bind:clientWidth={width} bind:clientHeight={height} class="w-full h-96">
		<svg {width} {height} class="fill-slate-800 ">
			<g bind:this={yAxis} transform="translate({margins.left},{0})" />
			<g bind:this={xAxis} transform="translate({0},{height - margins.bottom})" />
			<g>
				{#if scaledData}
					{#each scaledData as d, i}
						{#if i != data.length - 1}
							<line
								x1={d.date}
								x2={scaledData[i + 1].date}
								y1={d.value}
								y2={scaledData[i + 1].value}
								stroke-width="2"
								class="stroke-slate-800"
							/>
						{/if}
					{/each}
				{/if}
			</g>
		</svg>
	</div>
</AxisTitles>
