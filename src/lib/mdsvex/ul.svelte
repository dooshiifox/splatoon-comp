<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet };
	let { children, ...props }: Props = $props();
</script>

<ul class="list-disc" {...props}>{@render children()}</ul>
