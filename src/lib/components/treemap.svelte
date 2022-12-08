<script lang="ts">
	import type { TreemapData } from '$lib/types';
	import { hierarchy, treemap } from 'd3-hierarchy';
	import { onMount } from 'svelte';
	import { colorScheme } from '$lib/common';
	import { scaleOrdinal } from 'd3-scale';
	import Legend from './legend.svelte';
	// Treemap using D3

	export let data: TreemapData;

	const color = scaleOrdinal<string>()
		.domain(data.children.map((d) => d.name))
		.range(colorScheme);

	let width = 500;
	let height = 500;
	let loaded = false;
	onMount(() => {
		loaded = true;
	});

	// @ts-ignore
	$: root = hierarchy(data).sum((d) => d.value);
	$: treemap().size([width, height]).padding(1)(root);
	$: console.log(root.leaves());
</script>

<div bind:clientHeight={height} bind:clientWidth={width}>
	<div style="width: {width}px; height: {height}px;" class="relative">
		{#if loaded}
			{#each root.leaves() as leaf}
				<div
					style="position: absolute; left: {leaf.x0}px; top: {leaf.y0}px; width: {leaf.x1 -
						leaf.x0}px; height: {leaf.y1 - leaf.y0}px; background: {color(leaf.parent.data.name)};"
					class="overflow-hidden cursor-pointer"
				>
					<p class="text-xs font-medium ml-1">{leaf.data.name}</p>
				</div>
			{/each}
		{/if}
	</div>
</div>
<Legend keys={data.children.map((c) => c.name)} {color} />
