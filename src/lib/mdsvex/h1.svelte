<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet };
	let { children }: Props = $props();
</script>

<h1 class="text-4xl font-bold text-white">{@render children()}</h1>
