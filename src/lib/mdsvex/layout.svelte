<script module lang="ts">
	import type { Snippet } from "svelte";
	import h1 from "./h1.svelte";
	import p from "./p.svelte";
	import ul from "./ul.svelte";
	import li from "./li.svelte";
	import a from "./a.svelte";

	export { h1, p, ul, li, a };
</script>

<script lang="ts">
	type Props = { children: Snippet };
	let { children }: Props = $props();
</script>

{@render children()}
