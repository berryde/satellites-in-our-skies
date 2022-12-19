<script lang="ts">
	import type { TreemapData } from '$lib/types';
	import { hierarchy, treemap } from 'd3-hierarchy';
	import { onMount } from 'svelte';
	import { colorScheme } from '$lib/common';
	import { scaleOrdinal } from 'd3-scale';
	import Legend from './legend.svelte';
	// Treemap using D3

	export let data: TreemapData;
	type LeafData = {
		name: string;
		value: number;
		x0: number;
	};

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
	$: root = hierarchy<LeafData>(data).sum((d) => d.value);
	$: treemap<LeafData>().size([width, height]).padding(1)(root);
	$: total = root.leaves().reduce((acc, leaf) => acc + leaf.data.value, 0);

	function percentage(value: number) {
		return ((value / total) * 100).toFixed(1);
	}
</script>

<div bind:clientHeight={height} bind:clientWidth={width}>
	<div style="width: {width}px; height: {height}px;" class="relative">
		{#if loaded}
			{#each root.leaves() as leaf}
				<div
					style="left: {leaf.x0}px; top: {leaf.y0}px; width: {leaf.x1 -
						leaf.x0}px; height: {leaf.y1 - leaf.y0}px; background-color: {color(
						leaf.parent.data.name
					)};"
					class="absolute overflow-hidden cursor-pointer p-1 hover:opacity-75 transition-opacity"
					title="{leaf.data.name} owns {leaf.data.value} satellites ({percentage(
						leaf.data.value
					)}%)"
				>
					<div class="text-xs font-medium">
						<p>{percentage(leaf.data.value)}% {leaf.data.name}</p>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
<Legend
	keys={data.children.map((c) => c.name)}
	{color}
	interactive={false}
	subtitle="Hover over any treemap tile to
	view more detail about that organisation."
/>
