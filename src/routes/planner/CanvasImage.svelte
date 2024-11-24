<script lang="ts">
	import { fade } from "svelte/transition";
	import { getEditorContext } from "./Canvas.svelte";

	type Props = {
		id: string;
	};
	let { id }: Props = $props();
	let editor = getEditorContext();

	let thisEl = $derived(editor.getElement(id, "image"));
	let isSelected = $derived(editor.isElementSelected(id));

	let imgWidth = $state(0);
	let imgHeight = $state(0);
	/** `null` means the image loaded. */
	let startedLoadingAt = $state<number | null>(Date.now());
	let shouldFade = $state(true);

	// svelte-ignore non_reactive_update
	let index = 0;
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		thisEl.ty.url;
		startedLoadingAt = Date.now();
		index--;
	});
</script>

<div
	class="contain-[size_layout] absolute {isSelected
		? 'ring-[length:2px/var(--editor-zoom)] ring-blue-500'
		: editor.isElementSelectable(thisEl)
			? 'ring-blue-500 hover:ring-[length:2px/var(--editor-zoom)]'
			: ''}"
	style:top="{thisEl.y}px"
	style:left="{thisEl.x}px"
	style:--editor-zoom={editor.zoom.animated * editor.getScale(id)}
	style:z-index={thisEl.z_index}
	style:transform={editor.calculateElementTransform(id)}
	style:width="{imgWidth}px"
	style:height="{imgHeight}px"
	data-id={id}
>
	{#key thisEl.ty.url}
		<img
			alt=""
			src={thisEl.ty.url}
			draggable="false"
			class="absolute inset-0 bg-cover object-cover transition-opacity {shouldFade
				? 'duration-200'
				: 'duration-0'}"
			class:opacity-0={startedLoadingAt !== null}
			style:z-index={index}
			onload={(e) => {
				shouldFade = Date.now() - (startedLoadingAt ?? 0) > 50;
				startedLoadingAt = null;
				imgWidth = (e.currentTarget as HTMLImageElement).naturalWidth;
				imgHeight = (e.currentTarget as HTMLImageElement).naturalHeight;
			}}
			onerror={() => (startedLoadingAt = null)}
			out:fade={{ duration: 100 }}
		/>
	{/key}
</div>
