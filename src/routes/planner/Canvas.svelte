<script module lang="ts">
	import { getContext } from "svelte";

	const EDITOR_CONTEXT = "EDITOR";
	export function getEditorContext() {
		return getContext<Editor>(EDITOR_CONTEXT);
	}
</script>

<script lang="ts">
	import { setContext } from "svelte";
	import EditorContextMenu from "./EditorContextMenu.svelte";
	import CanvasText from "./CanvasText.svelte";
	import CanvasImage from "./CanvasImage.svelte";
	import { applyBehaviors } from "$lib/headlessui/internal/behavior.svelte";
	import { listenerBehavior } from "$lib/headlessui/internal/events";
	import { Editor } from "./editor.svelte";

	type Props = {
		onCreate?: (editor: Editor) => void;
		width: number;
		height: number;
	};
	let { onCreate, width: clientWidth, height: clientHeight }: Props = $props();

	let canvasEl = $state<HTMLElement>();
	const editor = new Editor({
		get clientWidth() {
			return clientWidth;
		},
		get clientHeight() {
			return clientHeight;
		},
		get canvasEl() {
			return canvasEl;
		}
	});
	onCreate?.(editor);

	$effect(() => {
		if (canvasEl === undefined) return;
		return applyBehaviors(canvasEl, [
			listenerBehavior("keydown", editor.onKeyDown.bind(editor)),
			listenerBehavior("keypress", editor.onKeyPress.bind(editor), { passive: false }),
			listenerBehavior("keyup", editor.onKeyUp.bind(editor)),
			listenerBehavior("mousemove", editor.onMouseMove.bind(editor)),
			listenerBehavior("mousedown", editor.onMouseDown.bind(editor)),
			listenerBehavior("mouseup", editor.onMouseUp.bind(editor)),
			listenerBehavior("contextmenu", editor.onContextMenu.bind(editor)),
			listenerBehavior("wheel", editor.onWheel.bind(editor), { passive: false })
		]);
	});
	$effect(() => {
		return applyBehaviors(document as unknown as HTMLElement, [
			listenerBehavior("keydown", editor.onKeyDown.bind(editor), { passive: false }),
			listenerBehavior("keypress", editor.onKeyPress.bind(editor), { passive: false }),
			listenerBehavior("keyup", editor.onKeyUp.bind(editor))
		]);
	});

	setContext(EDITOR_CONTEXT, editor);
</script>

<div
	class="absolute {editor.cursor} inset-0 size-full touch-none select-none overflow-clip contain-strict"
	bind:this={canvasEl}
>
	<div
		class="with-cursor contain-[layout_style_size] absolute left-1/2 top-1/2 size-px"
		style="transform: scale({editor.zoom}) translate({-editor.offsetX}px, {-editor.offsetY}px)"
		style:--cursor={editor.cursor}
	>
		{#each Object.values(editor.elements) as element (element.id)}
			{#if element.type === "text"}
				<CanvasText id={element.id} />
			{:else if element.type === "image"}
				<CanvasImage id={element.id} />
			{/if}
		{/each}
	</div>

	<EditorContextMenu />

	<div
		class="absolute right-4 top-4 z-10 w-fit rounded-xl border border-gray-800 bg-gray-900"
		onwheel={(e) => e.stopPropagation()}
	>
		<p class="mx-4 my-1 font-mono text-lg text-gray-200">
			{(editor.zoom * 100).toFixed(0)}% Zoom
		</p>

		<p class="mx-4 my-1 max-w-60 text-base text-gray-200">
			{#snippet key(k: string)}
				<span
					class="rounded border-b-2 border-b-gray-500 bg-gray-700 px-2 py-px font-mono text-xs text-gray-200"
					>{k}</span
				>
			{/snippet}
			{@render key("Space")} + {@render key("L-Click")} + Drag - Pan
			<br />
			Scroll - Zoom
			<br />
			{@render key("R-Click")} - Add Item
		</p>
	</div>
</div>

<style>
	:global(.with-cursor *) {
		cursor: var(--cursor, auto);
	}
</style>
