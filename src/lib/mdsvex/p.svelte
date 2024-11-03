<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet };
	let { children }: Props = $props();
</script>

<p class="mb-2 font-sans text-lg text-gray-200">{@render children()}</p>
