<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet; id?: string };
	let { children, id, ...props }: Props = $props();
</script>

<h3
	class="mb-4 ml-4 mt-6 scroll-my-sensical text-3xl font-bold text-white underline decoration-transparent first:mt-0 hover:decoration-white md:ml-0"
	{id}
	{...props}
>
	<a href="#{id}">{@render children()}</a>
</h3>
