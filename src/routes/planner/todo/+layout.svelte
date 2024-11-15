<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-dvh w-full bg-gray-900 px-4">
	<article class="mx-auto max-w-2xl pb-40 pt-12 md:pt-28">
		{@render children()}
	</article>
</div>
