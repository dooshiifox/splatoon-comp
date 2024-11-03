<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet };
	let { children }: Props = $props();
</script>

<ul class="list-disc">{@render children()}</ul>
