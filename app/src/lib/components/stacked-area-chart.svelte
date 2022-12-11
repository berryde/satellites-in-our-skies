<!-- A stacked area chart made using D3 -->
<script lang="ts">
	import { colorScheme } from '$lib/common';
	import { timeline } from '$lib/constants';
	import {
		area,
		stack,
		scaleLinear,
		scaleTime,
		extent,
		scaleOrdinal,
		axisBottom,
		select,
		axisLeft
	} from 'd3';
	import AxisTitles from './axis-titles.svelte';
	import Legend from './legend.svelte';

	export let data: { [key: string]: number }[];

	if (data && !data[0].year) {
		throw new Error('Data must have a year key');
	}

	const keys = Object.keys(data[0]).filter((key) => key !== 'year');
	const stacked = stack().keys(keys)(data);
	const margins = {
		top: 10,
		left: 30,
		right: 2,
		bottom: 25
	};
	const color = scaleOrdinal<string>().domain(keys).range(colorScheme);

	let width = 0;
	let height = 0;
	let selectedKeys = new Set(keys);
	let xAxis: SVGGElement;
	let yAxis: SVGGElement;

	function spotlightKey(key: string) {
		selectedKeys = new Set([key]);
	}

	function restoreKeys() {
		selectedKeys = new Set(keys);
	}

	$: x = scaleTime()
		.domain(extent(data, (d) => new Date(d.year, 0, 1)) as [Date, Date])
		.range([margins.left, width - margins.right]);

	$: y = scaleLinear()
		.domain([
			0,
			Math.max(
				...data.map((d) => {
					return Object.entries(d)
						.filter(([key]) => key !== 'year')
						.reduce((a, [_, value]) => a + value, 0);
				})
			)
		])
		.range([height - margins.bottom, margins.top]);

	$: areaGenerator = area<{ data: { year: number }; 0: number; 1: number }>()
		.x((d) => x(new Date(d.data.year, 0, 1)))
		.y0((d) => y(d[0]))
		.y1((d) => y(d[1]));

	$: select(xAxis).call(axisBottom(x).ticks(10));

	$: select(yAxis).call(axisLeft(y).ticks(10));

	$: scaledTimeline = timeline.map((d) => ({
		name: d.name,
		date: x(new Date(d.year, 0, 1))
	}));
</script>

<div class="space-y-4">
	<AxisTitles
		xTitle="Year"
		yTitle="Number of space missions"
		offsetX={margins.left}
		offsetY={margins.top}
	>
		<div bind:clientWidth={width} bind:clientHeight={height} class="w-full h-96">
			<svg {width} {height}>
				<g class="areas">
					{#each stacked as stack}
						<!-- @ts-ignore -->
						<path
							class="{selectedKeys.has(stack.key)
								? 'opacity-100'
								: 'opacity-20'} transition-opacity"
							d={areaGenerator(stack)}
							fill={color(stack.key)}
						/>
					{/each}
				</g>
				<g bind:this={yAxis} transform="translate({margins.left},{0})" />
				<g bind:this={xAxis} transform="translate({0},{height - margins.bottom})">
					{#if xAxis && yAxis}
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
			</svg>
		</div>
	</AxisTitles>
	<Legend
		{color}
		keys={keys.reverse()}
		on:mouseenter={(e) => spotlightKey(e.detail)}
		on:mouseleave={() => restoreKeys()}
		subtitle="Hover over a legend key to filter the chart by country. Hover over an event on the X-axis to find out more about that year."
	/>
</div>
