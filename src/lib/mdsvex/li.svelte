<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet };
	let { children }: Props = $props();
</script>

<li class="ml-8 font-sans text-lg text-gray-200">{@render children()}</li>
