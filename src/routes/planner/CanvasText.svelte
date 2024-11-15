<script lang="ts">
	import { untrack } from "svelte";
	import { getEditorContext } from "./Canvas.svelte";
	import { getHighestContrast } from "$lib/apca";

	type Props = {
		id: string;
	};
	let { id }: Props = $props();
	let editor = getEditorContext();

	let thisEl = $derived(editor.getElement(id, "text"));

	let width = $state(0);
	let height = $state(0);

	let el = $state<HTMLTextAreaElement>();
	$effect(() =>
		untrack(() => {
			if (editor.queuedFocus === id) {
				el?.focus();
			}
		})
	);

	let fontFamily = $derived(
		{
			sans: "font-sans",
			mono: "font-mono",
			"splatoon-block": "font-splatoon-block",
			"splatoon-text": "font-splatoon-text"
		}[thisEl.font]
	);
	function onKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			el?.blur();
		}
	}
	function onBlur() {
		if (el === undefined) return;

		if (el.value !== "") {
			editor.updateElement(id, { content: el.value });
			editor.deselectElement(id);
		} else {
			editor.deleteElement(id);
		}
	}

	let isSelected = $derived(editor.isElementSelected(id));
	let isEditable = $derived(editor.isOnlyElementSelected(id));

	// svelte-ignore state_referenced_locally
	let value = $state(thisEl.content);
	let textShadow = $derived(getHighestContrast(thisEl.color, ["#ffffff", "#000000"]));
</script>

<div
	class="contain-[size_layout] absolute {isSelected
		? 'ring-[length:2px/var(--editor-zoom)] ring-blue-500'
		: thisEl.selectable
			? 'ring-blue-500 hover:ring-[length:2px/var(--editor-zoom)]'
			: ''}"
	style:top="{thisEl.centerY}px"
	style:left="{thisEl.centerX}px"
	style:--editor-zoom={editor.zoom.animated * editor.getScale(id)}
	style:z-index={thisEl.zIndex}
	style:transform={editor.calculateElementTransform(id)}
	style:width="{width + 8}px"
	style:height="{height + 8}px"
	data-id={id}
>
	<textarea
		bind:this={el}
		class="text-shadow size-full resize-none overflow-hidden border-0 bg-transparent p-0 pl-0.5 pt-0.5 text-center align-top text-2xl outline-none !ring-0 {fontFamily}"
		class:pointer-events-none={!isEditable}
		style:color={thisEl.color}
		style:--text-shadow={textShadow}
		onkeydown={onKeyDown}
		onblur={onBlur}
		readonly={!isEditable}
		bind:value
	></textarea>

	<p
		class="pointer-events-none absolute left-0 top-0 select-none whitespace-pre text-center text-2xl opacity-0 {fontFamily}"
		bind:clientHeight={height}
		bind:clientWidth={width}
	>
		{value.replaceAll("\n\n", "\nI\n").replace(/^\n/, "I\n").replace(/\n$/, "\nI") || "I"}
	</p>
</div>

<style>
	.text-shadow {
		--offset-amount: 1px;
		/* -webkit-text-stroke: calc(var(--offset-amount) / var(--editor-zoom)) var(--text-shadow); */
		text-shadow:
			calc(var(--offset-amount) / var(--editor-zoom))
				calc(var(--offset-amount) / var(--editor-zoom)) var(--text-shadow),
			calc(-1 * var(--offset-amount) / var(--editor-zoom))
				calc(var(--offset-amount) / var(--editor-zoom)) var(--text-shadow),
			calc(var(--offset-amount) / var(--editor-zoom))
				calc(-1 * var(--offset-amount) / var(--editor-zoom)) var(--text-shadow),
			calc(-1 * var(--offset-amount) / var(--editor-zoom))
				calc(-1 * var(--offset-amount) / var(--editor-zoom)) var(--text-shadow);
	}
</style>
