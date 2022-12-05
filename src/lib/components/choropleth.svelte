<script lang="ts">
	import type { MissionsByCountry, WorldGeoJson } from '$lib/types';
	import { onMount } from 'svelte';
	import { extent } from 'd3-array';
	import { feature } from 'topojson-client';
	import { scaleSequential } from 'd3-scale';
	import { geoEquirectangular, geoPath } from 'd3-geo';
	import { interpolateBlues } from 'd3-scale-chromatic';

	export let world: WorldGeoJson;
	export let missions: MissionsByCountry[];

	let width: number;
	let height: number;
	let data: { path: string; color?: string; name: string; value: number }[] = [];

	onMount(() => {
		const countries = feature(world, world.objects.countries1);
		world.objects.countries1.geometries.map((d) => {
			const mission = missions.find((m) => m.countryCode === d.id);
			d.properties.missions = mission ? mission.missions : 0;
		});

		const missionsExtent = <[number, number]>(
			extent(countries.features, (d) => d.properties.missions!)
		);

		// Color using interpolateBlues with missionsExtent domain, skipping the first 25% of the scale
		const offset = 0.5;
		const color = scaleSequential()
			.domain(missionsExtent)
			.interpolator((t) => interpolateBlues(offset + t / (1 - offset)));

		const path = geoPath().projection(geoEquirectangular().fitSize([width, height], countries));
		data = countries.features.map((d) => ({
			name: d.properties.name,
			value: d.properties.missions!,
			path: path(d)!,
			color:
				!d.properties.missions || d.properties.missions == 0
					? '#a8a29e'
					: color(d.properties.missions)
		}));
	});
</script>

<div bind:clientWidth={width} bind:clientHeight={height} class="h-64 {$$restProps.class}">
	{#if data}
		<svg {width} {height}>
			{#each data as d}
				<path d={d.path} fill={d.color}>
					<title>{d.name} ({d.value})</title>
				</path>
			{/each}
		</svg>
	{/if}
</div>
