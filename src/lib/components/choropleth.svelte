<script lang="ts">
	import type { SpaceMissionAgg } from '$lib/types';
	import { onMount } from 'svelte';
	import { extent } from 'd3-array';
	import { feature } from 'topojson-client';
	import { scaleLinear } from 'd3-scale';
	import { geoEquirectangular, geoPath } from 'd3-geo';
	import type { GeoPath } from 'd3-geo';
	import type { Topology, MultiPolygon } from 'topojson-specification';
	import { browser } from '$app/environment';
	import type { FeatureCollection } from 'geojson';
	import type { Geometry } from 'geojson';
	import type { Feature } from 'geojson';

	export let colors = ['#DBDBDB', '#36829A', '#102542'];
	type CountryProperties = { name: string; missions?: number };

	export let missions: SpaceMissionAgg[];

	let width: number;
	let height: number;
	let data: { path: string; color?: string; name: string; value: number }[] = [];
	let countries: FeatureCollection<Geometry, { name: string; missions?: number }>;
	let path: GeoPath;
	let world: Topology<{
		countries1: {
			type: 'GeometryCollection';
			geometries: ({ properties: CountryProperties } & MultiPolygon)[];
		};
	}>;

	const populate = (missions: SpaceMissionAgg[]) => {
		if (!browser || !missions || !world) return;

		world.objects.countries1.geometries.map((d) => {
			const mission = missions.find((m) => m.countryCode === d.id);
			d.properties.missions = mission ? mission.missions : 0;
		});

		const missionsExtent = <[number, number]>(
			extent(countries.features, (d) => d.properties.missions!)
		);
		const scale = scaleLinear<string>().domain(missionsExtent).range([colors[1], colors[2]]);

		draw((d) =>
			!d.properties.missions || d.properties.missions == 0
				? colors[0]
				: scale(d.properties.missions!)
		);
	};

	const draw = (scale: (d: Feature<Geometry, CountryProperties>) => string) => {
		data = countries.features.map((d) => ({
			name: d.properties.name,
			value: d.properties.missions ? d.properties.missions : 0,
			path: path(d)!,
			color: scale(d)
		}));
	};

	onMount(async () => {
		world = await (await fetch('data/world-id.json')).json();
		countries = feature(world, world.objects.countries1);
		path = geoPath().projection(geoEquirectangular().fitSize([width, height], countries));

		draw(() => colors[0]);
	});

	$: populate(missions);
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
