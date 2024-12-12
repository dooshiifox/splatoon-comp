<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet };
	let { children, ...props }: Props = $props();
</script>

<p class="mb-2 font-sans text-lg text-gray-200" {...props}>{@render children()}</p>
