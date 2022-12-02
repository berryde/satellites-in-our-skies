<script lang="ts">
	import Choropleth from '$lib/components/choropleth.svelte';
	import Juxtapose from '$lib/components/juxtapose.svelte';
	import Loader from '$lib/components/loader.svelte';
	import Orbit from '$lib/components/orbit.svelte';
	import type { Satellite, SpaceMissionAgg, WorldGeoJson } from '$lib/types';
	import { onMount } from 'svelte';

	let satelliteFilter: 'orbitClass' | 'purpose';
	let data: {
		satellites: Satellite[];
		spaceRaceMissionsAgg: SpaceMissionAgg[];
		spaceMissionsAgg: SpaceMissionAgg[];
		world: WorldGeoJson;
	};

	const loadData = async () => {
		const satellites = fetch('data/satellites.json');
		const spaceMissionsAgg = fetch('data/space_missions/space_missions_agg.json');
		const spaceRaceMissionsAgg = fetch('data/space_missions/space_race_missions_agg.json');
		const world = fetch('data/world-geo.json');

		data = await Promise.all([satellites, spaceMissionsAgg, spaceRaceMissionsAgg, world])
			.then((responses) => Promise.all(responses.map((r) => r.json())))
			.then(([satellites, spaceMissionsAgg, spaceRaceMissionsAgg, world]) => ({
				satellites,
				spaceMissionsAgg,
				spaceRaceMissionsAgg,
				world
			}));
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
		<h1 class="text-4xl font-bold">Are we entering a new space race?</h1>

		<section class="space-y-5">
			<h2 class="text-2xl font-bold">Countries with space missions</h2>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam sem leo, luctus ut est a,
				placerat vestibulum arcu. Maecenas at quam odio. Nam placerat lobortis lectus, ut lobortis
				ipsum hendrerit a. Maecenas bibendum in felis nec vehicula. Mauris ante metus, ultrices et
				leo id, ullamcorper eleifend libero. Praesent quis gravida urna, nec congue odio. Curabitur
				vel nisl et augue pulvinar commodo. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
				Donec tristique lorem ornare enim bibendum, eget molestie nisi pretium. Curabitur mauris
				dui, venenatis quis egestas in, porttitor nec mauris.
			</p>
			<div class="h-96 flex flex-col">
				<div class="w-full flex justify-between">
					<h3 class="text-xl text-red-500">1965</h3>
					<h3 class="text-xl text-blue-300">2022</h3>
				</div>
				<Juxtapose>
					<div slot="left" class="w-full h-96 flex flex-col clip-content justify-center bg-red-100">
						<Choropleth
							world={data.world}
							missions={data.spaceRaceMissionsAgg}
							class="w-full fixed left-0 "
							colors={['#000022', '#D87781', '#D32937']}
						/>
					</div>
					<div
						slot="right"
						class="w-full h-96 flex flex-col clip-content justify-center bg-blue-100"
					>
						<Choropleth
							world={data.world}
							missions={data.spaceMissionsAgg}
							colors={['#000022', '#78C0E0', '#449DD1']}
							class="w-full fixed left-0"
						/>
					</div>
				</Juxtapose>
				<p class="text-slate-500 text-sm">Drag the slider to compare the two maps.</p>
			</div>
		</section>
		<section class="space-y-5">
			<h2 class="text-2xl font-bold">Man-made satellites orbiting Earth</h2>
			<p>
				Proin lacinia efficitur elit, ut accumsan nisi mollis a. Quisque vehicula dolor eget ligula
				rhoncus, sit amet rutrum lectus elementum. Nullam efficitur nulla in sem hendrerit, et
				fringilla tellus viverra. Suspendisse et turpis orci. Aliquam commodo tincidunt dapibus.
				Quisque sed sem est. Etiam et orci eget ex placerat ultricies. Nullam et blandit risus.
				Vestibulum et diam dictum, laoreet diam eu, blandit odio. Maecenas elementum lectus neque,
				eget elementum felis vulputate ut.
			</p>
			<select bind:value={satelliteFilter}>
				<option value="orbitClass">Orbit class</option>
				<option value="purpose">Purpose</option>
				<option value="users">Users</option>
			</select>
			<Orbit satellites={data.satellites} filter={satelliteFilter} />
		</section>

		<!-- Orbit height map -->

		<!-- Specific detail charts -->
	</div>
{/if}

<style>
	.clip-content {
		clip: rect(auto, auto, auto, auto);
	}
</style>
