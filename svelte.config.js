import { mdsvex } from "mdsvex";
import adapterCloudflare from "@sveltejs/adapter-cloudflare";
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		vitePreprocess(),
		mdsvex({
			layout: "./src/lib/mdsvex/layout.svelte"
		})
	],

	kit: {
		adapter: process.env.NODE_ENV === "development" ? adapter() : adapterCloudflare()
	},

	extensions: [".svelte", ".svx"]
};

export default config;
