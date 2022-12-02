<script lang="ts">
	import type { SpaceMissionAgg, WorldGeoJson } from '$lib/types';
	import { onMount } from 'svelte';
	import { extent } from 'd3-array';
	import { feature } from 'topojson-client';
	import { scaleLinear } from 'd3-scale';
	import { geoEquirectangular, geoPath } from 'd3-geo';

	export let colors = ['#DBDBDB', '#36829A', '#102542'];
	export let world: WorldGeoJson;
	export let missions: SpaceMissionAgg[];

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
		const scale = scaleLinear<string>().domain(missionsExtent).range([colors[1], colors[2]]);

		const path = geoPath().projection(geoEquirectangular().fitSize([width, height], countries));
		data = countries.features.map((d) => ({
			name: d.properties.name,
			value: d.properties.missions!,
			path: path(d)!,
			color: scale(d.properties.missions!)
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
