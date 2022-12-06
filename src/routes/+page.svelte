<script lang="ts">
	import AxisTitles from '$lib/components/axis-titles.svelte';
	import Choropleth from '$lib/components/choropleth.svelte';
	import Juxtapose from '$lib/components/juxtapose.svelte';
	import LineChart from '$lib/components/line-chart.svelte';
	import Loader from '$lib/components/loader.svelte';
	import Orbit from '$lib/components/orbit.svelte';
	import StackedAreaChart from '$lib/components/stacked-area-chart.svelte';
	import type { Satellite, MissionsByCountry, WorldGeoJson, TimeSeries } from '$lib/types';
	import {
		interpolateBlues,
		interpolateGreens,
		interpolateInferno,
		interpolateTurbo
	} from 'd3-scale-chromatic';
	import { onMount } from 'svelte';

	let satelliteFilter: 'orbitClass' | 'purpose';
	let data: {
		satellites: Satellite[];
		satellitesOverTime: TimeSeries[];
		missionsOverTime: ({ year: number } & { [key: string]: number })[];
		missions1965: MissionsByCountry[];
		missions2022: MissionsByCountry[];
		world: WorldGeoJson;
	};

	const loadData = async () => {
		data = await Promise.all([
			fetch('data/satellites/satellites.json'),
			fetch('data/satellites/satellites_over_time.json'),
			fetch('data/space_missions/missions_by_country_by_year.json'),
			fetch('data/space_missions/missions_2022.json'),
			fetch('data/space_missions/missions_1965.json'),
			fetch('data/world-geo.json')
		])
			.then((responses) => Promise.all(responses.map((r) => r.json())))
			.then(
				([
					satellites,
					satellitesOverTime,
					missionsOverTime,
					missions2022,
					missions1965,
					world
				]) => ({
					satellites,
					satellitesOverTime,
					missionsOverTime,
					missions2022,
					missions1965,
					world
				})
			);
	};

	onMount(() => {
		loadData();
	});
</script>

{#if !data}
	<div class="w-full h-screen flex items-center justify-center">
		<div class="flex flex-col items-center">
			<Loader />
			<p>Loading data</p>
		</div>
	</div>
{:else}
	<div class="mx-auto max-w-4xl py-20 w-full space-y-10">
		<div>
			<h1 class="text-4xl font-bold">The Satellites in Our Skies</h1>
			<h2 class="text-2xl font-medium">A Visual Exploration of Satellite Technology</h2>
		</div>

		<div class="space-y-5">
			<p>
				Satellites have become an integral part of our modern world, providing us with a wide range
				of services and technologies that are essential to our daily lives. From communication and
				navigation, to weather forecasting and Earth observation, these man-made objects play a
				vital role in our global society. But how did we come to have so many satellites orbiting
				Earth, and what are they used for?
			</p>
			<p>
				By examining the satellites in orbit, the countries and organizations involved in launching
				them, and the various purposes for which satellites are used, this data story traces the
				development of satellite technology from its earliest beginnings to the present day.
			</p>
		</div>

		<!-- Space missions -->
		<section class="space-y-7">
			<h2 class="text-3xl font-bold">The growth of the space age</h2>
			<p>
				In the early days of the space age, the race to explore the final frontier was dominated by
				two key players: the United States and the Soviet Union. These two superpowers competed to
				launch the first satellite, the first human into space, and the first spacecraft to land on
				the Moon. Over time, the focus of space exploration shifted from a Cold War-era showdown to
				a more collaborative and international effort.
			</p>
			<!-- A map showing the countries involved in space exploration over time -->
			<div class="space-y-3">
				<p class="text-2xl font-medium">Which countries have launched space missions?</p>
				<div class="h-96 flex flex-col">
					<div class="w-full flex justify-between">
						<h3 class="text-xl">1965</h3>
						<h3 class="text-xl">2022</h3>
					</div>
					<Juxtapose>
						<div
							slot="left"
							class="w-full h-96 flex flex-col clip-content justify-center bg-neutral-200 rounded"
						>
							<Choropleth
								world={data.world}
								missions={data.missions1965}
								extent={[0, Math.max(...data.missions2022.map((d) => d.missions))]}
								class="w-full fixed left-0 "
							/>
						</div>
						<div
							slot="right"
							class="w-full h-96 flex flex-col clip-content justify-center bg-neutral-200 rounded"
						>
							<Choropleth
								world={data.world}
								missions={data.missions2022}
								extent={[0, Math.max(...data.missions2022.map((d) => d.missions))]}
								class="w-full fixed left-0"
							/>
						</div>
					</Juxtapose>
					<p class="text-slate-500 text-sm">
						Drag the slider to compare the two maps. Hover over a country to view the number of
						space missions it has launched.
					</p>
				</div>
			</div>
			<p>
				Today, the space industry is a multi-billion dollar enterprise, with countries and
				organizations from around the world competing to launch the next generation of satellites
				and spacecraft.
			</p>
			<div class="space-y-4">
				<p class="text-2xl font-medium">Space missions launched per year</p>
				<StackedAreaChart data={data.missionsOverTime} />
			</div>
		</section>

		<!-- Orbit height map -->
		<section class="space-y-5">
			<h2 class="text-2xl font-bold">The satellites orbiting Earth</h2>
			<p>
				Proin lacinia efficitur elit, ut accumsan nisi mollis a. Quisque vehicula dolor eget ligula
				rhoncus, sit amet rutrum lectus elementum. Nullam efficitur nulla in sem hendrerit, et
				fringilla tellus viverra. Suspendisse et turpis orci. Aliquam commodo tincidunt dapibus.
				Quisque sed sem est. Etiam et orci eget ex placerat ultricies. Nullam et blandit risus.
				Vestibulum et diam dictum, laoreet diam eu, blandit odio. Maecenas elementum lectus neque,
				eget elementum felis vulputate ut.
			</p>
			<select bind:value={satelliteFilter} class="bg-neutral-200  rounded p-1">
				<option value="orbitClass">Orbit class</option>
				<option value="purpose">Purpose</option>
				<option value="users">Users</option>
			</select>
			<Orbit data={data.satellites} filter={satelliteFilter} />

			<!-- A chart showing the top countries or organizations by the number of satellites they have in orbit -->
			<!-- A pie chart showing the most common purposes for satellites -->
		</section>

		<!-- Specific detail charts -->
	</div>
{/if}

<style>
	.clip-content {
		clip: rect(auto, auto, auto, auto);
	}
</style>
