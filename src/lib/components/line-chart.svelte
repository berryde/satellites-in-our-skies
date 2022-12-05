<script lang="ts">
	import type { TimeSeries } from '$lib/types';
	import { extent } from 'd3-array';
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { select } from 'd3';
	import { axisBottom, axisLeft } from 'd3-axis';

	export let data: TimeSeries[] = [];
	export let timeline: { name: string; year: number }[] = [
		{
			name: 'First artificial satellite',
			year: 1957
		},
		{
			name: 'First photograph of Earth from space',
			year: 1959
		},
		{
			name: 'First human spaceflight',
			year: 1961
		},
		{
			name: 'First human on the moon',
			year: 1969
		},
		{
			name: 'End of the space race',
			year: 1975
		},
		{
			name: 'First multinational space station',
			year: 1998
		},
		{
			name: 'SpaceX launches first commercial spacecraft',
			year: 2008
		},
		{
			name: 'SpaceX performs first landing of an orbital rocket',
			year: 2015
		},
		{
			name: 'SpaceX begins launching Starlink megaconstellation',
			year: 2019
		},
		{
			name: 'The global COVID-19 pandemic slows progress',
			year: 2021
		}
	];
	const margins = {
		top: 25,
		left: 25,
		right: 25,
		bottom: 25
	};

	let scaledData: { value: number; date: number }[];
	let scaledTimeline: { name: string; date: number }[];
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
	$: scaledData = data.map((d) => ({
		value: y(d.count),
		date: x(new Date(d.year, 0, 1))
	}));
	$: scaledTimeline = timeline.map((d) => ({
		name: d.name,
		date: x(new Date(d.year, 0, 1))
	}));
	$: select(yAxis).call(axisLeft(y).ticks(20));
	$: select(xAxis).call(axisBottom(x).ticks(15));
</script>

<div bind:clientWidth={width} bind:clientHeight={height} class="w-full h-96">
	<svg {width} {height} class="fill-slate-800 ">
		<g bind:this={yAxis} transform="translate({margins.left},{0})" />
		<g bind:this={xAxis} transform="translate({0},{height - margins.bottom})">
			{#if scaledTimeline}
				{#each scaledTimeline as event}
					<!-- a circle width radius 5 at event.date -->
					<circle
						cx={event.date}
						cy={0}
						r={4}
						class="fill-neutral-100 hover:fill-slate-700 transition-colors stroke-slate-700 stroke-2 cursor-pointer"
					>
						<title>
							{event.name}
						</title>
					</circle>
				{/each}
			{/if}
		</g>

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

<style lang="postcss">
	g text {
		@apply stroke-slate-500;
		stroke-width: 5px;
	}
</style>
