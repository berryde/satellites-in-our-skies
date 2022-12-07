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
	import { FPS, OrbitCategories } from '$lib/constants';

	export let data: Satellite[];
	let filter: OrbitCategory = 'orbitClass';

	const FOV = 40;
	const NEAR = 10;
	const FAR = 5000;
	const EARTH_RADIUS = 6371;
	const PAN_MULTIPLIER = 2;
	const DEPTH = 0;

	const scene = new THREE.Scene();
	const earthTexture = new THREE.TextureLoader().load('earth.png');
	const circleTexture = new THREE.TextureLoader().load('circle-sprite.png');
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
		setTimeout(function () {
			requestAnimationFrame(animate);
		}, 1000 / FPS);
		renderer.render(scene, camera);
	}

	function configure(width: number, height: number) {
		if (width == 0 && height == 0) return;

		renderer.setSize(width, height);

		// Initialise zoom
		const zoom = D3Zoom<HTMLCanvasElement, unknown>()
			.scaleExtent([scaleFromZ(FAR), scaleFromZ(NEAR)])
			.on('zoom', (e: D3ZoomEvent<HTMLCanvasElement, any>) => {
				const scale = e.transform.k;
				camera.position.set(
					(-PAN_MULTIPLIER * (e.transform.x - width / 2)) / scale,
					(PAN_MULTIPLIER * (e.transform.y - height / 2)) / scale,
					scaleFromZ(scale)
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

		const orbits: Record<
			string,
			{
				altitude: number;
				color: string;
			}
		> = {
			GEO: {
				altitude: 38000,
				color: '#525252'
			},
			MEO: {
				altitude: 25000,
				color: '#737373'
			},
			LEO: {
				altitude: 2000,
				color: '#d4d4d4'
			}
		};
		// Create a single point geometry
		//TODO: add text

		Object.keys(orbits).forEach((key) => {
			const orbit = orbits[key];
			const point = new THREE.Sprite(
				new THREE.SpriteMaterial({ map: circleTexture, color: orbit.color, opacity: 0.2 })
			);

			// // Create:
			// const myText = new Text();
			// myScene.add(myText);

			// // Set properties to configure:
			// myText.text = 'Hello world!';
			// myText.fontSize = 0.2;
			// myText.position.z = -2;
			// myText.color = 0x9966ff;

			// // Update the rendering:
			// myText.sync();

			const diameter = scale(2 * orbit.altitude + 2 * EARTH_RADIUS);
			point.scale.set(diameter, diameter, 1);
			point.position.z = -DEPTH;
			scene.add(point);
		});

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

<canvas
	bind:clientWidth={width}
	bind:clientHeight={height}
	bind:this={element}
	class="w-full rounded"
	height="250px"
/>

<div class="flex flex-col space-y-5">
	<select bind:value={filter} class="bg-neutral-200 rounded p-1 max-w-min">
		<option value="orbitClass">Orbit class</option>
		<option value="purpose">Purpose</option>
		<option value="users">Users</option>
	</select>
	<Legend
		{color}
		keys={OrbitCategories[filter]}
		disabledKeys={OrbitCategories[filter].filter((key) => !keys.has(key))}
		on:click={(e) => setKeys(e.detail)}
		subtitle="Click on a legend key to toggle visibility"
	/>
</div>
