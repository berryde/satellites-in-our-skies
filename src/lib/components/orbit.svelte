<script lang="ts">
	import type { Satellite } from '$lib/types';
	import { scaleLinear, scaleOrdinal, type ScaleLinear } from 'd3-scale';
	import { onMount } from 'svelte';
	import { zoomIdentity } from 'd3-zoom';
	import type { D3ZoomEvent } from 'd3-zoom';
	import * as THREE from 'three';
	import { zoom as D3Zoom, select } from 'd3';
	import type { WebGLRenderer } from 'three';
	import { schemeTableau10 } from 'd3-scale-chromatic';
	import seedrandom from 'seedrandom';

	// Set a seed for the random number generator
	const rng = seedrandom('satellite');

	export let satellites: Satellite[];
	export let filter: 'purpose' | 'orbitClass' | 'users' = 'orbitClass';

	const FOV = 40;
	const NEAR = 10;
	const FAR = 5000;
	const EARTH_RADIUS = 6371;
	const DEPTH = 0;
	const values = {
		purpose: [
			'Communications',
			'Earth Observation',
			'Navigation',
			'Space Science',
			'Technology Development',
			'Other'
		],
		orbitClass: ['LEO', 'MEO', 'GEO', 'HEO', 'Elliptical', 'Other'],
		users: ['Commercial', 'Civil', 'Government', 'Military', 'Other']
	};

	const getColor = (value: string, options: string[], colors: string[]) => {
		const index = options.indexOf(value);
		return index === -1 ? colors[options.indexOf('Other')] : colors[options.indexOf(value)];
	};

	let width: number;
	let height: number;

	const randomPosition = (r: number) => {
		// get a random point on the circle with radius r
		const theta = rng.double() * 2 * Math.PI;
		const x = r * Math.cos(theta);
		const y = r * Math.sin(theta);
		return [x, y];
	};

	function toRadians(angle: number) {
		return angle * (Math.PI / 180);
	}

	$: color = scaleOrdinal<string>().domain(values[filter]).range(schemeTableau10);

	const render = () => {
		function getScaleFromZ(z: number) {
			let half_fov = FOV / 2;
			let half_fov_radians = toRadians(half_fov);
			let half_fov_height = Math.tan(half_fov_radians) * z;
			let fov_height = half_fov_height * 2;
			let scale = height / fov_height; // Divide visualization height by height derived from field of view
			return scale;
		}

		function getZFromScale(scale: number) {
			let half_fov = FOV / 2;
			let half_fov_radians = toRadians(half_fov);
			let scale_height = height / scale;
			let camera_z_position = scale_height / (2 * Math.tan(half_fov_radians));
			return camera_z_position;
		}

		renderer.setSize(width, height);

		// Configure zoom
		const zoom = D3Zoom<HTMLCanvasElement, unknown>()
			.scaleExtent([getScaleFromZ(FAR), getScaleFromZ(NEAR)])
			.on('zoom', (e: D3ZoomEvent<HTMLCanvasElement, any>) => {
				let scale = e.transform.k;
				let x = -(e.transform.x - width / 2) / scale;
				let y = (e.transform.y - height / 2) / scale;
				let z = getZFromScale(scale);
				camera.position.set(x, y, z);
			});

		select(renderer.domElement).call(zoom);
		zoom.transform(
			select(renderer.domElement),
			zoomIdentity.translate(width / 2, height / 2).scale(getScaleFromZ(FAR))
		);
		camera.position.set(0, 0, FAR);

		window.addEventListener('resize', () => {
			renderer.setSize(width, height);
			camera.updateProjectionMatrix();
		});

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute(
			'color',
			new THREE.Float32BufferAttribute(
				satellites
					.map((satellite) => {
						return new THREE.Color(color(satellite[filter])).toArray();
					})
					.flat(),
				3
			)
		);

		const material = new THREE.PointsMaterial({
			size: 8,
			sizeAttenuation: false,
			map: circle,
			vertexColors: true,
			transparent: true
		});

		const points = new THREE.Points(geometry, material);
		scene.add(points);

		const planet = new THREE.Sprite(new THREE.SpriteMaterial({ map: earth }));

		planet.scale.set(scale(EARTH_RADIUS), scale(EARTH_RADIUS), 1);
		planet.position.z = -DEPTH;
		scene.add(planet);

		scene.background = new THREE.Color(0x0f172a);

		// Three.js render loop
		function animate() {
			requestAnimationFrame(animate);
			renderer.render(scene, camera);
		}
		animate();
	};

	let vertices: number[] = [];
	let scale: ScaleLinear<number, number, never>;
	let loaded = false;
	let renderer: WebGLRenderer;
	let camera: THREE.PerspectiveCamera;

	const scene = new THREE.Scene();
	const circle = new THREE.TextureLoader().load('circle-sprite.png');
	const earth = new THREE.TextureLoader().load('earth.png');

	onMount(() => {
		// Initialize Three.js
		renderer = new THREE.WebGLRenderer({ canvas: element });
		camera = new THREE.PerspectiveCamera(FOV, width / height, NEAR, FAR);

		// Create a scale for mapping kilometers to pixels
		scale = scaleLinear()
			.domain([0, EARTH_RADIUS + Math.max(...satellites.map((s) => s.perigee))])
			.range([0, 2000]);

		// Initialise the satellite positions so that they don't move on re-render
		for (let i = 0; i < satellites.length; i++) {
			vertices.push(...randomPosition(scale(EARTH_RADIUS + satellites[i].perigee)), 0);
		}

		render();
		loaded = true;
	});

	let element: HTMLElement;

	$: loaded && filter && render();
</script>

<canvas
	bind:clientWidth={width}
	bind:clientHeight={height}
	bind:this={element}
	class="w-full rounded"
	height="250px"
/>
<div class="flex space-x-3">
	{#each values[filter] as value}
		<div class="flex items-center bg-neutral-200 rounded px-1">
			<div class="w-4 h-4 rounded-full mr-2" style={`background-color: ${color(value)}`} />
			<p>{value}</p>
		</div>
	{/each}
</div>
