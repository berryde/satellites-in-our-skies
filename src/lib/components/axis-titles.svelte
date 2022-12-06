<script>
	export let xTitle = 'Time';
	export let yTitle = 'Value';
	export let offsetX = 0;
	export let offsetY = 0;
</script>

<div class="flex flex-col items-center">
	<div class="flex items-center w-full">
		<div class="max-w-max" style="transform: translate(0, -{offsetY}px);">
			<p
				class="whitespace-nowrap rotate-180"
				style="text-orientation: mixed; writing-mode: vertical-rl; "
			>
				{yTitle}
			</p>
		</div>
		<div class="flex-grow w-full">
			<slot />
		</div>
	</div>

	<div class="max-h-min flex-grow-0" style="transform: translate({offsetX}px, 0);">
		<p>{xTitle}</p>
	</div>
</div>
