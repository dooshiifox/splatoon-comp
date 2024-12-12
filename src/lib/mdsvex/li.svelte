<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet };
	let { children, ...props }: Props = $props();
</script>

<li class="ml-8 font-sans text-lg text-gray-200" {...props}>{@render children()}</li>
