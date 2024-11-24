<script lang="ts">
	import Canvas from "./Canvas.svelte";
	import type { Editor } from "./editor.svelte";

	type Props = {
		onCreate?: (editor: Editor) => void;
	};
	let { onCreate }: Props = $props();

	let clientWidth = $state(0);
	let clientHeight = $state(0);
</script>

<div class="h-full w-full bg-gray-950" bind:clientWidth bind:clientHeight>
	{#if clientWidth === 0 || clientHeight === 0}
		<div class="absolute inset-0 flex items-center justify-center">
			<p class="text-3xl font-bold text-slate-100">Loading...</p>
		</div>
	{:else}
		<Canvas {onCreate} width={clientWidth} height={clientHeight} />
	{/if}
</div>
