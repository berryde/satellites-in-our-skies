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
	export let filter: OrbitCategory = 'orbitClass';

	const FOV = 40;
	const NEAR = 10;
	const FAR = 5000;
	const EARTH_RADIUS = 6371;
	const DEPTH = 0;

	const scene = new THREE.Scene();
	const earth = new THREE.TextureLoader().load('earth.png');
	const rng = seedrandom('satellite');
	const circle = new THREE.PointsMaterial({
		size: 8,
		sizeAttenuation: false,
		map: new THREE.TextureLoader().load('circle-sprite.png'),
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

	function zFromScale(scale: number) {
		return height / scale / (2 * Math.tan(toRadians(FOV / 2)));
	}

	function animate() {
		setTimeout(function () {
			requestAnimationFrame(animate);
		}, 1000 / FPS);
		renderer.render(scene, camera);
	}

	function render(width: number, height: number) {
		if (width == 0 && height == 0) return;

		console.log('running render', width, height);
		renderer.setSize(width, height);

		// Initialise zoom
		const zoom = D3Zoom<HTMLCanvasElement, unknown>()
			.scaleExtent([scaleFromZ(FAR), scaleFromZ(NEAR)])
			.on('zoom', (e: D3ZoomEvent<HTMLCanvasElement, any>) => {
				const scale = e.transform.k;
				camera.position.set(
					-(e.transform.x - width / 2) / scale,
					(e.transform.y - height / 2) / scale,
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

		// Create a a set of points from the data
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute(
			'color',
			new THREE.Float32BufferAttribute(
				data
					.map((datum) => {
						return new THREE.Color(color(datum[filter])).toArray();
					})
					.flat(),
				3
			)
		);

		// Add the points to the scene
		scene.add(new THREE.Points(geometry, circle));

		// Add the Earth to the scene
		const planet = new THREE.Sprite(new THREE.SpriteMaterial({ map: earth }));
		planet.scale.set(scale(EARTH_RADIUS), scale(EARTH_RADIUS), 1);
		planet.position.z = -DEPTH;
		scene.add(planet);

		// Trigger the animation loop
		animate();
	}

	$: color = scaleOrdinal<string>().domain(OrbitCategories[filter]).range(schemeTableau10);

	$: renderer = new THREE.WebGLRenderer({ canvas: element });

	$: camera = new THREE.PerspectiveCamera(FOV, width / height, NEAR, FAR);

	$: scale = scaleLinear()
		.domain([0, EARTH_RADIUS + Math.max(...data.map((s) => s.perigee))])
		.range([0, 2000]);

	$: vertices = data
		.map((datum) => {
			return [...randomPosition(scale(EARTH_RADIUS + datum.perigee)), 0];
		})
		.flat();

	$: render(width, height);
</script>

<canvas
	bind:clientWidth={width}
	bind:clientHeight={height}
	bind:this={element}
	class="w-full rounded"
	height="250px"
/>

<Legend keys={OrbitCategories[filter]} />
