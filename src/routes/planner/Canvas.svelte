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
	import { Editor, RENDER_TOUCH_POINTS } from "./editor.svelte";
	import { dev } from "$app/environment";

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
			listenerBehavior("keydown", editor.onKeyDown.bind(editor), { passive: false }),
			listenerBehavior("keypress", editor.onKeyPress.bind(editor), { passive: false }),
			listenerBehavior("keyup", editor.onKeyUp.bind(editor)),
			listenerBehavior("mousemove", editor.onMouseMove.bind(editor)),
			listenerBehavior("mousedown", editor.onMouseDown.bind(editor)),
			listenerBehavior("mouseup", editor.onMouseUp.bind(editor)),
			listenerBehavior("touchmove", editor.onTouchMove.bind(editor)),
			listenerBehavior("touchstart", editor.onTouchDown.bind(editor)),
			listenerBehavior("touchend", editor.onTouchUp.bind(editor)),
			listenerBehavior("touchcancel", editor.onTouchUp.bind(editor)),
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

	{#if dev && RENDER_TOUCH_POINTS}
		{#each editor.touchPoints.points as [, touchPoint] (touchPoint.identifier)}
			{@const diffX = touchPoint.start.x - touchPoint.current.x}
			{@const diffY = touchPoint.start.y - touchPoint.current.y}
			<div
				class="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500"
				style:left="{touchPoint.current.x}px"
				style:top="{touchPoint.current.y}px"
			></div>
			<div
				class="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-500"
				style:left="{touchPoint.start.x}px"
				style:top="{touchPoint.start.y}px"
			></div>
			<div
				class="absolute h-px origin-top-left bg-purple-500"
				style:left="{touchPoint.current.x}px"
				style:top="{touchPoint.current.y}px"
				style:width="{Math.hypot(diffX, diffY)}px"
				style:transform="rotate({Math.atan2(diffY, diffX)}rad)"
			></div>
		{/each}
	{/if}

	<EditorContextMenu />
</div>

<style>
	:global(.with-cursor *) {
		cursor: var(--cursor, auto);
	}
</style>
