<!-- Compare 2 abitrary divs with a split-pane -->
<script lang="ts">
	import { FPS } from '$lib/constants';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	/**
	 * The size of the left pane as a percentage of the split pane's width.
	 */
	export let leftSize = 50;
	/**
	 * The size of the right pane as a percentage of the split pane's width.
	 */
	export let rightSize = 50;

	const dispatch = createEventDispatcher();

	let debouncing = false;
	let cursorData: {
		xPos: number;
		yPos: number;
		offset: number;
		leftSize: number;
		rightSize: number;
	};
	let resizing: boolean = false;
	let left: HTMLDivElement;
	let right: HTMLDivElement;
	let separator: HTMLDivElement;

	/**
	 * Called when the user clicks on the separator.
	 * This should start the resizing event.
	 * @param e The event of the user clicking on the separator.
	 */
	function mouseDown(e: MouseEvent) {
		e.preventDefault();
		if (e.button !== 0) return;
		setCursorData(e.clientX, e.clientY);
		if (!window) return;
		resizing = true;
		window.addEventListener('mousemove', mouseMove);
		window.addEventListener('mouseup', mouseUp);
		dispatch('resize');
	}

	/**
	 * Called when the user stops dragging the separator.
	 * @param e The mouse event for stopping the drag.
	 */
	function mouseUp(e: MouseEvent | undefined) {
		if (e) {
			e.preventDefault();
			if (e.button !== 0) return;
		}
		if (!window) return;
		window.document.body.style.cursor = 'default';
		resizing = false;
		window.removeEventListener('mousemove', mouseMove);
		window.removeEventListener('mouseup', mouseUp);
	}

	/**
	 * Update the sizes of the panes when the separator is dragged
	 * @param delta The change in separator X position
	 */
	function update(delta: number) {
		delta = Math.min(Math.max(delta, -cursorData.leftSize), cursorData.rightSize);
		const lw = ((cursorData.leftSize + delta) / width) * 100;
		const rw = 100 - lw;
		leftSize = lw;
		rightSize = rw;
		left.style.width = lw + '%';
		right.style.width = rw + '%';
	}

	/**
	 * Called when the user drags the separator.
	 * @param e The mouse event for this drag.
	 */
	function mouseMove(e: MouseEvent) {
		if (!debouncing) {
			// set the window cursor style to resize-x
			if (window) window.document.body.style.cursor = 'ew-resize';

			e.preventDefault();

			if (e.button !== 0) return;
			update(e.clientX - cursorData.xPos);

			// debounce the event
			debouncing = true;
			setTimeout(function () {
				debouncing = false;
			}, 1000 / FPS);
		}
	}

	/**
	 * Set the start data of a drag or touch event
	 *
	 * @param xPos The X position of the cursor
	 * @param yPos The Y position of the cursor
	 */
	function setCursorData(xPos: number, yPos: number) {
		cursorData = {
			xPos: xPos,
			yPos: yPos,
			offset: separator.offsetLeft,
			leftSize: left.offsetWidth,
			rightSize: right.offsetWidth
		};
	}

	/**
	 * Called when the application is resized.
	 */
	function resize() {
		mouseUp(undefined);
		resetSize();
	}

	/**
	 * Add a resize listener to reset the split ratio.
	 */
	onMount(() => {
		if (window) {
			window.addEventListener('resize', resize);
		}
	});
	onDestroy(() => {
		window.removeEventListener('resize', resize);
		window.removeEventListener('mousemove', mouseMove);
		window.removeEventListener('mouseup', mouseUp);
	});

	/**
	 * Revert to the default split.
	 */
	function resetSize() {
		if (left) left.removeAttribute('style');
		if (right) right.removeAttribute('style');
		if (separator) separator.removeAttribute('style');
	}
	$: leftSize && resetSize();
	$: rightSize && resetSize();

	let width: number;
</script>

<div
	class="flex relative will-change-transform w-full flex-grow h-96 bg-gray-100 rounded"
	style="--left-pane-size: {leftSize}%; --right-pane-size: {rightSize}%;"
	bind:clientWidth={width}
>
	<div
		bind:this={left}
		class="pane1 left-0 z-20 flex flex-col justify-center clip-content bg-neutral-200 h-full"
	>
		<slot name="left" />
	</div>
	<div
		class="h-full w-1.5 bg-slate-700 z-30 cursor-ew-resize separator"
		bind:this={separator}
		on:mousedown={mouseDown}
		on:mouseup={mouseUp}
	/>
	<div
		bind:this={right}
		class="pane2 right-0 flex flex-col justify-center bg-neutral-200 clip-content h-full"
	>
		<slot name="right" />
	</div>
	<div class="absolute z-30 left-5 bottom-5 flex flex-col text-sm">
		<div class="flex items-center space-x-2">
			<div class="rounded w-3 h-3 bg-stone-400" />
			<p>No data</p>
		</div>
		<div class="flex items-center justify-center space-x-2">
			<div class="rounded w-3 h-3 bg-gradient-to-r from-purple-800 to-yellow-300" />
			<p>Number of space missions</p>
		</div>
	</div>
</div>

<style lang="postcss">
	.pane1 {
		width: var(--left-pane-size);
		min-width: var(--min-left-pane-size);
	}
	.pane2 {
		width: var(--right-pane-size);
		min-width: var(--min-right-pane-size);
	}

	.clip-content {
		overflow: hidden;
		clip: rect(auto, auto, auto, auto);
		clip-path: polygon(0px 0px, 0px 100%, 100% 100%, 100% 0);
	}
</style>
