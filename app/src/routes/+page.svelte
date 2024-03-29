<script lang="ts">
	import BarChart from '$lib/components/bar-chart.svelte';
	import Choropleth from '$lib/components/choropleth.svelte';
	import Juxtapose from '$lib/components/juxtapose.svelte';
	import Loader from '$lib/components/loader.svelte';
	import Orbit from '$lib/components/orbit.svelte';
	import StackedAreaChart from '$lib/components/stacked-area-chart.svelte';
	import Treemap from '$lib/components/treemap.svelte';
	import type {
		Satellite,
		MissionsByCountry,
		WorldGeoJson,
		TimeSeries,
		TreemapData
	} from '$lib/types';
	import { onMount } from 'svelte';

	let data: {
		satellites: Satellite[];
		satellitesOverTime: TimeSeries[];
		missionsOverTime: ({ year: number } & { [key: string]: number })[];
		missions1965: MissionsByCountry[];
		missions2022: MissionsByCountry[];
		world: WorldGeoJson;
		satelliteOwners: Record<string, number>;
		satelliteCountries: Record<string, number>;
		satelliteOwnersByCountry: TreemapData;
	};

	const loadData = async () => {
		data = await Promise.all([
			fetch('data/satellites/satellites.json'),
			fetch('data/satellites/satellites_over_time.json'),
			fetch('data/space_missions/missions_by_country_by_year.json'),
			fetch('data/space_missions/missions_2022.json'),
			fetch('data/space_missions/missions_1965.json'),
			fetch('data/world-geo.json'),
			fetch('data/satellites/satellite_owners.json'),
			fetch('data/satellites/satellite_countries.json'),
			fetch('data/satellites/satellite_owners_by_country.json')
		])
			.then((responses) => Promise.all(responses.map((r) => r.json())))
			.then(
				([
					satellites,
					satellitesOverTime,
					missionsOverTime,
					missions2022,
					missions1965,
					world,
					satelliteOwners,
					satelliteCountries,
					satelliteOwnersByCountry
				]) => ({
					satellites,
					satellitesOverTime,
					missionsOverTime,
					missions2022,
					missions1965,
					world,
					satelliteOwners,
					satelliteCountries,
					satelliteOwnersByCountry
				})
			);
	};

	function timeSeriesToCategorical(data: TimeSeries[]) {
		return data.reduce((acc, curr) => {
			acc[curr.year] = curr.count;
			return acc;
		}, {} as Record<string, number>);
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>The Satellites in Our Skies</title>
</svelte:head>

{#if !data}
	<div class="w-full h-screen flex items-center justify-center">
		<div class="flex flex-col items-center">
			<Loader />
			<p>Loading data</p>
		</div>
	</div>
{:else}
	<div class="mx-auto max-w-4xl py-20 w-full space-y-16">
		<div class="space-y-5">
			<div>
				<h1 class="text-4xl font-bold">The Satellites in Our Skies</h1>
				<h2 class="text-2xl font-medium">A Visual Exploration of Satellite Technology</h2>
			</div>
			<p>
				Satellites have become an integral part of our modern world, providing us with a wide range
				of services and technologies that are essential to our daily lives. From communication and
				navigation to weather forecasting and Earth observation, these man-made objects play a vital
				role in our global society. But how did we come to have so many satellites orbiting Earth,
				and what are they used for?
			</p>
			<p>
				By examining the satellites in orbit, the countries and organizations involved in launching
				them, and the various purposes for which satellites are used, this data story traces the
				development of satellite technology from its earliest beginnings to the present day and
				poses questions for the future.
			</p>
		</div>

		<!-- Space missions -->
		<section class="space-y-5">
			<h2 class="text-3xl font-bold">The dawn of the space age</h2>
			<p>
				In the early days of the space age, the race to explore the final frontier was dominated by
				two key players: the United States and the Soviet Union. These two superpowers competed to
				launch the first satellite, the first human into space, and the first spacecraft to land on
				the Moon. Over time, the focus of space exploration shifted from a Cold War-era showdown to
				a more collaborative and international effort.
			</p>
			<!-- A map showing the countries involved in space exploration over time -->
			<div class="space-y-3">
				<div>
					<p class="text-2xl font-medium">Which countries have launched space missions?</p>
					<p class="text-slate-700">
						The countries with space missions during the space race, compared to today.
					</p>
				</div>
				<div class="flex flex-col">
					<div class="w-full flex justify-between">
						<h3 class="text-xl">1965</h3>
						<h3 class="text-xl">2022</h3>
					</div>
					<Juxtapose>
						<div slot="left" class="w-full h-96 flex flex-col justify-center rounded">
							<Choropleth
								world={data.world}
								missions={data.missions1965}
								extent={[0, Math.max(...data.missions2022.map((d) => d.missions))]}
								class="w-full absolute left-0"
							/>
						</div>
						<div slot="right" class="w-full h-96 flex flex-col justify-center rounded">
							<Choropleth
								world={data.world}
								missions={data.missions2022}
								extent={[0, Math.max(...data.missions2022.map((d) => d.missions))]}
								class="w-full absolute right-0	"
							/>
						</div>
					</Juxtapose>
					<p class="text-slate-600 text-sm">
						Drag the slider to compare the two maps. Hover over a country to view the number of
						space missions it has launched.
					</p>
				</div>
			</div>
			<p>
				Today, the space industry is a multi-billion pound enterprise, with countries, and
				increasingly organizations, from around the world competing to launch the next generation of
				satellites and spacecraft.
			</p>
			<div class="space-y-3">
				<div>
					<p class="text-2xl font-medium">Space missions launched per year</p>
					<p class="text-slate-700">The number of space missions launched by country over time.</p>
				</div>
				<StackedAreaChart data={data.missionsOverTime.filter((mission) => mission.year < 2022)} />
			</div>
			<p>
				In the present day, the United States and China are the two countries that have launched the
				most space missions. Nevertheless, it is clear that the proliferation of space technology
				has led to a new era of space exploration, and inspired a generation of innovators to
				develop new technologies and applications for satellites.
			</p>
		</section>

		<!-- Orbit height map -->
		<section class="space-y-5">
			<h2 class="text-3xl font-bold">The rise of satellites</h2>
			<p>
				During the space race, satellites were primarily a precursor to human spaceflight. Their
				purpose was limited - to collect limited scientific data and conduct basic imaging tasks. As
				the world became increasingly digitized, the number of use cases and applications of
				satellites expanded rapidly. From observing adversary actions at remote military bases to
				broadcasting television across the globe, satellites have become an essential part of our
				modern world.
			</p>
			<p>
				The map below shows the distribution of satellites in orbit around the Earth. The different
				colours represent the various orbits in which satellites can be found. The size of each dot
				represents the relative size of the satellite.
			</p>

			<Orbit data={data.satellites} />

			<p>
				Most satellites are in low Earth orbit, where they can take advantage of the lower altitude
				to provide more precise positioning and communication services. However, there are also many
				satellites in higher orbits, such as geostationary orbit, where they can remain stationary
				relative to the Earth's surface, providing constant coverage for satellite communication and
				other services.
			</p>

			<!-- A chart showing the top countries or organizations by the number of satellites they have in orbit -->
			<div>
				<p class="text-2xl font-medium">Who owns satellites?</p>
				<p class="text-slate-600">
					Satellite ownership within the countries and corporations with at least 15 satellites.
				</p>
			</div>
			<Treemap data={data.satelliteOwnersByCountry} />

			<p>
				While SpaceX owns almost half of the satellites in space, many organisations own just one or
				two satellites. Although spaceflight is democratized in the sense that anyone can launch a
				satellite with the appropriate national permissions, it is also a free market that can be
				exploited by a select few companies with disproportionate means and abilities to launch
				satellites. How many stakeholders have representational input in the quantities and purposes
				of satellites that are launched every year?
			</p>
		</section>

		<!-- The future -->
		<section class="space-y-5">
			<h2 class="text-3xl font-bold">The future of space exploration</h2>

			<p>
				As the space industry continues to grow, the number of countries and organizations involved
				in space exploration will continue to expand. The future of space exploration will
				ultimately be determined by the countries that can develop the most advanced technologies
				and applications for satellites.
			</p>

			<div>
				<div>
					<p class="text-2xl font-medium">Satellites launched per year</p>
					<p class="text-slate-700">The number of satellites launched every year since 2000.</p>
				</div>
				<BarChart
					useColour={false}
					data={timeSeriesToCategorical(
						data.satellitesOverTime.filter((data) => data.year > 1999 && data.year < 2022)
					)}
					xTitle="Year"
					yTitle="Number of satellites launched"
				/>
			</div>

			<p>
				Each day new mega-constellations are assembled, generational milestones are reached, records
				are broken and our skies become increasingly clouded. At the dawn of a new space race full
				of possibility and innovation, instead of building more powerful devices to watch the Earth
				from afar, perhaps we should be looking beyond our skies - out towards the stars.
			</p>
		</section>
	</div>
{/if}
