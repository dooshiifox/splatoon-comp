import { mdsvex } from "mdsvex";
import adapterCloudflare from "@sveltejs/adapter-cloudflare";
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { remarkToc, rehypeToc } from "./table-of-contents.js";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		vitePreprocess(),
		mdsvex({
			layout: "./src/lib/mdsvex/layout.svelte",
			remarkPlugins: [remarkToc],
			rehypePlugins: [rehypeToc]
		})
	],

	kit: {
		adapter: process.env.NODE_ENV === "development" ? adapter() : adapterCloudflare()
	},

	extensions: [".svelte", ".svx"]
};

export default config;
