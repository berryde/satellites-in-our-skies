<script lang="ts">
	import type { OrbitCategory, Satellite } from '$lib/types';
	import { scaleLinear, scaleOrdinal } from 'd3-scale';
	import { zoomIdentity } from 'd3-zoom';
	import type { D3ZoomEvent } from 'd3-zoom';
	import * as THREE from 'three';
	import { zoom as D3Zoom, select } from 'd3';
	import { schemeTableau10 } from 'd3-scale-chromatic';
	import seedrandom from 'seedrandom';
	import Legend from './legend.svelte';
	import { OrbitCategories } from '$lib/constants';

	export let data: Satellite[];
	let filter: OrbitCategory = 'orbitClass';

	const FOV = 40;
	const NEAR = 10;
	const FAR = 5000;
	const EARTH_RADIUS = 6371;
	const PAN_MULTIPLIER = 2;
	const DEPTH = 0;

	const scene = new THREE.Scene();
	const earthTexture = new THREE.TextureLoader().load('images/earth.png');
	const circleTexture = new THREE.TextureLoader().load('images/circle-sprite.png');
	const rng = seedrandom('satellite');
	const circle = new THREE.PointsMaterial({
		size: 8,
		sizeAttenuation: false,
		map: circleTexture,
		vertexColors: true,
		transparent: true
	});

	let width = 0;
	let height = 0;
	let element: HTMLElement;

	const randomPosition = (r: number) => {
		const theta = rng.double() * 2 * Math.PI;
		return [r * Math.cos(theta), r * Math.sin(theta)];
	};

	function toRadians(angle: number) {
		return angle * (Math.PI / 180);
	}

	function scaleFromZ(z: number) {
		return (height / (Math.tan(toRadians(FOV / 2)) * z)) * 2;
	}

	function animate() {
		// setTimeout(function () {
		// 	requestAnimationFrame(animate);
		// }, 1000 / FPS);
		requestAnimationFrame(animate);
		renderer.render(scene, camera);
	}

	let zoomFactor = 1;
	function configure(width: number, height: number) {
		if (width == 0 && height == 0) return;

		renderer.setSize(width, height);

		// Initialise zoom
		const zoom = D3Zoom<HTMLCanvasElement, unknown>()
			.scaleExtent([scaleFromZ(FAR), scaleFromZ(NEAR)])
			.on('zoom', (e: D3ZoomEvent<HTMLCanvasElement, any>) => {
				zoomFactor = e.transform.k;
				camera.position.set(
					(-PAN_MULTIPLIER * (e.transform.x - width / 2)) / zoomFactor,
					(PAN_MULTIPLIER * (e.transform.y - height / 2)) / zoomFactor,
					scaleFromZ(zoomFactor)
				);
			});
		zoom.transform(
			select(renderer.domElement),
			zoomIdentity.translate(width / 2, height / 2).scale(scaleFromZ(FAR))
		);
		select(renderer.domElement).call(zoom);

		// Update the camera position on resize
		window.addEventListener('resize', () => {
			renderer.setSize(width, height);
			camera.updateProjectionMatrix();
		});

		render();
		animate();
	}

	function render() {
		scene.clear();

		// Create a a set of points from the data
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(
				vertices
					.filter((vertex) => keys.has(vertex[filter]))
					.map((vertex) => vertex.vertex)
					.flat(),
				3
			)
		);

		geometry.setAttribute(
			'color',
			new THREE.Float32BufferAttribute(
				vertices
					.filter((vertex) => keys.has(vertex[filter]))
					.map((vertex) => {
						return new THREE.Color(color(vertex[filter] ? vertex[filter] : 'Other')).toArray();
					})
					.flat(),
				3
			)
		);

		// Add the Earth to the scene
		const planet = new THREE.Sprite(new THREE.SpriteMaterial({ map: earthTexture }));
		planet.scale.set(scale(EARTH_RADIUS), scale(EARTH_RADIUS), 1);
		planet.position.z = -DEPTH;
		scene.add(planet);

		// Add the points to the scene
		scene.add(new THREE.Points(geometry, circle));

		scene.background = new THREE.Color(0x0f172a);
	}

	function setKeys(key: string) {
		// if the key is in keys, remove it else add it
		if (keys.has(key)) {
			keys.delete(key);
		} else {
			keys.add(key);
		}
		keys = keys;
	}

	let keys: Set<string>;
	$: keys = new Set(OrbitCategories[filter]);

	$: color = scaleOrdinal<string>().domain(OrbitCategories[filter]).range(schemeTableau10);

	$: renderer = new THREE.WebGLRenderer({ canvas: element });

	$: camera = new THREE.PerspectiveCamera(FOV, width / height, NEAR, FAR);

	// Map kilometers to pixels
	$: scale = scaleLinear()
		.domain([0, EARTH_RADIUS + Math.max(...data.map((s) => s.perigee))])
		.range([0, 2000]);

	$: vertices = data.map((datum) => {
		return {
			...datum,
			vertex: [...randomPosition(scale(EARTH_RADIUS + datum.perigee)), 0]
		};
	});

	$: configure(width, height);

	$: (keys || filter) && render();
</script>

<div>
	<div class="flex space-x-2 text-2xl font-medium">
		<p>The</p>
		<select bind:value={filter} class="rounded bg-neutral-200 max-w-min">
			<option value="orbitClass">orbit class</option>
			<option value="purpose">purposes</option>
			<option value="users">users</option>
		</select>
		<p>of the satellites orbiting Earth</p>
	</div>
	<p class="text-slate-600">A categorised, to-scale view of satellites from space.</p>
</div>
<div bind:clientWidth={width} bind:clientHeight={height} class="relative">
	<canvas bind:this={element} class="w-full h-full rounded" />
	<div class="absolute flex items-center space-x-2 bottom-3 right-5 text-white z-20">
		<p class="text-sm">{((EARTH_RADIUS * 2) / (zoomFactor / 2.47)).toFixed(0)}km</p>
		<div class="border-x border-b h-2" style="width: 100px" />
	</div>
</div>
<div class="flex relative flex-col space-y-5">
	<Legend
		{color}
		keys={OrbitCategories[filter]}
		disabledKeys={OrbitCategories[filter].filter((key) => !keys.has(key))}
		on:click={(e) => setKeys(e.detail)}
		subtitle="Click on a legend key to toggle visibility. Zoom and pan to explore the
		visualisation."
	/>
</div>
