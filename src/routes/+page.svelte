<script lang="ts">
	import Choropleth from '$lib/components/choropleth.svelte';
	import Juxtapose from '$lib/components/juxtapose.svelte';
	import Orbit from '$lib/components/orbit.svelte';
	import type { Satellite, SpaceMissionAgg } from '$lib/types';
	import { onMount } from 'svelte';

	let satellites: Satellite[] = [];
	let spaceRaceMissionsAgg: SpaceMissionAgg[];
	let spaceMissionsAgg: SpaceMissionAgg[];

	onMount(async () => {
		satellites = await (await fetch('data/satellites.json')).json();
		spaceMissionsAgg = await (await fetch('data/space_missions_agg.json')).json();
		spaceRaceMissionsAgg = await (await fetch('data/space_race_missions_agg.json')).json();
	});
</script>

<div class="mx-auto max-w-5xl py-20 w-full space-y-10">
	<h1 class="text-4xl font-bold">Are we entering a new space race?</h1>

	<h2 class="text-2xl font-bold">Countries with space missions</h2>

	<div class="h-96 flex flex-col">
		<div class="w-full flex justify-between">
			<h3 class="text-xl text-red-500">1965</h3>
			<h3 class="text-xl text-blue-300">2022</h3>
		</div>
		<Juxtapose>
			<div slot="left" class="w-full h-96 flex flex-col clip-content justify-center bg-red-100">
				<Choropleth
					missions={spaceRaceMissionsAgg}
					class="w-full fixed left-0 "
					colors={['#000022', '#D87781', '#D32937']}
				/>
			</div>
			<div slot="right" class="w-full h-96 flex flex-col clip-content justify-center bg-blue-100">
				<Choropleth
					missions={spaceMissionsAgg}
					colors={['#000022', '#78C0E0', '#449DD1']}
					class="w-full fixed left-0"
				/>
			</div>
		</Juxtapose>
	</div>
	<h2 class="text-2xl font-bold">Satellites orbiting Earth</h2>

	<!-- Orbit height map -->

	<Orbit {satellites} />

	<!-- Specific detail charts -->
</div>

<style>
	.clip-content {
		clip: rect(auto, auto, auto, auto);
	}
</style>
