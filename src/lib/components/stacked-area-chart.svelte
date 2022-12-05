<!-- A stacked area chart made using D3 -->
<script lang="ts">
	import { colorScheme } from '$lib/common';
	import {
		area,
		stack,
		scaleLinear,
		scaleTime,
		extent,
		scaleOrdinal,
		axisBottom,
		select,
		axisLeft,
		type Series
	} from 'd3';

	export let data: { [key: string]: number }[];
	if (data && !data[0].year) {
		throw new Error('Data must have a year key');
	}

	// The data must have a common X value (date) and then an abitrary number of common Y values

	// Get all keys in the data that are not the 'date' key
	const keys = Object.keys(data[0]).filter((key) => key !== 'year');
	const stacked = stack().keys(keys)(data);

	const margins = {
		top: 25,
		left: 50,
		right: 25,
		bottom: 25
	};
	const color = scaleOrdinal<string>().domain(keys).range(colorScheme);

	let width = 0;
	let height = 0;

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
						.reduce((a, [key, value]) => a + value, 0);
				})
			)
		])
		.range([height - margins.top, margins.bottom]);

	$: areaGenerator = area<{ data: { year: number }; 0: number; 1: number }>()
		.x((d) => x(new Date(d.data.year, 0, 1)))
		.y0((d) => y(d[0]))
		.y1((d) => y(d[1]));

	// Add X and Y axis
	$: select(xAxis).call(axisBottom(x).ticks(5));
	$: select(yAxis).call(axisLeft(y).ticks(5));

	let xAxis: SVGGElement;
	let yAxis: SVGGElement;
</script>

<div bind:clientWidth={width} bind:clientHeight={height} class="w-full h-96">
	<svg {width} {height}>
		<!-- x axis -->

		<g class="areas">
			{#each stacked as stack}
				<!-- @ts-ignore -->
				<path d={areaGenerator(stack)} fill={color(stack.key)} />
			{/each}
		</g>
		<g bind:this={yAxis} transform="translate({margins.left},{0})" />
		<g bind:this={xAxis} transform="translate({0},{height - margins.bottom})" />
	</svg>
</div>
<div class="flex space-x-3">
	{#each keys as key}
		<div class="flex items-center bg-neutral-200 rounded px-1">
			<div class="w-4 h-4 rounded-full mr-2" style={`background-color: ${color(key)}`} />
			<p>{key}</p>
		</div>
	{/each}
</div>
