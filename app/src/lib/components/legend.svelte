<script lang="ts">
	import type { ScaleOrdinal } from 'd3-scale';
	import { createEventDispatcher } from 'svelte';

	export let color: ScaleOrdinal<string, string, never> | undefined = undefined;
	export let keys: string[];
	export let disabledKeys: string[] = [];
	export let interactive = true;
	export let subtitle = '';

	const dispatch = createEventDispatcher();

	function handleClick(key: string) {
		dispatch('click', key);
	}
</script>

<div class="space-y-1">
	<div class="flex flex-wrap gap-x-3 gap-y-3 text-sm">
		{#each keys as key}
			<div
				class="flex items-center bg-neutral-200 rounded px-1 transition-opacity {interactive &&
					'cursor-pointer'} select-none {disabledKeys.includes(key) && 'opacity-50'}"
				on:mouseenter={() => dispatch('mouseenter', key)}
				on:mouseleave={() => dispatch('mouseleave', key)}
				on:click={() => handleClick(key)}
				on:keypress={() => handleClick(key)}
			>
				{#if color != undefined}
					<div class="w-3 h-3 rounded mr-2" style={`background-color: ${color(key)}`} />
				{/if}

				<p>{key}</p>
			</div>
		{/each}
	</div>
	{#if subtitle}
		<p class="text-slate-600 text-sm">{subtitle}</p>
	{/if}
</div>
