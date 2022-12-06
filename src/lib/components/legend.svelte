<script lang="ts">
	import { colorScheme } from '$lib/common';
	import { scaleOrdinal } from 'd3-scale';
	import { createEventDispatcher } from 'svelte';

	export let keys: string[];
	export let subtitle = 'Hover over a legend key to filter the visualisation';

	const dispatch = createEventDispatcher();

	const color = scaleOrdinal<string>().domain(keys).range(colorScheme);

	function handleClick(key: string) {
		console.log('click', key);
		dispatch('click', key);
	}
</script>

<div class="space-y-1">
	<div class="flex flex-wrap space-x-3 text-sm">
		{#each keys as key}
			<div
				class="flex items-center bg-neutral-200 rounded px-1 cursor-pointer select-none"
				on:mouseenter={() => dispatch('mouseenter', key)}
				on:mouseleave={() => dispatch('mouseleave', key)}
				on:click={() => handleClick(key)}
				on:keypress={() => handleClick(key)}
			>
				<div class="w-4 h-4 rounded-full mr-2" style={`background-color: ${color(key)}`} />
				<p>{key}</p>
			</div>
		{/each}
	</div>
	<p class="text-slate-500 text-sm">{subtitle}</p>
</div>
