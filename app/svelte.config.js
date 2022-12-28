import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		preprocess({
			postcss: true
		})
	],

	kit: {
		// it will run on localhost port 8080
		adapter: adapter({
			fallback: 'index.html',
			precompress: true
		}),
		alias: {
			$lib: './src/lib',
			$components: './src/components',
			src: './src'
		}
	}
};

export default config;
